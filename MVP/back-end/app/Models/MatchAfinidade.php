<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MatchAfinidade extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'matches'; // nome da tabela no plural snake_case

    protected $fillable = [
        'usuario_id',
        'animal_id',
        'status', // 'em_adocao' | 'escolhido' | 'rejeitado'
        'observacao',
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

    // Scopes para facilitar consultas por status
    public function scopeEmAdocao($query)
    {
        return $query->where('status', 'em_adocao');
    }

    public function scopeEscolhidos($query)
    {
        return $query->where('status', 'escolhido');
    }

    public function scopeRejeitados($query)
    {
        return $query->where('status', 'rejeitado');
    }
}