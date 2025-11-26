<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Fazer login e gerar JWT
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:1',
        ], [
            'email.required' => 'O email é obrigatório',
            'email.email' => 'Digite um email válido',
            'password.required' => 'A senha é obrigatória',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Dados inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $credentials = $request->only('email', 'password');

            if (!$token = auth()->attempt($credentials)) {
                return response()->json([
                    'error' => 'Credenciais inválidas',
                    'message' => 'Email ou senha incorretos'
                ], 401);
            }

            return $this->respondWithToken($token);

        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Erro de autenticação',
                'message' => 'Não foi possível gerar o token'
            ], 500);
        }
    }

    /**
     * Retorna o usuário autenticado
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'error' => 'Usuário não autenticado',
                'message' => 'Token inválido ou expirado'
            ], 401);
        }

        return response()->json([
            'message' => 'Usuário autenticado',
            'user' => $user
        ]);
    }

    /**
     * Logout e invalida o token
     */
    public function logout(): JsonResponse
    {
        try {
            auth()->logout();
            return response()->json(['message' => 'Logout realizado com sucesso']);
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Token inválido',
                'message' => 'Não foi possível realizar logout'
            ], 400);
        }
    }

    /**
     * Refresh do token JWT
     */
    public function refresh(): JsonResponse
    {
        try {
            return $this->respondWithToken(auth()->refresh());
        } catch (JWTException $e) {
            return response()->json([
                'error' => 'Token inválido',
                'message' => 'Não foi possível renovar o token'
            ], 401);
        }
    }

    /**
     * Estrutura de resposta do token
     */
    protected function respondWithToken($token): JsonResponse
    {
        return response()->json([
            'message' => 'Login realizado com sucesso',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => auth()->user()
        ]);
    }
}