#!/bin/bash

# Настройки
DOMAIN="yourdomain.com"  # Замените на ваш домен
WEBHOOK_SECRET="your-super-secure-webhook-secret-here"  # Замените на ваш секрет
TEST_DOMAIN="test.example.com"  # Тестовый домен

echo "Тестирование webhook endpoint..."

# Создаем payload
PAYLOAD='{
  "domain": "'$TEST_DOMAIN'",
  "action": "add",
  "webhook_secret": "'$WEBHOOK_SECRET'"
}'

echo "Payload: $PAYLOAD"

# Вычисляем подпись (если используется)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha1 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

echo "Отправляем запрос к webhook..."

# Отправляем запрос
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "http://$DOMAIN/webhook/nginx-ssl" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha1=$SIGNATURE" \
  -d "$PAYLOAD")

# Разделяем ответ и статус
HTTP_BODY=$(echo "$RESPONSE" | sed -E '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed -E 's/.*:([0-9]{3})$/\1/')

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $HTTP_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Webhook работает успешно!"
else
    echo "❌ Ошибка webhook. Проверьте логи:"
    echo "sudo journalctl -u domain-webhook -n 20"
fi
