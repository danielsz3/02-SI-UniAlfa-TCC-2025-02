<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Endereco extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'enderecos';

    protected $primaryKey = 'id';


    protected $fillable = [
        'id_usuario',
        'lar_temporario_id',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'uf'
    ];

    // Relacionamentos
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id');
    }

    public function larTemporario()
    {
        return $this->belongsTo(LarTemporario::class, 'lar_temporario_id', 'id');
    }
}
