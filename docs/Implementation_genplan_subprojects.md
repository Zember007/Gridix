# Реализация: Генплан + Субпроекты

> Дата реализации: Апрель 2026  
> Связанный документ: `docs/Workflow_genplan.md`

---

## Общая суть изменений

Система перешла от **проекто-центричной** модели данных к **субпроекто-центричной**.  
До изменений квартиры, этажи, фасады, поля и настройки относились к `projects`.  
После — все доменные данные относятся к `sub_projects`, а проект является лишь «оберткой».

---

## 1. Миграции базы данных

### `20260403191046` — Создание таблицы `sub_projects`

- Поля: `id`, `project_id (FK)`, `name`, `slug`, `type`, `sort_order`, `is_default`

### `20260403191047` — Добавление `sub_project_id` в дочерние таблицы

- Таблицы: `apartments`, `floor_plans`, `layout_photos`, `leads`
- Тип: UUID nullable FK → `sub_projects(id) ON DELETE SET NULL`
- Индексы на каждом FK

### `20260403191048` — Backfill существующих данных

- Для каждого `project` создаётся дефолтный субпроект (`is_default = true`, `slug = "default"`)
- Все строки в `apartments`, `floor_plans`, `layout_photos`, `leads` получают `sub_project_id` дефолтного субпроекта

### `20260406100000` — `sub_project_id` в фасадах и этажах

- Таблицы: `project_facades`, `building_floors`
- Backfill: привязывает существующие строки к дефолтному субпроекту
- Смысл: фасады и полигоны этажей теперь принадлежат конкретному субпроекту

### `20260406100001` — Настройки в `sub_projects`

- Добавлены колонки: `floors`, `has_parking`, `has_commercial`, `facade_open`
- Добавлены: `polygon_settings_facade`, `polygon_settings_floor` (JSONB)
- Добавлена: `building_image_url`
- Backfill: значения копируются из родительского `projects`

### `20260406100002` — `sub_project_id` в таблицах полей

- Таблицы: `project_field_settings`, `project_custom_fields`
- Тип: UUID nullable FK → `sub_projects(id) ON DELETE CASCADE`
- Backfill: привязывает существующие строки к дефолтному субпроекту

### `20260406100003` — `polygon_display_settings` в мастерпланах

- Таблица: `project_masterplans`
- Добавлена колонка `polygon_display_settings` (JSONB)

### `20260406110000` — Перенос триггера инициализации полей с `projects` на `sub_projects`

- **Дропнут** UNIQUE (project_id, field_name) → заменён частичным уникальным индексом `(sub_project_id, field_name) WHERE sub_project_id IS NOT NULL`
- **Создана** функция `initialize_default_fields_for_sub_project(sub_project_id, project_id)` — инициализирует 6 стандартных полей: номер, этаж, комнаты, площадь, цена, статус
- **Создан** триггер `auto_initialize_sub_project_fields` AFTER INSERT ON `sub_projects`
- **Удалён** старый триггер `auto_initialize_project_fields` ON `projects`
- **Backfill**: все субпроекты без полей получают дефолтный набор

### `20260407000000` — Исправление уникальных constraints для субпроектов ⚠️ КРИТИЧНО

- **Проблема**: старые constraints были на уровне проекта, не позволяя двум субпроектам иметь фасады или апартаменты с одинаковыми данными
- **`project_facades`**: дропнут `project_facades_project_order_unique` `(project_id, order_index)` → создан `project_facades_sub_project_order_unique` `UNIQUE (sub_project_id, order_index) WHERE sub_project_id IS NOT NULL`
- **`apartments`**: дропнут `apartments_project_id_apartment_number_key` `(project_id, apartment_number)` → создан `apartments_sub_project_apartment_number_unique` `UNIQUE (sub_project_id, apartment_number) WHERE sub_project_id IS NOT NULL`
- Partial indexes исключают строки с `sub_project_id IS NULL` (таких не должно быть после backfill)

---

## 2. Edge Functions

### `project-selector/index.ts`

- Добавлена функция `resolveDefaultSubProjectId(supabase, projectId)` — резолвит `is_default = true` субпроект
- Все обработчики (`handleLoadInitial`, `handleLoadFacade`, `handleLoadFloorPolygons`, `handleLoadFloorPlan`, `handleLoadFloorsLight`) теперь:
  - Принимают `subProjectId` из запроса
  - Если `subProjectId` не передан — автоматически резолвят дефолтный
  - Фильтруют запросы по `sub_project_id`

### `project-editor/index.ts`

- **`uploadFloorPlan`**: обновлён для поддержки субпроектов
  - Интерфейс `UploadFloorPlanBody` получил поле `subProjectId?: string`
  - FormData-парсинг читает `subProjectId`
  - При поиске существующего плана: фильтрует по `sub_project_id` (если передан)
  - При вставке нового плана: включает `sub_project_id` в запись
  - **До исправления**: планировки сохранялись без `sub_project_id` → при перезагрузке не находились (загрузка фильтровала по `sub_project_id`, а запись была без него)

