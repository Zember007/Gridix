# AmoCRM API Edge Function

Эта edge function обрабатывает все запросы к AmoCRM API, обеспечивая безопасность и централизованное управление интеграцией.

## Функциональность

- **fetch_data**: Загружает данные из AmoCRM (воронки, пользователи, информация об аккаунте)

## Параметры запроса

```json
{
  "project_id": "string", // ID проекта (обязательно)
  "action": "fetch_data"  // Действие для выполнения (обязательно)
}
```

## Ответ

```json
{
  "data": {
    "account": {
      "id": number,
      "name": string,
      "subdomain": string,
      "country": string
    },
    "pipelines": [
      {
        "id": number,
        "name": string,
        "sort": number,
        "is_main": boolean,
        "is_archive": boolean,
        "statuses": [
          {
            "id": number,
            "name": string,
            "sort": number,
            "color": string,
            "type": number,
            "pipeline_id": number
          }
        ]
      }
    ],
    "users": [
      {
        "id": number,
        "name": string,
        "email": string,
        "is_admin": boolean,
        "group": {
          "id": number,
          "name": string
        }
      }
    ]
  }
}
```

## Безопасность

- Проверяет существование проекта и права доступа
- Валидирует токены AmoCRM
- Проверяет срок действия токенов
- Использует service role key для доступа к базе данных

## Ошибки

- `400`: Неверные параметры запроса
- `401`: AmoCRM не авторизован или токен истек
- `404`: Проект или настройки AmoCRM не найдены
- `500`: Внутренняя ошибка сервера
