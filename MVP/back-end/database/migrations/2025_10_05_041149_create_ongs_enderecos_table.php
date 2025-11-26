<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ongs_enderecos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_ong');
            $table->unsignedBigInteger('endereco_id');
            $table->timestamps();

            $table->foreign('id_ong')
                  ->references('id_ong')->on('ongs')
                  ->cascadeOnDelete();

            $table->foreign('endereco_id')
                  ->references('id')->on('enderecos')
                  ->cascadeOnDelete();

            $table->unique(['id_ong', 'endereco_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ongs_enderecos');
    }
};