---

## 3. Фронтенд — `apps/main`

### 3.1 `ProjectEditor.tsx`

**Авто-создание дефолтного субпроекта при создании проекта:**

```ts
// handleSave → isNew
await supabase.from("sub_projects").insert({
  project_id: data.id,
  name: data.name,
  slug: "default",
  type: data.project_type === "object" ? "object" : "building",
  is_default: true,
  floors: data.floors ?? 1,
  has_parking: data.has_parking ?? false,
  // ...
});
```

**Синхронизация настроек в дефолтный субпроект при сохранении:**

```ts
// При has_masterplan=false: настройки проекта → дефолтный субпроект
await supabase.from("sub_projects")
  .update({ floors, has_parking, ... })
  .eq("project_id", project.id)
  .eq("is_default", true);
```

**Скрытие UI при активном генплане:**

- Поля `project_type`, `floors`, `has_parking`, `has_commercial`, `facade_open` скрыты при `has_masterplan=true`
- Вкладки `apartments`, `floorplan`, `photos`, `fields` скрыты при `has_masterplan=true` (через sidebar)
- Кнопка «Building Image» скрыта при `has_masterplan=true` — фасад управляется на уровне субпроекта

### 3.2 `SubProjectEditorPage.tsx` — полный редизайн

Страница переписана под стиль `ProjectEditor`:

| Элемент                 | Описание                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| **Sidebar**             | `SubProjectEditorSidebar` — иконки, коллапс, мобильный режим            |
| **Sticky header**       | Название субпроекта, кнопка «Назад», кнопка «Сохранить»                 |
| **Вкладка General**     | Название, тип, этажи, parking/commercial/facade_open — batch-сохранение |
| **Вкладка Facade**      | `BuildingImageEditor` с `subProjectId` — фасады индивидуальны           |
| **Вкладка Apartments**  | `ProjectApartmentsManager` по `subProjectId`                            |
| **Вкладка Floor Plans** | `ProjectFloorsManager` по `subProjectId`                                |
| **Вкладка Photos**      | `ApartmentPhotosManager` по `subProjectId`                              |
| **Вкладка Fields**      | `AllFieldsManager` по `subProjectId`                                    |

### 3.3 `sidebar-component.tsx`

- Добавлен импорт иконки `HouseSimple` (фасад)
- Добавлена функция `getSubProjectEditorNavItems(t, subProjectType)` — возвращает 6 табов (general, facade, apartments, floorplan, photos, fields), скрывает `floorplan` для object-типа
- Добавлен экспортируемый компонент `SubProjectEditorSidebar`
- **`SubProjectEditorSidebar`** передаёт `syncQueryParam={false}` в `SimplifiedSidebar` — это отключает `window.history.pushState` при переключении вкладок. Без этого кнопка «Назад» застревала внутри редактора подпроекта (возвращала к предыдущей вкладке того же URL), а не к родительскому проекту

### 3.4 `BuildingImageEditor` — поддержка субпроектов

Добавлены новые props:

| Prop             | Назначение                                                   |
| ---------------- | ------------------------------------------------------------ |
| `subProjectId`   | Фильтрация и создание фасадов/этажей по субпроекту           |
| `initialFloors`  | Количество этажей из субпроекта (заменяет `project.floors`)  |
| `subProjectType` | Тип субпроекта для корректного отображения (building/object) |

**Исправленные баги в `useBuildingDataLoader`:**

- **Кеш**: ключ изменён с `projectId` на `projectId:subProjectId` — разные субпроекты одного проекта не делят кеш
- **Этажи**: используется `initialFloors ?? project?.floors ?? 1` вместо только `project.floors`
- **Тип проекта**: `isObjectProject` определяется из `subProjectType` (если передан), иначе из `project.project_type`
- **Номера объектов** (object-тип): `fetchApartmentNumbers(pid, subProjectId)` — теперь передаёт `subProjectId`, чтобы в режиме object показывались только объекты текущего субпроекта, а не всего проекта

**Обновлённые API-функции в `buildingImageEditorApi.ts`:**

```ts
fetchFacades(projectId, subProjectId?)           // фильтрует по sub_project_id
insertFacade(..., subProjectId?)                 // включает sub_project_id
fetchApartmentNumbers(projectId, subProjectId?)  // фильтрует по sub_project_id (исправлено)
fetchFacadeDisplaySettings(projectId, subProjectId?)  // читает из sub_projects/projects
syncSubProjectBuildingImage(subProjectId, url)   // новая: синхр. building_image_url → sub_projects
updateSubProjectFloors(subProjectId, floors)     // новая: обновляет floors → sub_projects
upsertFloorPolygon({ ..., subProjectId? })       // включает sub_project_id
```

**Тексты для типа "object":** компонент `BuildingImageEditor.tsx` теперь использует `isObjectProject` для выбора правильных ключей перевода во всех текстовых блоках. Добавлены ключи `object.guided.*` во все 6 локалей:

