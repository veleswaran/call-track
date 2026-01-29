<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        // Create permissions
        // Data Visibility
        Permission::firstOrCreate(['name' => 'view own records']);
        Permission::firstOrCreate(['name' => 'manage team records']);
        Permission::firstOrCreate(['name' => 'view organization records']);

        // Critical Actions
        Permission::firstOrCreate(['name' => 'delete records']); // Super Admin Only

        // Modules
        Permission::firstOrCreate(['name' => 'manage users']);
        Permission::firstOrCreate(['name' => 'view dashboard']);
        Permission::firstOrCreate(['name' => 'manage devices']);
        Permission::firstOrCreate(['name' => 'view reports']);
        Permission::firstOrCreate(['name' => 'manage team']);

        // Roles
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdminRole->givePermissionTo(Permission::all());

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo([
            'view organization records',
            'manage users',
            'view dashboard',
            'manage devices',
            'view reports',
            'manage team', // Admins can manage any team generally, or we restrict this? Spec says Admin can manage all.
        ]);

        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerRole->givePermissionTo([
            'manage team records',
            'view dashboard',
            'view reports',
            'manage team', // Manage their own team
        ]);

        $memberRole = Role::firstOrCreate(['name' => 'member']);
        $memberRole->givePermissionTo([
            'view own records',
            'view reports',
            'view dashboard', // Own dashboard
        ]);

        // Cleanup old roles if necessary or ensuring 'agent' role maps to member if used previously
        // Keeping 'agent' as alias or separate role? Spec calls for "Member (Agent/User Level)"
        // sticking to 'member' as requested, but system might use 'agent' elsewhere?
        // Let's create 'agent' as alias to 'member' for backward compat or clarify.
        // Spec says "Member (Agent/User Level)". I will assume 'member' is the role name.
        if (Role::where('name', 'agent')->exists()) {
            $agentRole = Role::findByName('agent');
            $agentRole->givePermissionTo([
                'view own records',
                'view dashboard',
            ]);
        }
    }
}
