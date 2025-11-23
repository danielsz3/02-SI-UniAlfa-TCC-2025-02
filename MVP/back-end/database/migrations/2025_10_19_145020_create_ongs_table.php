<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ongs', function (Blueprint $table) {
            $table->id('id');
            $table->string('nome');
            $table->string('cnpj', 14)->unique();
            $table->string('razao_social');
            $table->text('descricao')->nullable();
            $table->string('imagem')->nullable();

            $table->string('cep')->nullable();
            $table->string('logradouro')->nullable();
            $table->string('numero')->nullable();
            $table->string('complemento')->nullable();
            $table->string('bairro')->nullable();
            $table->string('cidade')->nullable();
            $table->string('uf', 2)->nullable();

            $table->string('banco')->nullable();
            $table->string('agencia')->nullable();
            $table->string('numero_conta')->nullable();
            $table->string('tipo_conta')->nullable();
            $table->string('chave_pix')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ongs');
    }
};
