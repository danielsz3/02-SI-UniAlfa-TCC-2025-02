#!/bin/sh

# --------------------------------------------------------------------------
# Script de Inicialização para o Contêiner Laravel
# --------------------------------------------------------------------------
# Este script é executado toda vez que o contêiner inicia.

# 1. Esperar o MySQL ficar pronto para aceitar conexões.
#    O 'mysql' é o nome do serviço do banco de dados no docker-compose.yml.
#    O 'nc' (netcat) testa se a porta 3306 está aberta.
echo "Aguardando o banco de dados (mysql:3306)..."
while ! nc -z mysql 3306; do
  sleep 1
done
echo "Banco de dados conectado!"


# 2. Gerar a chave da aplicação, se ela não existir.
#    Isso evita o erro de "No application encryption key has been specified".
if [ ! -f ".env" ] || [ -z "$APP_KEY" ]; then
    echo "Gerando APP_KEY..."
    php artisan key:generate
else
    echo "APP_KEY já existe."
fi


# 3. Rodar as migrations para criar/atualizar o schema do banco.
#    O '--force' é importante para rodar em um ambiente não-interativo.
echo "Rodando as migrations..."
php artisan migrate --force


# 4. Limpar os caches para garantir que as configurações mais recentes sejam usadas.
echo "Limpando caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear


# 5. Corrigir permissões das pastas de storage e cache.
#    Garante que o Laravel consiga escrever nos logs e outros arquivos.
echo "Ajustando permissões..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache


# 6. Iniciar o processo principal do contêiner (php-fpm).
#    O 'exec "$@"' passa o controle para o comando definido no `CMD` do Dockerfile.
#    Isso é ESSENCIAL para manter o contêiner rodando.
echo "Iniciando PHP-FPM..."
exec "$@"
