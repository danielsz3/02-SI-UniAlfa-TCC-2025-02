<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Illuminate\Notifications\Notifiable;


class Usuario extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'usuarios';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nome',
        'email',
        'password',
        'cpf',
        'data_nascimento',
        'telefone',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function getAuthPassword()
    {
        return $this->password;
    }

    public function endereco()
    {
        return $this->hasOne(Endereco::class, 'id_usuario', 'id');
    }

    public function preferencias()
    {
        return $this->hasOne(PreferenciaUsuario::class, 'usuario_id');
    }
}
