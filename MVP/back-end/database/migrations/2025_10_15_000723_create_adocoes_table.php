<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adocoes', function (Blueprint $table) {
            $table->id();

            // Relacionamentos
            // Ajuste os nomes das tabelas referenciadas conforme seu projeto:
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('animal_id')->constrained('animais')->cascadeOnDelete();
            // Se sua tabela de animais se chama 'animais', use ->constrained('animais')

            // Status controlado por ENUM no MySQL
            $table->enum('status', ['em_aprovacao', 'aprovado'])
                  ->default('em_aprovacao')
                  ->index();

            // ============ FORMULÁRIO ÚNICO ============

            // 1) Você, Família e Rotina
            $table->enum('qtd_pessoas_casa', [
                'sozinho',
                'uma_pessoa',
                'duas_pessoas',
                'tres_pessoas',
                'quatro_ou_mais',
            ])->nullable();

            $table->boolean('possui_filhos')->nullable();

            // múltipla escolha vinda como array
            $table->json('sobre_rotina')->nullable();

            // 2) Segurança da Casa
            $table->enum('acesso_rua_janelas', [
                'janelas_telas_sem_acesso_rua',
                'janelas_sem_telas',
                'janelas_sem_telas_instalarei',
            ])->nullable();

            $table->enum('acesso_rua_portoes_muros', [
                'impedem_escape',
                'permitem_acesso_rua',
                'serao_adaptados',
            ])->nullable();

            // 3) Condições Finais e Acordo
            $table->enum('renda_familiar', [
                'acima_2_sm',
                'abaixo_2_sm',
                'outro',
            ])->nullable();

            $table->boolean('aceita_termos')->default(false);

            // Regra: um usuário só pode ter uma solicitação por animal
            $table->unique(['usuario_id', 'animal_id'], 'uniq_usuario_id_animal');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adocoes');
    }
};