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
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('animal_id');
            $table->enum('status', ['em_aprovacao', 'aprovado', 'negado'])->default('em_aprovacao');
            $table->enum('qtd_pessoas_casa', ['sozinho', 'uma_pessoa', 'duas_pessoas', 'tres_pessoas', 'quatro_ou_mais'])->nullable();
            $table->boolean('possui_filhos')->nullable();
            $table->json('sobre_rotina')->nullable();
            $table->enum('acesso_rua_janelas', ['janelas_telas_sem_acesso_rua', 'janelas_sem_telas', 'janelas_sem_telas_instalarei'])->nullable();
            $table->enum('acesso_rua_portoes_muros', ['impedem_escape', 'permitem_acesso_rua', 'serao_adaptados'])->nullable();
            $table->enum('renda_familiar', ['acima_2_sm', 'abaixo_2_sm', 'outro'])->nullable();
            $table->boolean('aceita_termos')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('animal_id')->references('id')->on('animais')->onDelete('cascade');

            $table->unique(['usuario_id', 'animal_id']);
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adocoes');
    }
};