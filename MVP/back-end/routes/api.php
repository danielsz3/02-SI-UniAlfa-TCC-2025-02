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

Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgetPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');

Route::get('auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');

Route::post('auth/google/token', [AuthController::class, 'googleLoginToken'])->name('google.token');

Route::get('imagens/{folder}/{filename}', [ImageController::class, 'show'])->name('imagens.show');
Route::get('documentos/{id}/download', [DocumentoController::class, 'download'])->name('documentos.download');

Route::apiResource('animais', AnimalController::class)->only(['index', 'show']);
Route::apiResource('eventos', EventoController::class)->only(['index', 'show']);
Route::apiResource('ongs', OngController::class)->only(['index', 'show']);
Route::apiResource('parceiros', ParceiroController::class)->only(['index', 'show']);
Route::apiResource('contato-ongs', ContatoOngController::class)->only(['index', 'show']);
Route::apiResource('documentos', DocumentoController::class)->only(['index', 'show']);
Route::apiResource('transacoes', TransacaoController::class)->only(['index', 'show']);
route::apiResource('lares-temporarios', LaresTemporarioController::class)->only(['index', 'show', 'store']);

/**
 * CADASTRO DE USUÁRIO (PÚBLICO)
 */
Route::get('/imagens/{folder}/{filename}', [ImageController::class, 'show']);
Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store.public');
Route::get('documentos/{id}/download', [DocumentoController::class, 'download'])->name('documentos.download');
/**
 * ROTAS AUTENTICADAS (qualquer logado)
 */
Route::middleware(['jwt.auth'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::get('me', [AuthController::class, 'me'])->name('me');

    Route::get('usuarios/{id}/recomendar-animais', [AnimalController::class, 'recomendar']);

    Route::apiResource('adocoes', AdocaoController::class)->only(['index', 'show', 'store']);
    Route::apiResource('match-afinidades', MatchAfinidadeController::class)->only(['index', 'show', 'store']);
    Route::post('match-afinidades/mudar-status', [MatchAfinidadeController::class, 'MudarStatus']);
    Route::apiResource('animais', AnimalController::class)->only(['store']);

    Route::middleware(['role:admin'])->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/transacoes', [DashboardController::class, 'transacoes']);

        Route::apiResource('usuarios', UsuarioController::class)->except(['show', 'store', 'update']);

        Route::apiResource('enderecos', EnderecoController::class)->except(['index', 'show']);

        Route::apiResource('ongs', OngController::class)->except(['index', 'show']);

        Route::apiResource('parceiros', ParceiroController::class)->except(['index', 'show']);

        Route::apiResource('lares-temporarios', LaresTemporarioController::class)->except(['index', 'show', 'store']);

        Route::apiResource('contato-ongs', ContatoOngController::class)->except(['index', 'show']);

        Route::apiResource('documentos', DocumentoController::class)->except(['index', 'show']);
        Route::post('documentos/{id}/restore', [DocumentoController::class, 'restore'])->name('documentos.restore');


        Route::apiResource('transacoes', TransacaoController::class)->except(['index', 'show']);

        Route::apiResource('animais', AnimalController::class)->except(['index', 'show', 'store']);

        Route::apiResource('integracoes', IntegracaoController::class);

        Route::apiResource('eventos', EventoController::class)->except(['index', 'show']);

        Route::apiResource('posts', PostController::class);

        Route::apiResource('adocoes', AdocaoController::class)->except(['index', 'show', 'store']);

        Route::apiResource('match-afinidades', MatchAfinidadeController::class)->except(['index', 'show', 'store']);

        Route::prefix('trash')->group(function () {
            Route::get('/{modelName?}', [TrashController::class, 'index']);
            Route::post('/{modelName}/{id}/restore', [TrashController::class, 'restore']);
            Route::delete('/{modelName}/{id}/force-delete', [TrashController::class, 'forceDelete']);
        });
    });
});
