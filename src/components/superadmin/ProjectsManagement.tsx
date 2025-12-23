import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/shared/ui/badge';

interface Project {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  user_profiles: {
    email: string;
    full_name: string;
  };
}

export function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить проекты',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_public: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Проект ${!currentStatus ? 'опубликован' : 'скрыт'}`,
      });

      fetchProjects();
    } catch (error) {
      console.error('Error toggling project visibility:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить видимость проекта',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_featured: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Проект ${!currentStatus ? 'добавлен в избранное' : 'удален из избранного'}`,
      });

      fetchProjects();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус проекта',
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Проект удален',
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить проект',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Управление проектами</h2>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Владелец</TableHead>
              <TableHead>Просмотры</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <div>
                    <div>{project.user_profiles?.full_name || '—'}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.user_profiles?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                    {project.view_count}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {project.is_public && (
                      <Badge variant="outline">Публичный</Badge>
                    )}
                    {project.is_featured && (
                      <Badge variant="secondary">Избранный</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(project.created_at).toLocaleDateString('en-US')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublic(project.id, project.is_public)}
                    >
                      {project.is_public ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Скрыть
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Публ.
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatured(project.id, project.is_featured)}
                    >
                      Избр.
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
