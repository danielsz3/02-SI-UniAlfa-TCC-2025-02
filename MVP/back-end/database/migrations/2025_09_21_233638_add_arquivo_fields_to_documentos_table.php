<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('documentos', function (Blueprint $table) {
            $table->string('arquivo')->after('descricao');
            $table->string('tipo')->nullable()->after('arquivo');
            $table->integer('tamanho')->nullable()->after('tipo');
        });
    }

    public function down()
    {
        Schema::table('documentos', function (Blueprint $table) {
            $table->dropColumn(['arquivo', 'tipo', 'tamanho']);
        });
    }
};
