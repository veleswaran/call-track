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

        // Call & Contact Actions
        Permission::firstOrCreate(['name' => 'classify calls']);
        Permission::firstOrCreate(['name' => 'manage contacts']);
        Permission::firstOrCreate(['name' => 'view device sync logs']);
        Permission::firstOrCreate(['name' => 'generate registration codes']);

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
            'manage team',
            'classify calls',
            'manage contacts',
            'view device sync logs',
        ]);

        $memberRole = Role::firstOrCreate(['name' => 'member']);
        $memberRole->givePermissionTo([
            'view own records',
            'view reports',
            'view dashboard',
            'classify calls',
            'manage contacts',
        ]);

        // Assign all permissions to Admin as well, except delete records if we want to be strict
        $adminRole->givePermissionTo([
            'classify calls',
            'manage contacts',
            'view device sync logs',
            'generate registration codes',
        ]);
    }
}
