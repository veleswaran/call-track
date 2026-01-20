# Development Flow & Architectural Standards

# Development Flow & Architectural Standards

Welcome to **CallTrack AI**. This project follows a **Strict Layered Architecture** (The "Altalya Standards").
Governance is strict here: if you violate architectural boundaries, your code is incorrect, even if it works.


## ⚡ The Golden Rules

1.  **Dependency Direction is Absolute**:
    `Controller` → `Service Interface` → `Action` → `Model`
2.  **Controllers are "Skinny"**: No business logic, no Eloquent queries, no array mapping.
3.  **DTOs for Data**: Never pass raw arrays or Request objects to Services. Use DTOs.
4.  **Interface-First**: Controllers only know about Service *Contracts*, not implementations.
5.  **Models are Passive**: Only relationships and scopes. No logic.

---

## 🛠 Step-by-Step Feature Implementation Guide

Let's say you are building a feature to **"Update User Profile"**. Here is the exact order you should follow.

### Step 1: Define the Data (DTO)
create a DTO to carry data from the Controller to the Service.
**Path**: `app/DTOs/Users/UpdateUserProfileDTO.php`

```php
readonly class UpdateUserProfileDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $timezone,
    ) {}

    public static function fromRequest(UpdateUserProfileRequest $request): self
    {
        // Safe validation is guaranteed by the FormRequest
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
            timezone: $request->validated('timezone'),
        );
    }
}
```

### Step 2: Define the Service Contract
Define *what* needs to happen, not *how*.
**Path**: `app/Contracts/Services/UserServiceInterface.php`

```php
interface UserServiceInterface
{
    public function updateProfile(User $user, UpdateUserProfileDTO $dto): User;
}
```

### Step 3: Implement the Business Logic (Action)
Write the actual logic in a strictly focused Action class.
**Path**: `app/Actions/Users/UpdateUserProfileAction.php`

```php
class UpdateUserProfileAction
{
    public function execute(User $user, UpdateUserProfileDTO $dto): User
    {
        $user->update([
            'name' => $dto->name,
            'email' => $dto->email,
            'timezone' => $dto->timezone ?? $user->timezone,
        ]);

        return $user->refresh();
    }
}
```

### Step 4: Implement the Service
Wire the Action into the Service.
**Path**: `app/Services/UserService.php`

```php
class UserService implements UserServiceInterface
{
    public function __construct(
        protected UpdateUserProfileAction $updateUserProfileAction,
    ) {}

    public function updateProfile(User $user, UpdateUserProfileDTO $dto): User
    {
        // Service orchestrates; Action performs.
        // You might log here, or fire events after the action.
        return $this->updateUserProfileAction->execute($user, $dto);
    }
}
```

### Step 5: Validate Input (FormRequest)
Strict validation rules.
**Path**: `app/Http/Requests/Users/UpdateUserProfileRequest.php`

```php
class UpdateUserProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,' . $this->user()->id],
            'timezone' => ['nullable', 'timezone'],
        ];
    }
}
```

### Step 6: Format Output (API Resource)
Transform the model into JSON.
**Path**: `app/Http/Resources/UserResource.php`

```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // ...
        ];
    }
}
```

### Step 7: Wire it up (Controller)
The controller is the entry point. It should be boring.
**Path**: `app/Http/Controllers/Api/V1/UserController.php`

```php
class UserController extends Controller
{
    public function __construct(
        protected UserServiceInterface $userService
    ) {}

    public function update(UpdateUserProfileRequest $request): UserResource
    {
        $user = $request->user();
        
        // 1. Convert Request to DTO
        $dto = UpdateUserProfileDTO::fromRequest($request);

        // 2. Call Service
        $updatedUser = $this->userService->updateProfile($user, $dto);

        // 3. Return Resource
        return new UserResource($updatedUser);
    }
}
```

### Step 8: Register Route
**Path**: `routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/profile', [UserController::class, 'update']);
});
```

---

## 🚫 Common Mistakes (Don't do these)

1.  **Injecting Models in Controllers**:
    *   ❌ `public function update(User $user)`
    *   ✅ `public function update(int $id)` (or resolve via Route Model Binding but pass to Service immediately)
2.  **Passing Arrays to Services**:
    *   ❌ `$service->update($request->all())`
    *   ✅ `$service->update(UpdateUserDTO::fromRequest($request))`
3.  **Fat Services**:
    *   If a Service method is > 20 lines, move the logic to an `Action`.
4.  **Logic in Resources**:
    *   Resources should only map fields. No calculations.

- [ ] Do's and Don'ts: Common pitfalls to avoid.
