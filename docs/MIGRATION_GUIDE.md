# Руководство по миграции на Projects Manager

## Зачем мигрировать?

- ✅ **Устранение дублирующихся запросов** к Supabase
- ✅ **Улучшение производительности** через кеширование
- ✅ **Централизованное управление** состоянием проектов
- ✅ **Упрощение кода** компонентов

## Пошаговая миграция

### Шаг 1: Замена импортов

**Было:**
```typescript
import { supabase } from '@/integrations/supabase/client';
```

**Стало:**
```typescript
import { useProjects, useProject, useUserProjects } from '@/hooks/useProjects';
// или для CRUD операций:
import { useProjectCRUD } from '@/hooks/useProjects';
```

### Шаг 2: Замена загрузки списка проектов

**Было:**
```typescript
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    setProjects(data || []);
    setLoading(false);
  };
  
  loadProjects();
}, [user]);
```

**Стало:**
```typescript
const { projects, loading, error, refresh } = useUserProjects(user?.id);
```

### Шаг 3: Замена загрузки одного проекта

**Было:**
```typescript
const [project, setProject] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    setProject(data);
    setLoading(false);
  };
  
  loadProject();
}, [projectId]);
```

**Стало:**
```typescript
const { project, loading, error, refresh } = useProject(projectId);
```

### Шаг 4: Замена CRUD операций

**Было:**
```typescript
const createProject = async (projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

const updateProject = async (projectId, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

const deleteProject = async (projectId) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
};
```

**Стало:**
```typescript
const { createProject, updateProject, deleteProject } = useProjectCRUD();

// Использование:
const newProject = await createProject(projectData);
const success = await updateProject(projectId, updates);
const success = await deleteProject(projectId);
```

## Примеры миграции компонентов

### ProjectsGallery.tsx

**Было:**
```typescript
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadProjects();
}, []);

const loadProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_public', true);
  
  if (error) throw error;
  setProjects(data || []);
  setLoading(false);
};
```

**Стало:**
```typescript
const { projects, loading, error } = usePublicProjects();
```

### ProjectList.tsx

**Было:**
```typescript
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (user) {
    loadProjects();
  }
}, [user]);

const loadProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id);
  
  if (error) throw error;
  setProjects(data || []);
  setLoading(false);
};
```

**Стало:**
```typescript
const { projects, loading, error, refresh } = useUserProjects(user?.id);
```

## Преимущества после миграции

### 1. Меньше кода
- Убирается дублирование логики загрузки
- Нет необходимости в локальном состоянии для loading/error
- Автоматическое управление кешем

### 2. Лучшая производительность
- Данные кешируются на 5 минут
- Дублирующиеся запросы предотвращаются
- Автоматическое обновление при изменениях

### 3. Лучшая надежность
- Централизованная обработка ошибок
- Автоматические retry механизмы
- Предотвращение race conditions

### 4. TypeScript поддержка
- Полная типизация всех операций
- Автодополнение в IDE
- Проверка типов на этапе компиляции

## Проверка миграции

После миграции проверьте:

1. ✅ Компонент загружает данные без ошибок
2. ✅ Состояние loading работает корректно
3. ✅ Ошибки обрабатываются и отображаются
4. ✅ CRUD операции работают как ожидается
5. ✅ Кеширование работает (данные не перезагружаются при переключении между компонентами)

## Обратная совместимость

Старые компоненты продолжат работать, но рекомендуется постепенно мигрировать их для получения всех преимуществ нового подхода.

## Поддержка

При возникновении проблем с миграцией:

1. Проверьте документацию в `docs/PROJECTS_MANAGER.md`
2. Посмотрите примеры в обновленных компонентах
3. Убедитесь, что все импорты корректны
4. Проверьте, что хуки используются в правильном контексте (внутри React компонентов) 