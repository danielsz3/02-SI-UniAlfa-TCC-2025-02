<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ongs_enderecos', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('imagens_ongs', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('contatos_ongs', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('ongs_enderecos', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('imagens_ongs', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('contatos_ongs', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};