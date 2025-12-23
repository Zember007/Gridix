import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useFailedLeads } from '@/entities/lead/queries/useLeads';
import { useAllFailedLeadsStats } from '@/hooks/useAllFailedLeadsStats';

interface LeadsNotificationProps {
  projectId?: string;
  onViewLeads?: () => void;
  className?: string;
}

export function LeadsNotification({ projectId, onViewLeads, className }: LeadsNotificationProps) {
  const { leads: failedLeads, loading } = useFailedLeads(projectId);

  if (loading || failedLeads.length === 0) {
    return null;
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                Пропущенные лиды
              </p>
              <p className="text-sm text-red-700">
                {failedLeads.length} {failedLeads.length === 1 ? 'лид не был отправлен' : 'лидов не были отправлены'} в CRM
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive">
              {failedLeads.length}
            </Badge>
            {onViewLeads && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewLeads}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                Просмотреть
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент для показа краткой статистики лидов
// Использует общий хук, который загружает статистику по всем проектам разом
export function LeadsStats({ projectId }: { projectId?: string }) {
  const { getStatsForProject, loading } = useAllFailedLeadsStats();
  
  if (loading || !projectId) {
    return null;
  }

  const counts = getStatsForProject(projectId);

  return (
    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
      <div className="flex items-center space-x-1">
        <span>Лидов:</span>
        <Badge variant="outline">{counts.total}</Badge>
      </div>
      {counts.failed > 0 && (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Ошибок:</span>
          <Badge variant="destructive" className="text-xs">
            {counts.failed}
          </Badge>
        </div>
      )}
      {/* {counts.pending > 0 && (
        <div className="flex items-center space-x-1">
          <span className="text-yellow-600">Ожидают:</span>
          <Badge variant="outline" className="text-xs text-yellow-600">
            {counts.pending}
          </Badge>
        </div>
      )} */}
    </div>
  );
}
