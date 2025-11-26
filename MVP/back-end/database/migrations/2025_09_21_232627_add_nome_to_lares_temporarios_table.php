<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lares_temporarios', function (Blueprint $table) {
            $table->string('nome')->after('id'); // adiciona a coluna nome
        });
    }

    public function down(): void
    {
        Schema::table('lares_temporarios', function (Blueprint $table) {
            $table->dropColumn('nome'); // rollback remove a coluna
        });
    }
};