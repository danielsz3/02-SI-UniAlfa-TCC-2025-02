<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE transacoes MODIFY COLUMN tipo ENUM('receita','despesa') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE transacoes MODIFY COLUMN tipo ENUM('entrada','saida') NOT NULL");
    }
};