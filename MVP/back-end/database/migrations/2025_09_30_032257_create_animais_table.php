<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('animais', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->enum('sexo', ['macho', 'femea']);
            $table->date('data_nascimento');
            $table->boolean('castrado')->default(false);
            $table->boolean('vale_castracao')->default(false);
            $table->text('descricao')->nullable();
             $table->enum('situacao', ['disponivel','adotado','em_adocao','em_aprovação'])->default('disponivel');

            // tipo de animal
            $table->enum('tipo_animal', ['cao','gato','outro']);

            // comportamento (comparável com preferências do usuário)
            $table->enum('nivel_energia', ['baixa','moderada','alta'])->nullable();
            $table->enum('tamanho', ['pequeno','medio','grande'])->nullable();
            $table->enum('tempo_necessario', ['pouco_tempo','tempo_moderado','muito_tempo'])->nullable();
            $table->enum('ambiente_ideal', ['area_pequena','area_media','area_externa'])->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animais');
    }
};