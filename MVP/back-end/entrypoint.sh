#!/bin/bash
set -e

echo "🚀 Iniciando o Entrypoint..."

echo "🔍 Verificando configurações de ambiente..."

if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📋 Copiando .env.example para .env..."
    cp .env.example .env

    echo "🔑 Gerando nova APP_KEY..."
    php artisan key:generate

    if [ -n "$DB_HOST" ]; then
        echo "🔌 Configurando DB_HOST para: $DB_HOST"
        sed -i "s/^DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    fi

    if [ -n "$DB_PASSWORD" ]; then
         sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    fi

else
    echo "✅ Arquivo .env já existe."

    if grep -q "APP_KEY=$" .env || grep -q "APP_KEY=\s*$" .env; then
        echo "🔑 APP_KEY está vazia. Gerando..."
        php artisan key:generate
    fi
fi

echo "📂 Verificando estrutura de diretórios..."
mkdir -p /var/www/storage/framework/{sessions,views,cache}
mkdir -p /var/www/storage/logs
mkdir -p /var/www/bootstrap/cache

echo "🔧 Ajustando permissões..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

echo "🔗 Garantindo link simbólico do storage..."
php artisan storage:link || true

# --- 3. BANCO DE DADOS E MIGRAÇÕES ---
if [ -n "$DB_HOST" ]; then
    echo "📊 Banco configurado: $DB_HOST"

    echo "⏳ Aguardando conexão com o banco..."
    until nc -z -v -w30 "$DB_HOST" 3306
    do
      echo "aguardando banco de dados na porta 3306..."
      sleep 5
    done

    echo "🗄️ Rodando migrações..."
    php artisan migrate:fresh --seed --force || echo "⚠️ Migrate falhou, mas continuando..."
fi

echo "⚡ Otimizando a aplicação..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🏁 Iniciando o Apache..."
exec "$@"
