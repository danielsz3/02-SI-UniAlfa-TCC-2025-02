<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContatoOng extends Model
{
    use HasFactory,SoftDeletes;

    protected $table = 'contatos_ongs';

    protected $primaryKey = 'id';


    protected $fillable = [
        'id_ong',
        'tipo',
        'contato',
        'link',
        'descricao',
    ];

    public function ong()
    {
        return $this->belongsTo(Ong::class, 'id_ong', 'id_ong');
    }
}