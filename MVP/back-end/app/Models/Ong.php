<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\User;
use App\Models\Endereco;
use App\Models\ImagemOng;
use App\Models\ContatoOng;


class Ong extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ongs';
    protected $primaryKey = 'id_ong';

    protected $fillable = [
        'nome_ong',
        'cnpj',
        'descricao',
        'imagem',
        'url_banner',
        'telefone',
        'pix',
        'banco',
        'agencia',
        'numero_conta',
        'conta',
    ];

    public function enderecos()
    {
        return $this->belongsToMany(Endereco::class, 'ongs_enderecos', 'id_ong', 'endereco_id');
    }

    public function imagens()
    {
        return $this->hasMany(ImagemOng::class, 'id_ong', 'id_ong');
    }

    public function contatos()
    {
        return $this->hasMany(ContatoOng::class, 'id_ong', 'id_ong');
    }
}
