<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;
use Illuminate\Support\Facades\DB;

final class GetFrequentlyContactedAction
{
    public function execute(ReportFilterDTO $filters): LengthAwarePaginator
    {
        $query = DB::table('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->leftJoin('agents as a', 'a.id', '=', 'd.agent_id')
            ->leftJoin('contacts as c', 'c.phone_hash', '=', 'cl.phone_number_hash');

        if ($filters->startDate && $filters->endDate) {
            $query->whereBetween('cl.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $filters->perPage, $filters->page ?? 1);
            }
            $query->whereIn('a.id', $filters->allowedAgentIds);
        }

        if (! empty($filters->agentIds)) {
            $query->whereIn('a.id', $filters->agentIds);
        }

        if (! empty($filters->teamIds)) {
            $query->whereIn('a.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        if (! empty($filters->types)) {
            $query->leftJoin('call_classifications as cc', 'cl.id', '=', 'cc.call_log_id')
                ->whereIn('cc.type', array_map('strtoupper', $filters->types));
        }

        if ($filters->simSlot !== null) {
            $query->where('cl.sim_slot', $filters->simSlot);
        }

        // Group by phone_number_hash
        $query->select([
            'cl.phone_number_hash',
            DB::raw('MAX(cl.phone_number) as raw_phone_number'),
            DB::raw('MAX(cl.phone_contact_name) as phone_contact_name'),
            DB::raw('MAX(c.name) as contact_name'),
            DB::raw('MAX(CASE WHEN c.is_internal IS TRUE THEN 1 ELSE 0 END) as is_internal'),
            DB::raw('COUNT(cl.id) as total_touchpoints'),
            DB::raw("SUM(CASE WHEN cl.direction = 'INCOMING' THEN 1 ELSE 0 END) as in_count"),
            DB::raw("SUM(CASE WHEN cl.direction = 'OUTGOING' THEN 1 ELSE 0 END) as out_count"),
            DB::raw('SUM(cl.duration) as total_duration'),
            DB::raw('MAX(cl.timestamp) as last_contacted_at'),
        ])
            ->groupBy('cl.phone_number_hash')
            ->orderByDesc('total_touchpoints');

        /** @var ConcretePaginator $paginator */
        $paginator = $query->paginate(perPage: $filters->perPage, page: $filters->page ?? 1);

        $hashes = $paginator->getCollection()->pluck('phone_number_hash')->filter()->all();
        $agentsByHash = [];
        $agentContactsByHash = [];

        if (! empty($hashes)) {
            $agentRecords = DB::table('call_logs as cl')
                ->join('devices as d', 'd.id', '=', 'cl.device_id')
                ->join('agents as a', 'a.id', '=', 'd.agent_id')
                ->whereIn('cl.phone_number_hash', $hashes)
                ->select([
                    'cl.phone_number_hash',
                    'a.id as agent_id',
                    'a.name as agent_name',
                    'cl.phone_contact_name',
                ])
                ->distinct()
                ->get();

            foreach ($agentRecords as $rec) {
                $agentsByHash[$rec->phone_number_hash][] = $rec->agent_name;
                if (! empty($rec->phone_contact_name)) {
                    $agentContactsByHash[$rec->phone_number_hash][$rec->agent_name] = $rec->phone_contact_name;
                }
            }
        }

        $paginator->getCollection()->transform(function ($item) use ($agentsByHash, $agentContactsByHash, $filters) {
            $agentContactsList = [];
            if (isset($agentContactsByHash[$item->phone_number_hash])) {
                foreach ($agentContactsByHash[$item->phone_number_hash] as $agentName => $savedName) {
                    $agentContactsList[] = [
                        'agent_name' => $agentName,
                        'contact_name' => $savedName,
                    ];
                }
            }

            // Determine primary name:
            // 1. Central master directory name takes highest priority
            // 2. If filtering by a single agent, prefer that agent's saved contact name
            // 3. Otherwise use the first available agent's saved name or device contact name
            $name = $item->contact_name;
            if (! $name && ! empty($filters->agentIds) && count($filters->agentIds) === 1) {
                $filteredContact = $agentContactsList[0]['contact_name'] ?? null;
                if ($filteredContact) {
                    $name = $filteredContact;
                }
            }
            if (! $name) {
                $name = $item->phone_contact_name ?: ($agentContactsList[0]['contact_name'] ?? 'Unknown Customer');
            }

            $isInternal = ((int) ($item->is_internal ?? 0)) === 1;
            $category = $isInternal ? 'Internal Account' : ($item->contact_name ? 'Key Enterprise Account' : 'External Contact');

            $in = (int) $item->in_count;
            $out = (int) $item->out_count;

            $agentsList = isset($agentsByHash[$item->phone_number_hash])
                ? implode(', ', array_slice(array_unique($agentsByHash[$item->phone_number_hash]), 0, 3))
                : 'Direct Agent';

            $phoneNumber = null;
            if (! empty($item->raw_phone_number)) {
                try {
                    $phoneNumber = \Illuminate\Support\Facades\Crypt::decryptString($item->raw_phone_number);
                } catch (\Illuminate\Contracts\Encryption\DecryptException) {
                    $phoneNumber = $item->raw_phone_number;
                }
            }

            if (! $phoneNumber) {
                $phoneNumber = $item->phone_contact_name ?: null;
            }

            if ($phoneNumber && ! str_starts_with($phoneNumber, '+')) {
                $phoneNumber = '+91 '.$phoneNumber;
            }

            return [
                'phone_hash' => $item->phone_number_hash,
                'customer_name' => $name,
                'phone_number' => $phoneNumber ?: '+91 98400 00000',
                'account_category' => $category,
                'total_touchpoints' => (int) $item->total_touchpoints,
                'in_count' => $in,
                'out_count' => $out,
                'in_out_ratio' => "{$in} In / {$out} Out",
                'total_talk_time' => $this->formatDuration((int) $item->total_duration),
                'total_talk_time_raw' => (int) $item->total_duration,
                'agents_handled' => $agentsList,
                'agent_contacts' => $agentContactsList,
                'last_contacted' => $item->last_contacted_at ? $this->formatRelativeDate($item->last_contacted_at) : 'N/A',
                'last_contacted_raw' => $item->last_contacted_at,
            ];
        });

        return $paginator;
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $h = floor($seconds / 3600);
        $m = floor(($seconds % 3600) / 60);

        if ($h > 0) {
            return "{$h}h {$m}m";
        }

        $s = $seconds % 60;

        return "{$m}m {$s}s";
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

        return $dt->format('d M, h:i A');
    }
}
