<?php
 
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

// ADICIONE:
use App\Http\Middleware\RoleMiddleware;
use PHPOpenSourceSaver\JWTAuth\Http\Middleware\Authenticate as JwtAuthenticate;
use PHPOpenSourceSaver\JWTAuth\Http\Middleware\RefreshToken as JwtRefresh;
 
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ADICIONE os aliases que serão usados nas rotas
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'jwt.auth' => JwtAuthenticate::class,
            'jwt.refresh' => JwtRefresh::class,
        ]);

        // Se quiser middlewares globais ou por grupo, pode usar:
        // $middleware->append([...]); // globais
        // $middleware->web([...]);
        // $middleware->api([...]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Mantém sua resposta JSON para 401 em rotas API
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 401);
            }
        });

        // Opcional: resposta JSON padrão para 403 em rotas API
        // use Illuminate\Auth\Access\AuthorizationException;
        // $exceptions->render(function (AuthorizationException $e, Request $request) {
        //     if ($request->is('api/*')) {
        //         return response()->json(['message' => 'Forbidden'], 403);
        //     }
        // });
    })->create();