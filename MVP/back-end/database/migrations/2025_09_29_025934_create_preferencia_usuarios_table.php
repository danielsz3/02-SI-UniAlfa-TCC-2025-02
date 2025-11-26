<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('preferencias_usuarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');

            $table->string('tamanho_pet');       // pequeno, medio, grande
            $table->string('tempo_disponivel');  // pouco_tempo, tempo_moderado, muito_tempo
            $table->string('estilo_vida');       // vida_tranquila, ritmo_equilibrado, sempre_em_acao
            $table->string('espaco_casa');       // area_pequena, area_media, area_externa

            $table->timestamps();

            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('preferencia_usuarios');
    }
};
