<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE transacoes SET tipo = 'receita' WHERE tipo = 'entrada'");
        DB::statement("UPDATE transacoes SET tipo = 'despesa' WHERE tipo = 'saida'");
        DB::statement("ALTER TABLE transacoes MODIFY COLUMN tipo ENUM('receita','despesa') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("UPDATE transacoes SET tipo = 'entrada' WHERE tipo = 'receita'");
        DB::statement("UPDATE transacoes SET tipo = 'saida' WHERE tipo = 'despesa'");
        DB::statement("ALTER TABLE transacoes MODIFY COLUMN tipo ENUM('entrada','saida') NOT NULL");
    }
};