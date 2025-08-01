# Projects Manager - Централизованное управление проектами

## Обзор

`useProjectsManager` - это централизованный хук для работы с проектами, который решает проблему дублирующихся запросов к Supabase и обеспечивает эффективное кеширование данных.

## Основные возможности

- ✅ **Кеширование данных** - данные кешируются на 5 минут
- ✅ **Предотвращение дублирования** - одинаковые запросы выполняются только один раз
- ✅ **Автоматическое обновление** - кеш очищается при изменениях
- ✅ **TypeScript поддержка** - полная типизация
- ✅ **Обработка ошибок** - централизованная обработка ошибок

## Использование

### 1. Основной хук для всех операций

```typescript
import { useProjectsManager } from '@/hooks/useProjectsManager';

const MyComponent = () => {
  const {
    projects,
    loading,
    error,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    clearProjectsCache
  } = useProjectsManager();

  // Загрузка проектов с фильтрами
  useEffect(() => {
    loadProjects({ isPublic: true, limit: 10 });
  }, []);

  // Загрузка одного проекта
  const handleLoadProject = async (id: string) => {
    const project = await loadProject(id);
    console.log(project);
  };

  return (
    <div>
      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error}</div>}
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};
```

### 2. Специализированные хуки

#### Загрузка списка проектов
```typescript
import { useProjects } from '@/hooks/useProjects';

const MyComponent = () => {
  const { projects, loading, error, refresh } = useProjects({
    isPublic: true,
    limit: 20
  });

  return (
    <div>
      <button onClick={refresh}>Обновить</button>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};
```

#### Загрузка одного проекта
```typescript
import { useProject } from '@/hooks/useProjects';

const ProjectDetails = ({ projectId }: { projectId: string }) => {
  const { project, loading, error, refresh } = useProject(projectId);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!project) return <div>Проект не найден</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <button onClick={refresh}>Обновить</button>
    </div>
  );
};
```

#### Проекты пользователя
```typescript
import { useUserProjects } from '@/hooks/useProjects';

const UserProjects = ({ userId }: { userId: string }) => {
  const { projects, loading } = useUserProjects(userId);
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};
```

#### Публичные проекты
```typescript
import { usePublicProjects } from '@/hooks/useProjects';

const PublicProjects = () => {
  const { projects, loading } = usePublicProjects(10); // лимит 10
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};
```

#### Избранные проекты
```typescript
import { useFeaturedProjects } from '@/hooks/useProjects';

const FeaturedProjects = () => {
  const { projects, loading } = useFeaturedProjects(5); // лимит 5
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};
```

### 3. CRUD операции

```typescript
import { useProjectCRUD } from '@/hooks/useProjects';

const ProjectEditor = () => {
  const { createProject, updateProject, deleteProject } = useProjectCRUD();

  const handleCreate = async () => {
    const newProject = await createProject({
      name: 'Новый проект',
      description: 'Описание проекта',
      address: 'Адрес проекта',
      floors: 10,
      is_public: true,
      is_featured: false,
      currency: 'RUB'
    });
    
    if (newProject) {
      console.log('Проект создан:', newProject.id);
    }
  };

  const handleUpdate = async (projectId: string) => {
    const success = await updateProject(projectId, {
      name: 'Обновленное название'
    });
    
    if (success) {
      console.log('Проект обновлен');
    }
  };

  const handleDelete = async (projectId: string) => {
    const success = await deleteProject(projectId);
    
    if (success) {
      console.log('Проект удален');
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Создать проект</button>
    </div>
  );
};
```

### 4. Управление кешем

```typescript
import { useProjectCache } from '@/hooks/useProjects';

const CacheManager = () => {
  const { clearProjectsCache, clearSingleProjectCache, getProjectById } = useProjectCache();

  const handleClearAllCache = () => {
    clearProjectsCache(); // очистить весь кеш проектов
  };

  const handleClearUserCache = () => {
    clearProjectsCache({ userId: 'user-id' }); // очистить кеш проектов пользователя
  };

  const handleClearProjectCache = (projectId: string) => {
    clearSingleProjectCache(projectId); // очистить кеш конкретного проекта
  };

  const handleGetCachedProject = (projectId: string) => {
    const project = getProjectById(projectId); // получить проект из кеша
    console.log(project);
  };

  return (
    <div>
      <button onClick={handleClearAllCache}>Очистить весь кеш</button>
      <button onClick={handleClearUserCache}>Очистить кеш пользователя</button>
    </div>
  );
};
```

## Фильтры

```typescript
interface ProjectFilters {
  userId?: string;        // Проекты конкретного пользователя
  isPublic?: boolean;     // Только публичные проекты
  isFeatured?: boolean;   // Только избранные проекты
  limit?: number;         // Лимит количества проектов
  offset?: number;        // Смещение для пагинации
}
```

## Миграция с прямых запросов

### Было (старый способ):
```typescript
// ❌ Прямой запрос к Supabase
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('is_public', true);
```

### Стало (новый способ):
```typescript
// ✅ Использование хука
const { projects, loading, error } = usePublicProjects();
```

## Преимущества

1. **Производительность**: Данные кешируются и не загружаются повторно
2. **Надежность**: Предотвращение дублирующихся запросов
3. **Удобство**: Простой API для всех операций с проектами
4. **Консистентность**: Централизованное управление состоянием
5. **TypeScript**: Полная типизация для безопасности

## Рекомендации

1. **Используйте специализированные хуки** для простых случаев
2. **Используйте основной хук** для сложной логики
3. **Очищайте кеш** при изменениях данных
4. **Обрабатывайте ошибки** через предоставленные состояния
5. **Используйте refresh** для принудительного обновления данных 