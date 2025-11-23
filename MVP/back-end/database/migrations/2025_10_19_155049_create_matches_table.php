<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('animal_id');
            $table->enum('status', ['em_adocao', 'escolhido', 'rejeitado', 'finalizado'])->default('em_adocao');
            $table->string('observacao')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('animal_id')->references('id')->on('animais')->onDelete('cascade');

            $table->unique(['usuario_id', 'animal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};