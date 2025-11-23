<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preferencias_usuarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->enum('tamanho_pet', ['pequeno', 'medio', 'grande'])->nullable();// pequeno, medio, grande
            $table->enum('tempo_disponivel', ['pouco_tempo', 'tempo_moderado', 'muito_tempo'])->nullable();// pouco_tempo, tempo_moderado, muito_tempo
            $table->enum('estilo_vida', ['baixa', 'moderada', 'alta'])->nullable();// vida_tranquila, ritmo_equilibrado, sempre_em_acao
            $table->enum('espaco_casa',['area_pequena', 'area_media', 'area_externa'])->nullable();// area_pequena, area_media, area_externa
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('usuario_id')
                  ->references('id')
                  ->on('usuarios')
                  ->onDelete('cascade');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('preferencias_usuarios');
    }
};