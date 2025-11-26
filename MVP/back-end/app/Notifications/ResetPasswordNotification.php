<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $url = url('/reset-password?token=' . $this->token . '&email=' . $notifiable->email);

        return (new MailMessage)
            ->subject('Redefinição de Senha')
            ->line('Você está recebendo este e-mail porque foi solicitada uma redefinição de senha.')
            ->action('Redefinir Senha', $url)
            ->line('Se não foi você, ignore este e-mail.');
    }
}