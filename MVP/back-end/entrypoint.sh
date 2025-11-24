#!/bin/bash
set -e

echo "🚀 Iniciando o Entrypoint..."
echo "ENV DB_HOST = $DB_HOST"
# Ajusta permissões
echo "🔧 Ajustando permissões..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache || true
chmod -R 775 /var/www/storage /var/www/bootstrap/cache || true

echo "🔗 Garantindo link simbólico do storage..."
php artisan storage:link || true

# Se houver variáveis de banco configuradas, roda as migrações
if [ -n "$DB_HOST" ]; then
    echo "📊 Banco configurado: $DB_HOST"

    echo "🗄️ Rodando migrações..."
    php artisan migrate --force || echo "⚠️ Migrate falhou, continuando..."

    # Descomente a linha abaixo se quiser rodar seeds automaticamente:
    # php artisan db:seed --force || echo "⚠️ Seed falhou, continuando..."
fi

echo "⚡ Otimizando a aplicação..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "🏁 Iniciando o Apache..."
exec "$@"