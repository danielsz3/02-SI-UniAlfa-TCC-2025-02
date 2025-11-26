<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDeletedAtToPreferenciasUsuariosTable extends Migration
{
    public function up()
    {
        Schema::table('preferencias_usuarios', function (Blueprint $table) {
            $table->softDeletes(); // cria deleted_at TIMESTAMP NULL
        });
    }

    public function down()
    {
        Schema::table('preferencias_usuarios', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}
