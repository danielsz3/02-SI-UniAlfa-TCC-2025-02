<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ongs', function (Blueprint $table) {
            // Ajusta o tamanho do campo cnpj para 14 caracteres (sem unique, pois já existe)
            $table->string('cnpj', 14)->change();

            // Ajusta tamanhos dos campos bancários para refletir a UI
            $table->string('banco', 100)->nullable()->change();
            $table->string('agencia', 10)->nullable()->change();

            // Adiciona coluna numero_conta se ainda não existir
            if (!Schema::hasColumn('ongs', 'numero_conta')) {
                $table->string('numero_conta', 20)->nullable()->after('agencia');
            }

            // Ajusta tamanho do campo conta
            $table->string('conta', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ongs', function (Blueprint $table) {
            // Reverte o tamanho do campo cnpj para 18 (como estava antes)
            $table->string('cnpj', 18)->change();

            // Reverte os tamanhos dos campos bancários para o estado anterior
            $table->string('banco')->nullable()->change();
            $table->string('agencia')->nullable()->change();

            // Remove a coluna numero_conta se existir
            if (Schema::hasColumn('ongs', 'numero_conta')) {
                $table->dropColumn('numero_conta');
            }

            // Reverte o tamanho do campo conta
            $table->string('conta')->nullable()->change();
        });
    }
};