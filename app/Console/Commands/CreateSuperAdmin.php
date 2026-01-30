<?php

namespace App\Console\Commands;

use App\Domain\Users\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-super';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new super admin user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Creating Super Admin User');
        $this->newLine();

        // Get user input
        $name = $this->ask('Name');
        $email = $this->ask('Email');

        // Validate email uniqueness
        if (User::where('email', $email)->exists()) {
            $this->error("User with email '{$email}' already exists!");

            return self::FAILURE;
        }

        $password = $this->secret('Password (min 8 characters)');
        $passwordConfirmation = $this->secret('Confirm Password');

        // Validate password
        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters!');

            return self::FAILURE;
        }

        if ($password !== $passwordConfirmation) {
            $this->error('Passwords do not match!');

            return self::FAILURE;
        }

        // Create user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        // Assign super-admin role
        $user->assignRole('super-admin');

        $this->newLine();
        $this->info('✅ Super Admin created successfully!');
        $this->table(
            ['ID', 'Name', 'Email'],
            [[$user->id, $user->name, $user->email]]
        );

        $this->newLine();
        $this->comment('You can now use this account to authenticate via Sanctum.');
        $this->comment('Generate a token with: php artisan tinker');
        $this->comment('>>> $user = User::find('.$user->id.')');
        $this->comment('>>> $user->createToken("admin-token")->plainTextToken');

        return self::SUCCESS;
    }
}
