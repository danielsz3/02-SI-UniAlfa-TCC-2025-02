<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enderecos', function (Blueprint $table) {
            // deixa o id_usuario opcional
            $table->unsignedBigInteger('id_usuario')->nullable()->change();

            // adiciona lar_temporario_id
            $table->unsignedBigInteger('lar_temporario_id')->nullable()->after('id_usuario');
            $table->foreign('lar_temporario_id')->references('id')->on('lares_temporarios')->onDelete('cascade');

            // índice conjunto para queries rápidas
            $table->index(['id_usuario', 'lar_temporario_id']);
        });
    }

    public function down(): void
    {
        Schema::table('enderecos', function (Blueprint $table) {
            $table->dropForeign(['lar_temporario_id']);
            $table->dropColumn('lar_temporario_id');

            $table->unsignedBigInteger('id_usuario')->nullable(false)->change();
        });
    }
};