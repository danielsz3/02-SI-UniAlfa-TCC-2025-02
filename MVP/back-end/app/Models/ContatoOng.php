<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContatoOng extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contatos_ongs';
    protected $primaryKey = 'id';

    protected $fillable = [
        'ong_id',
        'tipo',
        'contato',
        'link',
        'descricao',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function ong()
    {
        return $this->belongsTo(Ong::class, 'ong_id', 'id');
    }
}
