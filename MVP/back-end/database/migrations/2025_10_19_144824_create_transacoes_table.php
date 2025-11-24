<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('transacoes', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['receita', 'despesa']);
            $table->decimal('valor', 10, 2);
            $table->dateTime('data');
            $table->string('categoria');
            $table->string('descricao');
            $table->string('forma_pagamento');
            $table->enum('situacao', ['pendente', 'concluido', 'cancelado']);
            $table->text('observacao')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transacoes');
    }
};