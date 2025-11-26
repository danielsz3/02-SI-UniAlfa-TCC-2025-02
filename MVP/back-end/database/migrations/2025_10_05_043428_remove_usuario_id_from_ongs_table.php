<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ongs', function (Blueprint $table) {
            if (Schema::hasColumn('ongs', 'usuario_id')) {
                $table->dropForeign(['usuario_id']); // se tiver FK
                $table->dropColumn('usuario_id');
            }
            if (Schema::hasColumn('ongs', 'id_usuario')) {
                $table->dropForeign(['id_usuario']); // se tiver FK
                $table->dropColumn('id_usuario');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ongs', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id')->nullable();
            // Se quiser, pode recriar a FK aqui
            // $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
        });
    }
};