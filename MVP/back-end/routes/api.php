<?php

use App\Http\Controllers\TrashController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\EnderecoController;
use App\Http\Controllers\OngController;
use App\Http\Controllers\ParceiroController;
use App\Http\Controllers\LaresTemporarioController;
use App\Http\Controllers\ContatoOngController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\TransacaoController;
use App\Http\Controllers\AnimalController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\IntegracaoController;
use App\Http\Controllers\AdocaoController;
use App\Http\Controllers\MatchAfinidadeController;
use App\Http\Controllers\DashboardController;

/**
 * ROTAS PÚBLICAS
 */
Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgetPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');
// Google OAuth (fluxo web)
Route::get('auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');
// Google (fluxo SPA) — envia idToken do frontend
Route::post('auth/google/token', [AuthController::class, 'googleLoginToken'])->name('google.token');

Route::get('imagens/{folder}/{filename}', [ImageController::class, 'show'])->name('imagens.show');
Route::get('documentos/{id}/download', [DocumentoController::class, 'download'])->name('documentos.download');

/**
 * Se quiser deixar index/show públicos de alguns recursos, mantenha apenas estes:
 */
Route::apiResource('animais', AnimalController::class)->only(['index', 'show']);
Route::apiResource('eventos', EventoController::class)->only(['index', 'show']);
Route::apiResource('ongs', OngController::class)->only(['index', 'show']);
Route::apiResource('parceiros', ParceiroController::class)->only(['index', 'show']);
Route::apiResource('contato-ongs', ContatoOngController::class)->only(['index', 'show']);
Route::apiResource('documentos', DocumentoController::class)->only(['index', 'show']);
Route::apiResource('transacoes', TransacaoController::class)->only(['index', 'show']);
route::apiResource('lares-temporarios', LaresTemporarioController::class)->only(['index', 'show', 'store']);

// Usuários públicos: ver 1 e criar cadastro
Route::apiResource('usuarios', UsuarioController::class)->only(['show', 'store', 'update']);

/**
 * ROTAS AUTENTICADAS (qualquer logado)
 */
Route::middleware(['jwt.auth'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::get('me', [AuthController::class, 'me'])->name('me');

    // Recomendações
    Route::get('usuarios/{id}/recomendar-animais', [AnimalController::class, 'recomendar']);

    // Fluxos que qualquer logado pode usar
    Route::apiResource('adocoes', AdocaoController::class)->only(['index', 'show', 'store']);
    Route::apiResource('match-afinidades', MatchAfinidadeController::class)->only(['index', 'show', 'store']);
    Route::post('match-afinidades/mudar-status', [MatchAfinidadeController::class, 'MudarStatus']);
    Route::apiResource('lares-temporarios', LaresTemporarioController::class)->only(['index', 'show', 'store']);
    Route::apiResource('animais', AnimalController::class)->only(['store']);

    /**
     * ADMIN: TODAS AS FUNCIONALIDADES
     */
    Route::middleware(['role:admin'])->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/transacoes', [DashboardController::class, 'transacoes']);

        // Usuários: admin tem CRUD completo (exceto ‘store’ se preferir manter público)
        Route::apiResource('usuarios', UsuarioController::class)->except(['show', 'store', 'update']);
        Route::post('usuarios/{id}/restore', [UsuarioController::class, 'restore'])->name('usuarios.restore');

        // Recursos com controle total do admin
        Route::apiResource('enderecos', EnderecoController::class)->except(['index', 'show']);
        Route::post('enderecos/{id}/restore', [EnderecoController::class, 'restore'])->name('enderecos.restore');

        Route::apiResource('ongs', OngController::class)->except(['index', 'show']);
        Route::post('ongs/{id}/restore', [OngController::class, 'restore'])->name('ongs.restore');

        Route::apiResource('parceiros', ParceiroController::class)->except(['index', 'show']);
        Route::post('parceiros/{id}/restore', [ParceiroController::class, 'restore'])->name('parceiros.restore');

        Route::apiResource('lares-temporarios', LaresTemporarioController::class)->except(['index', 'show', 'store']);
        Route::post('lares-temporarios/{id}/restore', [LaresTemporarioController::class, 'restore'])->name('lares-temporarios.restore');

        Route::apiResource('contato-ongs', ContatoOngController::class)->except(['index', 'show']);
        Route::post('contato-ongs/{id}/restore', [ContatoOngController::class, 'restore'])->name('contato-ongs.restore');

        Route::apiResource('documentos', DocumentoController::class)->except(['index', 'show']);
        Route::post('documentos/{id}/restore', [DocumentoController::class, 'restore'])->name('documentos.restore');

        Route::apiResource('transacoes', TransacaoController::class)->except(['index', 'show']);
        Route::post('transacoes/{id}/restore', [TransacaoController::class, 'restore'])->name('transacoes.restore');

        Route::apiResource('animais', AnimalController::class)->except(['index', 'show', 'store']);
        Route::post('animais/{id}/restore', [AnimalController::class, 'restore'])->name('animais.restore');

        Route::apiResource('integracoes', IntegracaoController::class);

        Route::apiResource('eventos', EventoController::class)->except(['index', 'show']);
        Route::post('eventos/{id}/restore', [EventoController::class, 'restore'])->name('eventos.restore');

        // Posts apenas para admin (CRUD completo)
        Route::apiResource('posts', PostController::class);
        Route::post('posts/{id}/restore', [PostController::class, 'restore'])->name('posts.restore');

        // Adoções: admin ganha update/destroy + ações extras
        Route::apiResource('adocoes', AdocaoController::class)->except(['index', 'show', 'store']);
        Route::post('adocoes/{id}/restore', [AdocaoController::class, 'restore'])->name('adocoes.restore');

        // Match Afinidades: admin com update/destroy
        Route::apiResource('match-afinidades', MatchAfinidadeController::class)->except(['index', 'show', 'store']);
        Route::post('match-afinidades/{id}/restore', [MatchAfinidadeController::class, 'restore'])->name('match-afinidades.restore');

        // Lixeira genérica
        Route::prefix('trash/{modelName}')->group(function () {
            Route::get('/', [TrashController::class, 'index']); // /trash/{modelName}
            Route::post('/{id}/restore', [TrashController::class, 'restore']); // /trash/{modelName}/{id}/restore
            Route::delete('/{id}/force-delete', [TrashController::class, 'forceDelete']); // /trash/{modelName}/{id}/force-delete
        });
    });
});
