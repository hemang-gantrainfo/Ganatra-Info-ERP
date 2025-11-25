<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    private $protectedUserId = 1;

    // Register API
    public function register(Request $request)
    {

        $validator = Validator::make(
            $request->all(),
            [
                'first_name'     => 'required|string|max:255',
                'last_name'     => 'nullable|string|max:255',
                'username'   => 'required|string|max:15|unique:users,username',
                'email'    => 'required|string|email|unique:users',
                'phone'    => 'nullable|string|max:13|unique:users,phone',
                'address'    => 'nullable|string|max:255',
                'role'     => 'nullable|in:admin,user',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'max:15',
                    'regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,15}$/'
                ],
                'status' => 'nullable|in:active,inactive',
            ],
            [
                'password.regex' => 'Password must contain at least one letter, one number, and one special character.',
                'username.required' => 'Username is required.',
                'username.unique' => 'Username has already been taken.',
            ]
        );

        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->messages() as $field => $messages) {
                $errors[$field] = $messages[0];
            }
            return response()->json(['status' => false, 'message' => 'Validation errors', 'errors' => $errors], 422);
        }


        $user = User::create([
            'first_name'     => $request->first_name,
            'last_name'    => $request->last_name,
            'username'    => $request->username,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'address'    => $request->address,
            'role'    => $request->role ?? 'user',
            'password' => Hash::make($request->password),
            'status' => $request->status ?? 'active'
        ]);

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    // Login API
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $loginInput = $request->login;
        $password = $request->password;

        $fieldType = filter_var($loginInput, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($fieldType, $loginInput)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (strtolower($user->status) !== 'active') {
            return response()->json(['message' => 'Account is inactive'], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user
        ]);
    }

    // Logout API
    public function logout(Request $request)
    {

        $request->user()->tokens()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged out successfully'
        ]);
    }


    public function user(Request $request)
    {
        return $request->user()->paginate(10);
    }

    public function update($id, Request $request)
    {

        // Validate input
        $request->validate(
            [
                'first_name' => 'sometimes|nullable|string|max:255',
                'last_name'  => 'sometimes|nullable|string|max:255',
                'email'      => 'sometimes|nullable|string|email|max:255|unique:users,email,' . $id,
                'phone'      => 'sometimes|nullable|string|max:13',
                'address'    => 'sometimes|nullable|string|max:255',
                'role'       => 'sometimes|nullable|in:admin,user',
                'status'     => 'sometimes|nullable|in:active,inactive',
                'password' => [
                    'nullable',
                    'string',
                    'min:8',
                    'max:15',
                    'regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,15}$/'
                ],
            ],
            [
                'password.regex' => 'Password must contain at least one letter, one number, and one special character.'
            ]
        );

        $user = User::findOrFail($id);

        if ($user->role === 'superadmin') {
            return response()->json([
                'status' => false,
                'message' => 'Super admin account cannot be updated.'
            ], 403);
        }

        // Update first_name & last_name
        if ($request->filled('first_name')) {
            $user->first_name = $request->first_name;
        }

        if ($request->has('last_name')) {
            $user->last_name = $request->last_name;
        }

        // Update email
        if ($request->filled('email')) {
            $user->email = $request->email;
        }

        // Update phone
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }

        // Update address
        if ($request->has('address')) {
            $user->address = $request->address;
        }

        // Update role
        if ($request->filled('role')) {
            $user->role = $request->role;
        }

        // Update status
        if ($request->filled('status')) {
            $user->status = $request->status;
        }

        // Update password
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        // dd($request);

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // ❗ Block delete for dummy user
        if ($user->role === 'superadmin') {
            return response()->json([
                'status' => false,
                'message' => 'Super admin account cannot be deleted.'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }


    // auth check user 
    public function checkUser(Request $request)
    {

        $request->validate([
            'user_id' => 'required|integer',
            'token' => 'required|string',
        ]);


        $user = User::find($request->user_id);

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'User not found'], 404);
        }

        // Use Sanctum helper to decode token
        $accessToken = PersonalAccessToken::findToken($request->token);


        if (!$accessToken || $accessToken->tokenable_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Invalid token'], 401);
        }

        if (strtolower($user->status) !== 'active') {
            return response()->json(['status' => false, 'message' => 'Account inactive'], 403);
        }

        return response()->json(['status' => true, 'message' => 'User is valid', 'user' => $user]);
    }
}


// user testing commet