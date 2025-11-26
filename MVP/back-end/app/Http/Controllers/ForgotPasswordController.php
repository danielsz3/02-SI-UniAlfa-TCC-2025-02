<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Enviar link de redefinição de senha por e-mail
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:usuarios,email',
        ], [
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'Por favor, informe um e-mail válido.',
            'email.exists' => 'Este e-mail não está cadastrado no sistema.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Gerar token único
            $token = Str::random(64);

            // Salvar ou atualizar token na tabela password_resets
            DB::table('password_resets')->updateOrInsert(
                ['email' => $request->email],
                [
                    'email' => $request->email,
                    'token' => $token,
                    'created_at' => now()
                ]
            );

            // Buscar usuário e enviar notificação
            $usuario = Usuario::where('email', $request->email)->first();
            $usuario->notify(new ResetPasswordNotification($token));

            return response()->json([
                'message' => 'Link de redefinição de senha enviado para o seu e-mail.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível enviar o e-mail de redefinição.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}