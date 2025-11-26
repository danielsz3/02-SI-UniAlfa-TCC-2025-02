<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imagens_lar_temporario', function (Blueprint $table) {
            $table->id('id');
            $table->unsignedBigInteger('id_lar_temporario');
            $table->string('caminho');
            $table->timestamps();

            $table->foreign('id_lar_temporario')
                  ->references('id')->on('lares_temporarios')
                  ->onDelete('cascade'); // se deletar lar → remove imagens
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imagens_lar_temporario');
    }
};