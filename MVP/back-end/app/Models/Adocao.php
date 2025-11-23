<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Adocao extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'adocoes';
    protected $primaryKey = 'id';

    protected $fillable = [
        'usuario_id',
        'animal_id',
        'status',
        'qtd_pessoas_casa',
        'possui_filhos',
        'sobre_rotina',
        'acesso_rua_janelas',
        'acesso_rua_portoes_muros',
        'renda_familiar',
        'aceita_termos',
    ];

    protected $casts = [
        'possui_filhos' => 'boolean',
        'aceita_termos' => 'boolean',
        'sobre_rotina'  => 'array',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    public function scopeEmAprovacao($query)
    {
        return $query->where('status', 'em_aprovacao');
    }

    public function scopeAprovadas($query)
    {
        return $query->where('status', 'aprovado');
    }
}
