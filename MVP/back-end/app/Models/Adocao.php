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
        'status',                   // 'em_aprovacao' | 'aprovado'
        'qtd_pessoas_casa',         // enum
        'possui_filhos',            // bool
        'sobre_rotina',             // array(JSON)
        'acesso_rua_janelas',       // enum
        'acesso_rua_portoes_muros', // enum
        'renda_familiar',           // enum
        'aceita_termos',            // bool
    ];

    protected $casts = [
        'possui_filhos' => 'boolean',
        'aceita_termos' => 'boolean',
        'sobre_rotina'  => 'array',
    ];

    // Relacionamentos
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    // Scopes auxiliares
    public function scopeEmAprovacao($query)
    {
        return $query->where('status', 'em_aprovacao');
    }

    public function scopeAprovadas($query)
    {
        return $query->where('status', 'aprovado');
    }
}