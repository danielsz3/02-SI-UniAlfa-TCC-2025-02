<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enderecos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_usuario')->nullable();
            $table->unsignedBigInteger('lar_temporario_id')->nullable();
            $table->string('cep', 9);
            $table->string('logradouro');
            $table->string('numero');
            $table->string('complemento')->nullable();
            $table->string('bairro');
            $table->string('cidade');
            $table->string('uf', 2);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('id_usuario')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('lar_temporario_id')->references('id')->on('lares_temporarios')->onDelete('cascade');

            $table->index(['id_usuario', 'lar_temporario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enderecos');
    }
};