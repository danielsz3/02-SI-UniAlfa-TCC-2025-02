<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ResetPasswordController extends Controller
{
    /**
     * Redefinir senha do usuário
     */
    public function reset(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
            'password' => 'required|string|min:8|confirmed',
            'token' => 'required|string'
        ], [
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'Por favor, informe um e-mail válido.',
            'email.exists' => 'Este e-mail não está cadastrado no sistema.',
            'password.required' => 'O campo senha é obrigatório.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
            'token.required' => 'Token de redefinição é obrigatório.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Verificar se o token existe e é válido
            $reset = DB::table('password_resets')
                ->where([
                    'email' => $request->email,
                    'token' => $request->token
                ])->first();

            if (!$reset) {
                return response()->json([
                    'error' => 'Token inválido ou expirado.'
                ], 400);
            }

            // Verificar se o token não expirou (24 horas)
            $tokenAge = Carbon::parse($reset->created_at)->diffInHours(now());
            if ($tokenAge > 24) {
                // Deletar token expirado
                DB::table('password_resets')->where('email', $request->email)->delete();
                
                return response()->json([
                    'error' => 'Token expirado. Solicite um novo link de redefinição.'
                ], 400);
            }

            // Buscar usuário e atualizar senha
            $usuario = Usuario::where('email', $request->email)->first();
            $usuario->password = Hash::make($request->password);
            $usuario->save();

            // Deletar token usado
            DB::table('password_resets')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'Senha redefinida com sucesso!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível redefinir a senha.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar se um token é válido (opcional - para validação no frontend)
     */
    public function validateToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reset = DB::table('password_resets')
            ->where([
                'email' => $request->email,
                'token' => $request->token
            ])->first();

        if (!$reset) {
            return response()->json(['valid' => false, 'message' => 'Token inválido.'], 400);
        }

        // Verificar expiração (24 horas)
        $tokenAge = Carbon::parse($reset->created_at)->diffInHours(now());
        if ($tokenAge > 24) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json(['valid' => false, 'message' => 'Token expirado.'], 400);
        }

        return response()->json(['valid' => true, 'message' => 'Token válido.'], 200);
    }
}