<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imagens_ongs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_ong');
            $table->string('caminho');              // ex: /storage/ongs/arquivo.jpg
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();

            $table->foreign('id_ong')
                  ->references('id_ong')->on('ongs')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imagens_ongs');
    }
};