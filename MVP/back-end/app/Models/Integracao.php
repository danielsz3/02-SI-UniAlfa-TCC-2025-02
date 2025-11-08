<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Integracao extends Model
{
    use SoftDeletes;

    protected $table = 'integracoes';

    protected $fillable = [
        'service',
        'username',
        'access_token',
        'user_id',
        'status',
    ];
}