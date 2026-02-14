"use client";

import { useUsers } from "@features/users/hooks/use-users";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { CreateUserDialog } from "@features/users/components/create-user-dialog";
import { UserActions } from "@features/users/components/user-actions";
import { Badge } from "@shared/components/ui/badge";
import { formatDate } from "@shared/utils/date";

export default function UsersPage() {
    const { data, isLoading } = useUsers();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage administrator usage and access.
                    </p>
                </div>
                <CreateUserDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>2FA</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.data.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        {user.roles?.map((role: string) => (
                                            <Badge key={role} variant="secondary" className="text-xs">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.agent ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.agent.name}</span>
                                            {/* <span className="text-xs text-muted-foreground">{user.agent.employee_code}</span> */}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.two_factor_enabled ? (
                                        <Badge variant="outline" className="border-green-500 text-green-500">Enabled</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{formatDate(user.created_at)}</TableCell>
                                <TableCell>
                                    <UserActions user={user} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {data?.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
