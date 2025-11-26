<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('imagens_lar_temporario', function (Blueprint $table) {
            $table->integer('width')->nullable()->after('caminho');
            $table->integer('height')->nullable()->after('width');
        });

        Schema::table('imagens_animais', function (Blueprint $table) {
            $table->integer('width')->nullable()->after('caminho');
            $table->integer('height')->nullable()->after('width');
        });
    }

    public function down(): void
    {
        Schema::table('imagens_lar_temporario', function (Blueprint $table) {
            $table->dropColumn(['width', 'height']);
        });

        Schema::table('imagens_animais', function (Blueprint $table) {
            $table->dropColumn(['width', 'height']);
        });
    }
};