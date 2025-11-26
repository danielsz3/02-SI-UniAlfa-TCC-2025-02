<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PreferenciaUsuario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'preferencias_usuarios';

    protected $primaryKey = 'id';

    protected $fillable = [
        'usuario_id',
        'tamanho_pet',
        'tempo_disponivel',
        'estilo_vida',
        'espaco_casa',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public static $descricoes = [
        'tamanho_pet' => [
            'pequeno' => 'Pets que pesam até 10kg',
            'medio'   => 'Pets entre 10kg e 25kg',
            'grande'  => 'Pets acima de 25kg',
        ],
        'tempo_disponivel' => [
            'pouco_tempo'    => 'Menos de 2h livres por dia',
            'tempo_moderado' => 'Cerca de 2 a 4h livres por dia',
            'muito_tempo'    => 'Mais de 4h livres por dia',
        ],
        'estilo_vida' => [
            'vida_tranquila'     => 'Rotina calma, prefere tranquilidade',
            'ritmo_equilibrado'  => 'Equilíbrio entre descanso e atividades',
            'sempre_em_acao'     => 'Rotina ativa e cheia de exercícios',
        ],
        'espaco_casa' => [
            'area_pequena' => 'Apartamento pequeno / kitnet',
            'area_media'   => 'Casa ou apê com espaço moderado',
            'area_externa' => 'Casa com quintal ou grande área externa',
        ],
    ];

    //Acessor para retornar descrições legíveis
    public function getPreferenciasDescritasAttribute()
    {
        $prefs = $this->only([
            'tamanho_pet',
            'tempo_disponivel',
            'estilo_vida',
            'espaco_casa',
        ]);

        $descricoes = [];
        foreach ($prefs as $campo => $valor) {
            $descricoes[$campo] = self::$descricoes[$campo][$valor] ?? $valor;
        }

        return $descricoes;
    }
}
