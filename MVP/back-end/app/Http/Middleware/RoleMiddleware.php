<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Uso na rota:
     *   ->middleware('role:admin')
     *   ->middleware('role:user,admin')
     *
     * Observação:
     * - Admin é superuser: passa em qualquer rota que use este middleware.
     * - Se $roles estiver vazio, qualquer usuário autenticado passa.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Com jwt.auth aplicado antes, auth()->user() estará definido
        $user = auth()->user() ?? $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Admin tem acesso total
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Se a rota exigir roles específicas e o usuário não tiver
        if (!empty($roles) && !in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Se não houver roles exigidas, usuário autenticado passa
        return $next($request);
    }
}