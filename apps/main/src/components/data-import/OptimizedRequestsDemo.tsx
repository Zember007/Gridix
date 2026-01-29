import React from 'react';
import { useProjectsWithPrices } from '@/entities/project/queries/useProjectsWithPrices';
import { useProjectCache } from '@/entities/project/queries/useProjectCache';
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { Badge } from "@gridix/ui";

interface OptimizedRequestsDemoProps {
  userId: string;
}

/**
 * Демонстрационный компонент для показа оптимизированных запросов
 * Этот компонент показывает, как несколько компонентов могут использовать одни и те же данные
 * без дублирования запросов
 */
const OptimizedRequestsDemo = ({ userId }: OptimizedRequestsDemoProps) => {
  // Этот хук делает объединенный запрос: проверка пользователя + проекты с ценами
  const { projects, loading, userExists, error } = useProjectsWithPrices(userId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Статус оптимизированных запросов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Пользователь:</span>
              <Badge variant={userExists ? "default" : "destructive"}>
                {userExists === null ? "Проверяется..." : userExists ? "Найден" : "Не найден"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Проекты:</span>
              <Badge variant={projects.length > 0 ? "default" : "secondary"}>
                {loading ? "Загружаются..." : `${projects.length} проектов`}
              </Badge>
            </div>

            {error && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Ошибка:</span>
                <Badge variant="destructive">{error}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Демонстрируем множественное использование - эти компоненты будут переиспользовать кешированные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectCacheDemo projectId={projects[0]?.id} />
        <ProjectCacheDemo projectId={projects[1]?.id} />
        <ProjectCacheDemo projectId={projects[2]?.id} />
      </div>
    </div>
  );
};

/**
 * Компонент для демонстрации кеширования данных проекта
 */
const ProjectCacheDemo = ({ projectId }: { projectId?: string }) => {
  // Этот хук использует кеш - если данные уже загружены, запрос не будет повторяться
  const { project, loading, getCurrency } = useProjectCache(projectId);

  if (!projectId) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500 text-sm">Проект не выбран</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="font-medium text-sm">
            {loading ? "Загрузка..." : project?.name || "Проект не найден"}
          </div>
          <div className="text-xs text-gray-500">
            Валюта: {getCurrency() || "Не указана"}
          </div>
          <div className="text-xs text-gray-500">
            ID: {projectId.slice(0, 8)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizedRequestsDemo;