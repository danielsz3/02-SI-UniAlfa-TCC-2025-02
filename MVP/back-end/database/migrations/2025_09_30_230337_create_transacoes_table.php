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
        Schema::create('transacoes', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['receita', 'despesa']); // Tipo da transação
            $table->decimal('valor', 10, 2);            // Valor financeiro
            $table->dateTime('data');                   // Data da transação
            $table->string('categoria');                // Categoria
            $table->string('descricao');    // Descrição
            $table->string('forma_pagamento');          // Forma de pagamento
            $table->enum('situacao', ['pendente', 'concluido', 'cancelado']); // Situação
            $table->text('observacao')->nullable();     // Observação opcional
            $table->timestamps();                       // created_at e updated_at
            $table->softDeletes();                      // deleted_at (soft delete)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transacoes');
    }
};
