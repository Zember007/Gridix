# TODO По Бэкенду Для Размера Видео В Project Drawer

## Цель

Показывать размер файла у видео проекта во вкладке с медиа.

Фронтенд уже подготовлен к чтению `sizeBytes` из `media.videos[]`.

Связанные места на фронтенде:

- `apps/main/src/components/projects/ProjectList.tsx`
- `packages/ui/src/shared-project-drawer.tsx`

## Что Нужно Реализовать На Бэкенде

- Обновить ответ `project-drawer` для `get_project_drawer`.
- Добавить `sizeBytes` для каждого элемента в `media.videos[]`.
- Для `upload_media_item` c `kind === "video"` принять кастомный `title`.
- Для `upload_media_item` c `kind === "video"` принять файл `thumbnail`.
- Сохранить `thumbnail` в storage и вернуть его URL в `media.videos[].thumbnail`.
- Существующие поля оставить без изменений:
  - `url`
  - `title`
  - `thumbnail`

Ожидаемая структура:

```ts
media: {
  videos?: Array<{
    url: string;
    title: string;
    thumbnail?: string;
    sizeBytes?: number;
  }>;
}
```

## Откуда Брать Размер

- Предпочтительный источник: metadata объекта в storage / metadata загруженного видеофайла.
- Хранить и отдавать сырое значение в байтах.
- Не форматировать размер на бэкенде.

## Примечания

- Фронтенд сам форматирует `sizeBytes` в `KB` / `MB` / `GB`.
- Если `sizeBytes` не пришёл, UI корректно скрывает размер.
- Если upload-логика уже имеет доступ к `file.size`, это значение можно сохранить при `upload_media_item`.
- Фронтенд уже может отправлять для нового видео не только `file`, но и кастомный `title` и отдельный `thumbnail`.
- Без сохранения `thumbnail` на бэкенде после перезагрузки останется только fallback-превью через сам `<video>`.

## Что Уже Сделано На Фронтенде

- Добавлено опциональное поле `sizeBytes` в общий тип видео.
- Добавлен вывод форматированного размера под названием видео в developer media UI.
- Добавлен вывод форматированного размера в секции видео внутри shared project drawer.
- Добавлена модалка перед загрузкой видео, где можно задать `title` и выбрать `thumbnail`.
- При загрузке видео фронтенд отправляет `title` и `thumbnail` в `upload_media_item`.
