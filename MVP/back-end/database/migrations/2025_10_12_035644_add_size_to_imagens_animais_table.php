<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('imagens_animais', function (Blueprint $table) {
            // Adiciona colunas após 'caminho' (ajuste se quiser outra ordem)
            if (!Schema::hasColumn('imagens_animais', 'width')) {
                $table->unsignedInteger('width')->nullable()->after('caminho');
            }
            if (!Schema::hasColumn('imagens_animais', 'height')) {
                $table->unsignedInteger('height')->nullable()->after('width');
            }
        });
    }

    public function down(): void
    {
        Schema::table('imagens_animais', function (Blueprint $table) {
            if (Schema::hasColumn('imagens_animais', 'width')) {
                $table->dropColumn('width');
            }
            if (Schema::hasColumn('imagens_animais', 'height')) {
                $table->dropColumn('height');
            }
        });
    }
};