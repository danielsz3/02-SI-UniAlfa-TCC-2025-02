<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('imagens_animais', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('animal_id');
            $table->string('caminho'); // URL ou storage
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('animal_id')->references('id')->on('animais')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imagens_animais');
    }
};