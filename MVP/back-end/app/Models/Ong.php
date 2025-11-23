<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ong extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ongs';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nome',
        'cnpj',
        'razao_social',
        'descricao',
        'imagem',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'uf',
        'banco',
        'agencia',
        'numero_conta',
        'tipo_conta',
        'chave_pix',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function contatos()
    {
        return $this->hasMany(ContatoOng::class, 'ong_id', 'id');
    }

    public function imagens()
    {
        return $this->hasMany(ImagemOng::class, 'ong_id', 'id');
    }
}
