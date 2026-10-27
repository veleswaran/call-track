<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\CustomerSummaryFilterDTO;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

final class GetCustomerSummaryAction
{
    public function execute(CustomerSummaryFilterDTO $filters): LengthAwarePaginator
    {
        $missedSql = CallLog::SQL_MISSED_CONDITION;

        $query = DB::table('call_logs')
            ->join('devices', 'devices.id', '=', 'call_logs.device_id')
            ->leftJoin('agents', 'agents.id', '=', DB::raw('COALESCE(call_logs.agent_id, devices.agent_id)'))
            ->leftJoin('contacts as c', 'c.phone_hash', '=', 'call_logs.phone_number_hash');

        if ($filters->startDate && $filters->endDate) {
            $query->whereBetween('call_logs.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                return new ConcretePaginator([], 0, $filters->perPage, $filters->page ?? 1);
            }
            $query->whereIn('agents.id', $filters->allowedAgentIds);
        }

        if (! empty($filters->agentIds)) {
            $query->whereIn('agents.id', $filters->agentIds);
        }

        if (! empty($filters->teamIds)) {
            $query->whereIn('agents.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        if (! empty($filters->types)) {
            $query->leftJoin('call_classifications as cc', 'call_logs.id', '=', 'cc.call_log_id')
                ->whereIn('cc.type', array_map('strtoupper', $filters->types));
        }

        if ($filters->simSlot !== null) {
            $query->where('call_logs.sim_slot', $filters->simSlot);
        }

        if (! empty($filters->search)) {
            $search = '%'.$filters->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('call_logs.phone_contact_name', 'ilike', $search)
                    ->orWhere('c.name', 'ilike', $search);
            });
        }

        $query->select([
            'call_logs.phone_number_hash',
            DB::raw('MAX(call_logs.phone_number) as raw_phone_number'),
            DB::raw('MAX(call_logs.phone_contact_name) as phone_contact_name'),
            DB::raw('MAX(c.name) as contact_name'),
            DB::raw('MAX(CASE WHEN c.is_internal IS TRUE THEN 1 ELSE 0 END) as is_internal'),
            DB::raw('COUNT(call_logs.id) as total_calls'),
            DB::raw("COUNT(CASE WHEN {$missedSql} THEN 1 END) as missed_calls"),
            DB::raw('COALESCE(SUM(call_logs.duration), 0) as total_duration'),
            DB::raw('COALESCE(AVG(CASE WHEN call_logs.duration > 0 THEN call_logs.duration END), 0) as avg_duration'),
            DB::raw('MAX(call_logs.timestamp) as last_call_at'),
        ])
            ->groupBy('call_logs.phone_number_hash');

        // Tab sub-filter
        if ($filters->tab === 'with-missed') {
            $query->havingRaw("COUNT(CASE WHEN {$missedSql} THEN 1 END) > 0");
        }

        $sortColumn = match ($filters->sortBy) {
            'missed', 'missed_calls' => 'missed_calls',
            'total_duration', 'duration' => 'total_duration',
            'total_calls' => 'total_calls',
            default => null,
        };

        if ($sortColumn) {
            $query->orderBy($sortColumn, $filters->sortOrder)
                ->orderByDesc('last_call_at');
        } elseif ($filters->tab === 'with-missed') {
            $query->orderByDesc('missed_calls')
                ->orderByDesc('last_call_at');
        } elseif ($filters->tab === 'high-duration') {
            $query->orderByDesc('total_duration')
                ->orderByDesc('last_call_at');
        } else {
            $query->orderByDesc('total_calls')
                ->orderByDesc('last_call_at');
        }

        /** @var ConcretePaginator $paginator */
        $paginator = $query->paginate(perPage: $filters->perPage, page: $filters->page ?? 1);

        $hashes = $paginator->getCollection()->pluck('phone_number_hash')->filter()->all();

        if (empty($hashes)) {
            return $paginator;
        }

