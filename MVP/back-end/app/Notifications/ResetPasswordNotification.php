<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    /**
     * Token de reset enviado pelo Password Broker
     *
     * @var string
     */
    public $token;

    /**
     * Construtor recebe o token (Laravel passa apenas o token ao chamar sendPasswordResetNotification)
     *
     * @param string $token
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {

        $frontend = config('app.frontend_url', env('FRONTEND_URL', env('APP_URL')));

        $path = '/new-password';

        $url = rtrim($frontend, '/') . $path . '?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        $expire = config('auth.passwords.usuarios.expire', 60);

        return (new MailMessage)
            ->subject('Redefinição de Senha - PetAffinity')
            ->greeting('Olá, ' . ($notifiable->nome ?? $notifiable->email) . '!')
            ->line('Você está recebendo este e‑mail porque solicitou redefinição de senha para sua conta.')
            ->action('Redefinir Senha', $url)
            ->line("Este link de redefinição expira em {$expire} minutos.")
            ->line('Se você não solicitou a redefinição de senha, nenhuma ação é necessária.')
            ->salutation('Atenciosamente, Equipe PetAffinity');
    }
}
