#!/bin/bash

echo "🔧 Исправление проблем с webhook-server..."

echo "1. Проверяем где установлен webhook binary..."
WEBHOOK_PATH=$(which webhook)
if [ -z "$WEBHOOK_PATH" ]; then
    echo "❌ webhook binary не найден в PATH"
    
    # Попробуем найти его в npm глобальной папке
    NPM_GLOBAL=$(npm root -g)
    if [ -d "$NPM_GLOBAL/webhook" ]; then
        echo "✅ Найден webhook в npm: $NPM_GLOBAL/webhook"
        WEBHOOK_BIN="$NPM_GLOBAL/webhook/bin/webhook"
        if [ -f "$WEBHOOK_BIN" ]; then
            echo "✅ Binary найден: $WEBHOOK_BIN"
            sudo ln -sf "$WEBHOOK_BIN" /usr/bin/webhook
            echo "✅ Создана символическая ссылка в /usr/bin/webhook"
        fi
    else
        echo "❌ webhook не найден в npm global modules"
        echo "Попробуйте переустановить: npm install -g webhook"
        exit 1
    fi
else
    echo "✅ webhook найден: $WEBHOOK_PATH"
    if [ "$WEBHOOK_PATH" != "/usr/bin/webhook" ]; then
        sudo ln -sf "$WEBHOOK_PATH" /usr/bin/webhook
        echo "✅ Создана символическая ссылка в /usr/bin/webhook"
    fi
fi

echo "2. Проверяем права доступа..."
sudo chmod +x /usr/bin/webhook
sudo chmod +r /usr/local/bin/webhook-config.json

echo "3. Тестируем webhook binary..."
if /usr/bin/webhook --version; then
    echo "✅ webhook binary работает"
else
    echo "❌ webhook binary не работает"
    exit 1
fi

echo "4. Обновляем systemd сервис..."
# Скопируем обновленный сервис файл
sudo cp domain-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "5. Обновляем Nginx конфигурацию..."
sudo cp nginx-webhook-proxy.conf /etc/nginx/sites-available/webhook-proxy
sudo nginx -t

echo "6. Перезапускаем сервисы..."
sudo systemctl stop domain-webhook
sudo systemctl start domain-webhook
sudo systemctl status domain-webhook --no-pager -l

if sudo systemctl is-active --quiet domain-webhook; then
    echo "✅ Webhook сервис успешно запущен!"
    
    echo "7. Перезагружаем Nginx..."
    sudo systemctl reload nginx
    
    echo "8. Проверяем доступность endpoint..."
    sleep 2
    if curl -s -f http://localhost:8081/hooks/nginx-ssl > /dev/null; then
        echo "✅ Webhook endpoint доступен на порту 8081"
    else
        echo "⚠️  Webhook endpoint пока недоступен, но сервис запущен"
    fi
    
    echo ""
    echo "🎉 Настройка завершена!"
    echo "Webhook endpoint: http://yourdomain.com/webhook/nginx-ssl"
    echo "Локальный endpoint: http://localhost:8081/hooks/nginx-ssl"
    
else
    echo "❌ Webhook сервис не запустился. Проверьте логи:"
    echo "sudo journalctl -u domain-webhook -n 20"
fi
