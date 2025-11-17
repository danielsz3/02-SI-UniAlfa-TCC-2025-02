#!/bin/bash
set -e

echo "🚀 Iniciando o Entrypoint..."

# Ajusta permissões (Crítico para o Apache conseguir escrever logs e cache)
# O usuário do Apache geralmente é www-data
echo "🔧 Ajustando permissões..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Se existirem variáveis de banco, espera por ele
if [ -n "$DB_HOST" ]; then
    echo "⏳ Esperando pelo banco de dados em $DB_HOST..."
    # Tenta conectar até conseguir
    while ! nc -z $DB_HOST $DB_PORT; do
      sleep 1
    done
    echo "✅ Banco de dados conectado!"
fi

echo "🗄️ Rodando migrações..."
php artisan migrate --seed --force

echo "⚡ Otimizando a aplicação..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🏁 Iniciando o Apache..."
# Executa o comando CMD do Dockerfile (apache2-foreground)
exec "$@"