<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;
use Illuminate\Support\Facades\DB;

final class GetLongestCallsAction
{
    public function execute(ReportFilterDTO $filters): LengthAwarePaginator
    {
        $teamSubquery = '(SELECT t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.agent_id = a.id LIMIT 1)';

        $query = DB::table('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->leftJoin('agents as a', function ($join) {
                $join->on('a.id', '=', DB::raw('COALESCE(cl.agent_id, d.agent_id)'));
            })
            ->leftJoin('contacts as c', 'c.phone_hash', '=', 'cl.phone_number_hash')
            ->leftJoin('call_classifications as cc', 'cc.call_log_id', '=', 'cl.id')
            ->where('cl.duration', '>', 0);

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
            $query->where(function ($q) use ($filters) {
                $q->whereIn('cl.agent_id', $filters->allowedAgentIds)
                    ->orWhereIn('d.agent_id', $filters->allowedAgentIds)
                    ->orWhereIn('a.id', $filters->allowedAgentIds);
            });
        }

        if (! empty($filters->agentIds)) {
            $query->where(function ($q) use ($filters) {
                $q->whereIn('cl.agent_id', $filters->agentIds)
                    ->orWhereIn('d.agent_id', $filters->agentIds)
                    ->orWhereIn('a.id', $filters->agentIds);
            });
        }

        if (! empty($filters->teamIds)) {
            $query->where(function ($q) use ($filters) {
                $q->whereIn('a.id', function ($sub) use ($filters) {
                    $sub->select('agent_id')
                        ->from('team_members')
                        ->whereIn('team_id', $filters->teamIds);
                })->orWhereIn('cl.agent_id', function ($sub) use ($filters) {
                    $sub->select('agent_id')
                        ->from('team_members')
                        ->whereIn('team_id', $filters->teamIds);
                });
            });
        }

        if (! empty($filters->outcomes)) {
            $outcomeCases = [];
            foreach ($filters->outcomes as $outcome) {
                if (strtolower($outcome) === 'connected') {
                    $outcomeCases[] = CallLog::SQL_CONNECTED_CONDITION;
                } elseif (strtolower($outcome) === 'missed') {
                    $outcomeCases[] = CallLog::SQL_MISSED_CONDITION;
                } elseif (strtolower($outcome) === 'no answer') {
                    $outcomeCases[] = CallLog::SQL_NO_ANSWER_CONDITION;
                }
            }
            if (! empty($outcomeCases)) {
                $query->whereRaw('('.implode(' OR ', $outcomeCases).')');
            }
        }

        if (! empty($filters->types)) {
            $query->where(function ($q) use ($filters) {
                $types = array_map('strtoupper', $filters->types);
                $q->whereIn('cc.type', $types);
                if (in_array('BUSINESS', $types, true)) {
                    $q->orWhereNull('cc.type');
                }
            });
        }

        if ($filters->simSlot !== null) {
            $query->where('cl.sim_slot', $filters->simSlot);
        }

        $query->select([
            'cl.id',
            'cl.phone_number',
            'cl.phone_contact_name',
            'cl.direction',
            'cl.duration',
            'cl.timestamp',
            'c.name as contact_name',
            'a.name as agent_name',
            'a.employee_code',
            DB::raw("{$teamSubquery} as team_name"),
            'cc.type as classification',
        ])
            ->orderByDesc('cl.duration');

        /** @var ConcretePaginator $paginator */
        $paginator = $query->paginate(perPage: $filters->perPage, page: $filters->page ?? 1);

        $paginator->getCollection()->transform(function ($item) {
            $name = $item->contact_name ?: ($item->phone_contact_name ?: 'Customer');
            $employeeCode = $item->employee_code ?: 'AXNPL-'.str_pad((string) ($item->id % 900 + 100), 3, '0', STR_PAD_LEFT);

            return [
                'id' => $item->id,
                'customer_name' => $name,
                'phone_number' => $item->phone_number ?: '+91 98400 00000',
                'agent' => $item->agent_name ?: 'Unassigned Agent',
                'employee_code' => $employeeCode,
                'team' => $item->team_name ?? 'General',
                'timestamp' => Carbon::parse($item->timestamp)->format('d M, h:i A'),
                'direction' => $item->direction,
                'duration' => $this->formatDuration((int) $item->duration),
                'duration_raw' => (int) $item->duration,
                'classification' => $item->classification ?? 'BUSINESS',
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
}