        // Query 2: Fetch latest call details for these hashes
        $latestCalls = DB::table('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->leftJoin('agents as a', 'a.id', '=', DB::raw('COALESCE(cl.agent_id, d.agent_id)'))
            ->whereIn('cl.phone_number_hash', $hashes)
            ->whereIn('cl.id', function ($sub) use ($hashes) {
                $sub->select(DB::raw('MAX(id)'))
                    ->from('call_logs')
                    ->whereIn('phone_number_hash', $hashes)
                    ->groupBy('phone_number_hash');
            })
            ->select([
                'cl.phone_number_hash',
                'cl.direction',
                'cl.duration',
                'cl.timestamp',
                'a.name as agent_name',
                'a.employee_code as agent_code',
            ])
            ->get()
            ->keyBy('phone_number_hash');

        // Query 3: Fetch Primary Agent (agent who handled the most calls for this phone number)
        $primaryAgents = DB::table('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->join('agents as a', 'a.id', '=', DB::raw('COALESCE(cl.agent_id, d.agent_id)'))
            ->leftJoin('team_members as tm', 'tm.agent_id', '=', 'a.id')
            ->leftJoin('teams as t', 't.id', '=', 'tm.team_id')
            ->whereIn('cl.phone_number_hash', $hashes)
            ->select([
                'cl.phone_number_hash',
                'a.name as agent_name',
                DB::raw('MAX(t.name) as team_name'),
                DB::raw('COUNT(cl.id) as handled_count'),
            ])
            ->groupBy(['cl.phone_number_hash', 'a.name'])
            ->orderByDesc('handled_count')
            ->get()
            ->groupBy('phone_number_hash')
            ->map(fn ($group) => $group->first());

        $paginator->getCollection()->transform(function ($item) use ($latestCalls, $primaryAgents) {
            $customerName = $item->contact_name ?: ($item->phone_contact_name ?: 'Unknown Customer');
            $isInternal = ((int) ($item->is_internal ?? 0)) === 1;
            $organization = $isInternal ? 'Internal Staff' : ($item->contact_name ? 'Enterprise Account' : 'External Customer');

            $phoneNumber = null;
            if (! empty($item->raw_phone_number)) {
                try {
                    $phoneNumber = Crypt::decryptString($item->raw_phone_number);
                } catch (\Throwable) {
                    $phoneNumber = $item->raw_phone_number;
                }
            }
            if (! $phoneNumber) {
                $phoneNumber = $item->phone_contact_name ?: '+91 98400 00000';
            }
            if (! str_starts_with($phoneNumber, '+')) {
                $phoneNumber = '+91 '.$phoneNumber;
            }

            // Latest call details
            $latest = $latestCalls->get($item->phone_number_hash);
            $lastCallData = null;
            if ($latest) {
                $isMissed = in_array(strtoupper($latest->direction), ['MISSED', 'REJECTED', 'BLOCKED']) || ($latest->direction === 'INCOMING' && $latest->duration <= 0);
                $durationFormatted = $isMissed ? 'Missed' : $this->formatDuration((int) $latest->duration);
                $lastCallData = [
                    'time' => $latest->timestamp ? $this->formatRelativeDate($latest->timestamp) : 'N/A',
                    'raw_time' => $latest->timestamp,
                    'direction' => strtoupper($latest->direction),
                    'duration_formatted' => $durationFormatted,
                    'is_missed' => $isMissed,
                    'agent_name' => $latest->agent_name ?: 'System',
                    'agent_code' => $latest->agent_code ?: 'N/A',
                ];
            }

            // Primary agent details
            $primary = $primaryAgents->get($item->phone_number_hash);
            $primaryAgentData = [
                'name' => $primary?->agent_name ?: 'Unassigned',
                'team' => $primary?->team_name ?: 'General',
            ];

            return [
                'phone_hash' => $item->phone_number_hash,
                'customer_name' => $customerName,
                'organization' => $organization,
                'phone_number' => $phoneNumber,
                'total_calls' => (int) $item->total_calls,
                'missed_calls' => (int) $item->missed_calls,
                'total_duration' => $this->formatDuration((int) $item->total_duration),
                'total_duration_raw' => (int) $item->total_duration,
                'avg_duration' => $this->formatDuration((int) round((float) $item->avg_duration)),
                'avg_duration_raw' => (int) round((float) $item->avg_duration),
                'last_call' => $lastCallData,
                'primary_agent' => $primaryAgentData,
            ];
        });

        return $paginator;
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $hours = floor($seconds / 3600);
        $mins = floor(($seconds % 3600) / 60);

        if ($hours > 0) {
            return "{$hours}h {$mins}m";
        }

        return "{$mins}m";
    }

    private function formatRelativeDate(string $timestamp): string
    {
        $dt = Carbon::parse($timestamp);
        if ($dt->isToday()) {
            return 'Today, '.$dt->format('h:i A');
        }
        if ($dt->isYesterday()) {
            return 'Yesterday, '.$dt->format('h:i A');
        }

        return $dt->format('M d, h:i A');
    }
}