- `object.description` — описание карточки
- `object.guided.toggle` — подпись переключателя подсказок
- `object.guided.progress.{floorRange, missingFloors, allConfigured}` — прогресс-панель
- `object.guided.helper.{savedAndNext, goNext}` — подсказка после сохранения полигона

### 3.5 `projectEditorApi.ts` — `uploadFloorPlan`

```ts
uploadFloorPlan(
  projectId,
  floorNumber,
  file,
  options: UploadWithProgressOptions & { subProjectId?: string }
)
```

- Если `subProjectId` передан — включается в FormData и уходит в edge function
- Edge function сохраняет `sub_project_id` в таблицу `floor_plans`
- **До исправления**: планировки этажей терялись при перезагрузке страницы в контексте субпроекта

### 3.6 `FloorPlanEditor.tsx`

- Загрузка (`loadFloorPlan`): фильтрует `floor_plans` по `sub_project_id` если задан
- Загрузка апартаментов (`loadApartments`): фильтрует по `sub_project_id`
- **Загрузка планировки** (`uploadFloorPlan`): теперь передаёт `subProjectId` в вызов API — исправлена потеря планировки после перезагрузки

### 3.7 Компоненты, получившие поддержку `subProjectId`

| Компонент / Хук                                     | Изменение                                                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `FloorPlanEditor.tsx`                               | Фильтрация `loadFloorPlan`, `loadApartments` по `sub_project_id`; insert включает `sub_project_id`; upload передаёт `subProjectId` |
| `ProjectFloorsManager.tsx`                          | Загрузка `floors` из `sub_projects`; передаёт `subProjectId` в дочерние компоненты                                                 |
| `PolygonCustomizationSettings.tsx`                  | Загрузка/сохранение настроек из `sub_projects` при наличии `subProjectId`                                                          |
| `ProjectApartmentsManager.tsx`                      | Insert апартаментов и `building_floors` включает `sub_project_id`                                                                  |
| `AllFieldsManager.tsx`                              | Передаёт `subProjectId` в `CustomFieldsManager`                                                                                    |
| `useCustomFieldsManager.ts`                         | Insert кастомных полей включает `sub_project_id`                                                                                   |
| `useFields.ts`                                      | Уже фильтровал по `sub_project_id` (без изменений)                                                                                 |
| `buildingImageEditorApi.ts` `fetchApartmentNumbers` | Фильтрует по `sub_project_id` — только объекты текущего субпроекта                                                                 |

---

## 4. UX-логика: до и после генплана

### До генплана (`has_masterplan = false`)

- Интерфейс идентичен старому: один проект, все поля и вкладки видны
- Субпроект существует в БД (дефолтный), но **невидим** пользователю
- При сохранении настройки синхронизируются в дефолтный субпроект

### После активации генплана (`has_masterplan = true`)

- В основном проекте скрываются: `project_type`, `floors`, parking, commercial, facade_open, фасад
- Скрываются вкладки: apartments, floorplan, photos, fields
- Остаются вкладки: general (базовая инфо), genplan, domains
- Каждый субпроект открывается через `SubProjectEditorPage` и управляет своими данными независимо

---

## 5. Маршруты

```
/projects/:projectSlug/subprojects/:subProjectSlug   → SubProjectEditorPage
/projects/:projectSlug/subprojects/:subProjectSlug/widget → SubProjectWidgetPage
```

Роут в `AdminRoutes.tsx`:

```
project/:projectSlug/sub/:subProjectSlug  → SubProjectEditorPage
```

---

## 6. Изоляция данных между субпроектами

Все доменные данные теперь изолированы по `sub_project_id`:

| Таблица                  | Уникальный constraint                        | Примечание                                                      |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------- |
| `project_facades`        | `(sub_project_id, order_index)` partial      | Заменил `(project_id, order_index)`                             |
| `apartments`             | `(sub_project_id, apartment_number)` partial | Заменил `(project_id, apartment_number)`                        |
| `floor_plans`            | нет unique constraint                        | Фильтрация по `(project_id, floor_number, sub_project_id)`      |
| `building_floors`        | `(project_id, facade_id, floor_number)`      | Изоляция через `facade_id` (каждый субпроект имеет свои фасады) |
| `project_field_settings` | `(sub_project_id, field_name)` partial       |                                                                 |
| `project_custom_fields`  | нет unique                                   | FK на `sub_project_id`                                          |

---

## 7. Что НЕ было изменено

- Основной виджет (`project-selector` edge fn) для старых проектов без генплана работает без изменений — через дефолтный субпроект
- `projectApi.ts` — авто-создание субпроекта при создании проекта через API
- Таблица `projects` сохраняет все старые поля для обратной совместимости
- RLS-политики не изменялись

---

## 8. Следующие шаги (не реализовано)

- [ ] Импорт данных из Excel напрямую в конкретный субпроект
- [ ] Публичная страница субпроекта с автономным виджетом
- [ ] Генплан-редактор: полигоны на изображении генплана → навигация к субпроекту
