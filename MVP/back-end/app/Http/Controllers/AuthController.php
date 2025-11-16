<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Google\Client as GoogleClient;

class AuthController extends Controller
{
    /**
     * Fazer login normal (email/senha) e gerar JWT
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $credentials = $request->only('email', 'password');

            if (!$token = auth()->attempt($credentials)) {
                return response()->json(['error' => 'Credenciais inválidas'], 401);
            }

            return $this->respondWithToken($token);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Erro de autenticação'], 500);
        }
    }

    /**
     * LOGIN COM GOOGLE — redirecionamento (fluxo web)
     */
    public function redirectToGoogle(): JsonResponse
    {
        $googleUrl = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();
        return response()->json(['url' => $googleUrl]);
    }

    /**
     * LOGIN COM GOOGLE — callback (fluxo web)
     */
    public function handleGoogleCallback(): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $usuario = Usuario::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'nome' => $googleUser->getName(),
                    'password' => Hash::make(Str::random(16)),
                    'role' => 'user',
                    'cpf' => '',
                    'data_nascimento' => now()->subYears(18),
                ]
            );

            $token = auth()->login($usuario);

            return response()->json([
                'message' => 'Login com Google efetuado com sucesso!',
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60,
                'user' => $usuario,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro no login com Google', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * LOGIN COM GOOGLE — via ID Token (fluxo de frontend SPA)
     */
    public function googleLoginToken(Request $request): JsonResponse
{
    $request->validate([
        'idToken' => 'required|string',
    ]);

    $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
    $payload = $client->verifyIdToken($request->idToken);

    if (!$payload) {
        return response()->json(['error' => 'Token Google inválido'], 401);
    }

        $email = $payload['email'];
        $nome = $payload['name'] ?? $email;

        $usuario = Usuario::firstOrCreate(
            ['email' => $email],
            [
                'nome' => $nome,
                'password' => Hash::make(Str::random(16)),
                'role' => 'user',
                'cpf' => '',
                'data_nascimento' => now()->subYears(18),
            ]
        );

        $token = auth()->login($usuario);

        return response()->json([
            'message' => 'Login via Google Token efetuado com sucesso!',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => $usuario,
        ]);
    }

    /**
     * Retorna o usuário autenticado
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        return response()->json(['message' => 'Usuário autenticado', 'user' => $user]);
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
            return response()->json(['error' => 'Token inválido'], 400);
        }
    }

    /**
     * Renovar token JWT
     */
    public function refresh(): JsonResponse
    {
        try {
            return $this->respondWithToken(auth()->refresh());
        } catch (JWTException $e) {
            return response()->json(['error' => 'Token inválido'], 401);
        }
    }

    /**
     * Monta resposta padrão do token
     */
    protected function respondWithToken($token): JsonResponse
    {
        return response()->json([
            'message' => 'Login realizado com sucesso',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => auth()->user(),
        ]);
    }

    /**
 * Enviar link de redefinição de senha — valida se email e CPF estão vinculados
 */
public function forgetPassword(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'cpf' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $email = $request->input('email');
    $cpfInput = $request->input('cpf');

    // Normaliza CPF (apenas dígitos)
    $cpfClean = preg_replace('/\D/', '', $cpfInput);

    try {
        $user = Usuario::where('email', $email)->first();

        if ($user) {
            $userCpfClean = preg_replace('/\D/', '', $user->cpf ?? '');
            if (!empty($userCpfClean) && $userCpfClean === $cpfClean) {
                $token = Password::broker('usuarios')->createToken($user);
                $user->notify(new ResetPasswordNotification($token));
            }
        }
        return response()->json(['message' => 'Se o e‑mail e CPF existirem, um link de redefinição foi enviado.']);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Erro ao enviar link de redefinição', 'message' => $e->getMessage()], 500);
    }
}

    /**
     * Resetar senha
     */
   public function resetPassword(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'token' => 'required',
        'email' => 'required|email',
        'password' => [
            'required',
            'string',
            'min:8',
            'confirmed',
            'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/',
        ],
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        $status = Password::broker('usuarios')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                if (Hash::check($password, $user->password)) {
                    throw ValidationException::withMessages([
                        'password' => ['A nova senha não pode ser igual à senha antiga.'],
                    ]);
                }

                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );
    } catch (ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Erro ao redefinir a senha', 'message' => $e->getMessage()], 500);
    }

    if ($status === Password::PASSWORD_RESET) {
        return response()->json(['message' => 'Senha redefinida com sucesso']);
    }

    return response()->json(['error' => 'Falha ao redefinir a senha', 'message' => __($status)], 400);
}

    /**
     * Rota de debug (opcional) — gera token/link para teste manual.
     * Use apenas em ambiente de desenvolvimento.
     */
    public function debugResetLink(string $email): JsonResponse
    {
        $user = Usuario::where('email', $email)->first();
        if (!$user) {
            return response()->json(['error' => 'Usuário não encontrado'], 404);
        }

        $token = Password::broker('usuarios')->createToken($user);
        $frontend = config('app.frontend_url', env('FRONTEND_URL', env('APP_URL')));
        $link = rtrim($frontend, '/') . '/new-password?token=' . $token . '&email=' . urlencode($user->email);

        return response()->json(['token' => $token, 'link' => $link]);
    }
}
