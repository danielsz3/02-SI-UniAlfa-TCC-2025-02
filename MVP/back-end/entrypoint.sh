#!/bin/bash
set -e

echo "🚀 Iniciando o Entrypoint..."

# Ajusta permissões (Crítico para o Apache conseguir escrever logs e cache)
echo "🔧 Ajustando permissões..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Se existirem variáveis de banco, espera por ele
if [ -n "$DB_HOST" ]; then
    DB_PORT="${DB_PORT:-3306}"
    echo "⏳ Esperando pelo banco de dados em $DB_HOST:$DB_PORT..."
    while ! nc -z "$DB_HOST" "$DB_PORT"; do
      sleep 1
    done
    echo "✅ Banco de dados conectado!"
fi

echo "🔗 Garantindo link simbólico do storage..."
php artisan storage:link || true  # não falha o container se já existir

echo "🗄️ Rodando migrações..."
php artisan migrate --seed --force

echo "⚡ Otimizando a aplicação..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🏁 Iniciando o Apache..."
exec "$@"