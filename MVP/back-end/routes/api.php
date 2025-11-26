<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;

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

/**
 * AUTENTICAÇÃO PÚBLICA
 */
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/imagens/{folder}/{filename}', [ImageController::class, 'show']);

/**
 * REDEFINIÇÃO DE SENHA 
 */
Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('reset-password', [ResetPasswordController::class, 'reset']);
Route::post('validate-token', [ResetPasswordController::class, 'validateToken']);

/**
 * RECURSOS PÚBLICOS (somente leitura: index, show)
 */
Route::apiResource('enderecos', EnderecoController::class)->only(['index', 'show']);
Route::apiResource('ongs', OngController::class)->only(['index', 'show']);
Route::apiResource('parceiros', ParceiroController::class)->only(['index', 'show']);
Route::apiResource('lares-temporarios', LaresTemporarioController::class)->only(['index', 'show']);
Route::apiResource('contato-ongs', ContatoOngController::class)->only(['index', 'show']);
Route::apiResource('documentos', DocumentoController::class)->only(['index', 'show']);
Route::apiResource('transacoes', TransacaoController::class)->only(['index', 'show']);
Route::apiResource('animais', AnimalController::class)->only(['index', 'show']);
Route::apiResource('eventos', EventoController::class)->only(['index', 'show']);
// Route::apiResource('posts', PostController::class)->only(['index', 'show']);

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
    // sessão
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    // recomendações
    Route::get('/usuarios/{id}/recomendar-animais', [AnimalController::class, 'recomendar']);

    /**
     * ADOÇÕES (qualquer logado) - sem validações de user no controller
     * Observação: approve/restore ficam no bloco admin abaixo
     */
    Route::get('/adocoes', [AdocaoController::class, 'index'])->name('adocoes.index');
    Route::get('/adocoes/{id}', [AdocaoController::class, 'show'])->name('adocoes.show');
    Route::post('/adocoes', [AdocaoController::class, 'store'])->name('adocoes.store');
    Route::put('/adocoes/{id}', [AdocaoController::class, 'update'])->name('adocoes.update');
    Route::delete('/adocoes/{id}', [AdocaoController::class, 'destroy'])->name('adocoes.destroy');

    /**
     * ADMIN-ONLY: CRUD completo (exceto index/show que são públicos) + restore
     */
    Route::middleware(['role:admin'])->group(function () {
        // USUÁRIOS: admin gerencia, mas store já é pública
        Route::apiResource('usuarios', UsuarioController::class)->except(['store']);
        Route::post('usuarios/{id}/restore', [UsuarioController::class, 'restore'])->name('usuarios.restore');

        // DEMAIS RECURSOS: admin pode criar/editar/excluir/restaurar
        Route::apiResource('enderecos', EnderecoController::class)->except(['index', 'show']);
        Route::post('enderecos/{id}/restore', [EnderecoController::class, 'restore'])->name('enderecos.restore');

        Route::apiResource('ongs', OngController::class)->except(['index', 'show']);
        Route::post('ongs/{id}/restore', [OngController::class, 'restore'])->name('ongs.restore');

        Route::apiResource('parceiros', ParceiroController::class)->except(['index', 'show']);
        Route::post('parceiros/{id}/restore', [ParceiroController::class, 'restore'])->name('parceiros.restore');

        Route::apiResource('lares-temporarios', LaresTemporarioController::class)->except(['index', 'show']);
        Route::post('lares-temporarios/{id}/restore', [LaresTemporarioController::class, 'restore'])->name('lares-temporarios.restore');

        Route::apiResource('contato-ongs', ContatoOngController::class)->except(['index', 'show']);
        Route::post('contato-ongs/{id}/restore', [ContatoOngController::class, 'restore'])->name('contato-ongs.restore');

        Route::apiResource('documentos', DocumentoController::class)->except(['index', 'show']);
        Route::post('documentos/{id}/restore', [DocumentoController::class, 'restore'])->name('documentos.restore');


        Route::apiResource('transacoes', TransacaoController::class)->except(['index', 'show']);
        Route::post('transacoes/{id}/restore', [TransacaoController::class, 'restore'])->name('transacoes.restore');

        Route::apiResource('animais', AnimalController::class)->except(['index', 'show']);
        Route::post('/animais/{id}/restore', [AnimalController::class, 'restore'])->name('animais.restore');
        Route::get('/integracoes', [IntegracaoController::class, 'index'])->name('integracoes.index');

        Route::apiResource('eventos', EventoController::class)->except(['index', 'show']);
        Route::post('/eventos/{id}/restore', [EventoController::class, 'restore'])->name('eventos.restore');

        Route::apiResource('posts', PostController::class)->except(['index', 'show']);
        Route::post('/posts/{id}/restore', [PostController::class, 'restore'])->name('posts.restore');

        /**
         * ADOÇÕES - ações administrativas
         */
        Route::post('/adocoes/{id}/restore', [AdocaoController::class, 'restore'])->name('adocoes.restore');
        Route::post('/adocoes/{id}/aprovar', [AdocaoController::class, 'approve'])->name('adocoes.approve');
    });
});
