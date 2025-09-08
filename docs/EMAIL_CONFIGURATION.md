# Настройка Email для отправки приглашений менеджерам (SMTP)

Система может отправлять письма напрямую через SMTP без сторонних сервисов.

## Что понадобится
- SMTP доступ от вашего почтового провайдера (Gmail, Outlook, Яндекс и т.п.)
- Учётные данные: хост, порт, логин, пароль приложения (для Gmail — App Password)
- Отправитель `FROM_EMAIL` (например, `noreply@yourdomain.com`)

## Переменные окружения (Edge Function)
Настраиваются в Supabase → Project Settings → Functions → Environment Variables:
- `SMTP_HOST` — smtp.gmail.com / smtp.yandex.ru / smtp.office365.com и т.д.
- `SMTP_PORT` — 465 (TLS) или 587 (STARTTLS)
- `SMTP_USERNAME` — логин SMTP (обычно email)
- `SMTP_PASSWORD` — пароль SMTP (для Gmail — App Password)
- `FROM_EMAIL` — адрес отправителя (например, noreply@yourdomain.com)
- `SITE_URL` — ваш сайт, например `https://yourdomain.com` (используется в ссылке приглашения)

Сохраните и задеплойте функцию `send-manager-invitation` заново при изменениях переменных.

## Локальная разработка (опционально)
Если запускаете Edge Functions локально через Supabase CLI, передайте те же переменные как secrets:
```bash
supabase functions secrets set SMTP_HOST=...
supabase functions secrets set SMTP_PORT=465
supabase functions secrets set SMTP_USERNAME=...
supabase functions secrets set SMTP_PASSWORD=...
supabase functions secrets set FROM_EMAIL=noreply@yourdomain.com
supabase functions secrets set SITE_URL=http://localhost:5173
```

Примечание: обычный `.env.local` для фронтенда не влияет на Edge Functions.

## Как это работает сейчас
Функция `send-manager-invitation` сначала пытается отправить письмо через SMTP. Если переменные SMTP не заданы, она не падает, а логирует содержимое письма в логи и интерфейс позволяет скопировать ссылку приглашения вручную.

## Тестирование
1. Добавьте менеджера в админке.
2. Проверьте Supabase → Edge Functions → Logs (успех/ошибки SMTP).
3. Убедитесь, что письмо пришло (проверьте Спам).

## Типовые проблемы
- Письмо не пришло: проверьте SMTP_HOST/PORT/USERNAME/PASSWORD, порт (465 vs 587), FROM_EMAIL.
- Gmail: включите 2FA и используйте App Password, обычный пароль работать не будет.
- Доставляемость: для лучшей доставляемости используйте доменный адрес отправителя и корректные DNS (SPF/DKIM/DMARC).

## Альтернатива
Можно вместо кастомного письма использовать Supabase Auth Invite + ваш SMTP в Auth Settings. Это проще, но письмо будет шаблонным и логика приглашения изменится (редирект через `redirectTo`).
