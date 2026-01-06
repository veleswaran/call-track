"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Info } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@shared/components/ui/tooltip"

interface AgentPerformance {
    id: number
    agent: string
    employee_code: string
    total_calls: number
    connected: number
    missed: number
    avg_duration: string
    total_duration: string
    handling_rate: number
    performance: 'Excellent' | 'Good' | 'Average' | 'Poor'
}

interface AgentPerformanceTableProps {
    data: AgentPerformance[]
}

const getPerformanceColor = (perf: string) => {
    switch (perf) {
        case 'Excellent': return 'bg-green-100 text-green-700 hover:bg-green-100';
        case 'Good': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
        case 'Average': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
        case 'Poor': return 'bg-red-100 text-red-700 hover:bg-red-100';
        default: return 'bg-gray-100 text-gray-700';
    }
}

export function AgentPerformanceTable({ data }: AgentPerformanceTableProps) {
    return (
        <div className="rounded-md border">
            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>EMP Code</TableHead>
                            <TableHead className="text-right">Total Calls</TableHead>
                            <TableHead className="text-right">Connected</TableHead>
                            <TableHead className="text-right">Missed</TableHead>
                            <TableHead>Total Duration</TableHead>
                            <TableHead>Avg Duration</TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Handling Rate
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>(Connected / Total) * 100%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Performance
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Excellent: ≥ 80%</p>
                                            <p>Average: 40-79%</p>
                                            <p>Poor: &lt; 40%</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${row.id % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                        {row.agent.substring(0, 2).toUpperCase()}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{row.agent}</TableCell>
                                <TableCell>{row.employee_code}</TableCell>
                                <TableCell className="text-right">{row.total_calls}</TableCell>
                                <TableCell className="text-right text-green-600 font-bold">{row.connected}</TableCell>
                                <TableCell className="text-right text-red-600 font-bold">{row.missed}</TableCell>
                                <TableCell>{row.total_duration}</TableCell>
                                <TableCell>{row.avg_duration}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{row.handling_rate}%</span>
                                        <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${row.handling_rate > 80 ? 'bg-green-500' : (row.handling_rate > 50 ? 'bg-blue-500' : 'bg-red-500')}`} style={{ width: `${row.handling_rate}%` }} />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border-0 ${getPerformanceColor(row.performance)}`}>
                                        {row.performance}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="link" size="sm">View Calls</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    No agent performance data available for this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TooltipProvider>
        </div>
    )
}
