import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Eye,
  Users,
  Home,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/shared/api/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceProjects } from '@/entities/workspace/queries/useWorkspaceProjects';
import { getManagerProjectIds } from '@/hooks/useManagerProjectIds';
import { Loader } from '@/shared/ui/loader';
import { ADMIN_THEME } from '@/shared/lib/admin-theme-config';

interface AnalyticsData {
  projectViews: Array<{ date: string; views: number }>;
  leads: Array<{ date: string; leads: number }>;
  topProjects: Array<{ name: string; views: number; leads: number }>;
  topApartments: Array<{ apartment_number: string; project_name: string; views: number }>;
  apartmentStats: {
    available: number;
    sold: number;
    reserved: number;
    total: number;
  };
  conversionRate: number;
  totalViews: number;
  totalLeads: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { projects: workspaceProjects } = useWorkspaceProjects();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Получение доступных project_ids для фильтрации
  const getAvailableProjectIds = useCallback(async (): Promise<string[]> => {
    if (!user || userRole.type === 'loading') return [];

    try {
      if (isManagerMode && activeWorkspaceId) {
        // Для менеджера получаем доступные проекты через общую функцию
        const managerProjectIds = await getManagerProjectIds(user.id, activeWorkspaceId);
        return managerProjectIds;
      } else {
        // Собственный workspace
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);
        return projects?.map(p => p.id) || [];
      }
    } catch (err) {
      console.error('Error getting project IDs:', err);
      return [];
    }
  }, [user, userRole.type, isManagerMode, activeWorkspaceId]);

  // Загрузка данных аналитики
  const loadAnalytics = useCallback(async () => {
    if (!user || userRole.type === 'loading') return;

    setLoading(true);
    setError(null);

    try {
      const projectIds = await getAvailableProjectIds();
      if (projectIds.length === 0) {
        setAnalyticsData({
          projectViews: [],
          leads: [],
          topProjects: [],
          topApartments: [],
          apartmentStats: { available: 0, sold: 0, reserved: 0, total: 0 },
          conversionRate: 0,
          totalViews: 0,
          totalLeads: 0,
        });
        setLoading(false);
        return;
      }

      // Определяем диапазон дат
      let startDate: Date | null = null;
      let endDate: Date = endOfDay(new Date());

      if (dateFrom && dateTo) {
        startDate = startOfDay(new Date(dateFrom));
        endDate = endOfDay(new Date(dateTo));
      } else if (dateRange !== 'all') {
        startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      }

      // Фильтр по проекту
      const filteredProjectIds = selectedProject !== 'all'
        ? [selectedProject]
        : projectIds;

      // Подготовка базовых запросов
      const startDateISO = startDate?.toISOString();
      const endDateISO = endDate.toISOString();


      // Загрузка всех данных параллельно для ускорения
      const [
        { data: viewsData, error: viewsError },
        { data: leadsData, error: leadsError },
        { data: apartmentsData, error: apartmentsError },
      ] = await Promise.all([
        // Загрузка просмотров проектов с join к projects для получения названий
        (() => {
          let query = supabase
            .from('project_views')
            .select('project_id, created_at, projects!inner(id, name)')
            .in('project_id', filteredProjectIds);
          if (startDateISO) query = query.gte('created_at', startDateISO);
          return query.lte('created_at', endDateISO);
        })(),
        // Загрузка лидов (без join для скорости)
        (() => {
          let query = supabase
            .from('leads')
            .select('project_id, created_at')
            .in('project_id', filteredProjectIds);
          if (startDateISO) query = query.gte('created_at', startDateISO);
          return query.lte('created_at', endDateISO);
        })(),
        // Загрузка квартир (нужны для фильтрации apartment_views)
        supabase
          .from('apartments')
          .select('id, project_id, apartment_number, status')
          .in('project_id', filteredProjectIds),
      ]);

      if (viewsError) throw viewsError;
      if (leadsError) throw leadsError;
      if (apartmentsError) throw apartmentsError;

      // Получаем названия проектов для leads (так как leads не имеет join)
      const leadsProjectIds = new Set(
        (leadsData || []).map((l: { project_id: string }) => l.project_id)
      );
      const apartmentsProjectIds = new Set(
        (apartmentsData || []).map((a: { project_id: string }) => a.project_id)
      );
      const allProjectIds = Array.from(new Set([...leadsProjectIds, ...apartmentsProjectIds]));

      let projectsMap = new Map<string, string>();
      if (allProjectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', allProjectIds);

        projectsMap = new Map(
          (projectsData || []).map((p: { id: string; name: string }) => [p.id, p.name])
        );
      }

      // Загрузка просмотров квартир с join к apartments для получения данных квартир
      const apartmentIds = (apartmentsData || []).map((a: { id: string }) => a.id);

      let apartmentViewsData: Array<{
        apartment_id: string;
        created_at: string;
        apartments?: {
          apartment_number: string;
          project_id: string;
        };
      }> = [];
      if (apartmentIds.length > 0) {
        // apartment_views table not yet in generated types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let apartmentViewsQuery = (supabase as any).from('apartment_views')
          .select('apartment_id, created_at, apartments!inner(apartment_number, project_id)')
          .in('apartment_id', apartmentIds);

        if (startDateISO) {
          apartmentViewsQuery = apartmentViewsQuery.gte('created_at', startDateISO);
        }
        apartmentViewsQuery = apartmentViewsQuery.lte('created_at', endDateISO);

        const { data, error: apartmentViewsError } = await apartmentViewsQuery;
        if (apartmentViewsError) throw apartmentViewsError;
        apartmentViewsData = (data || []) as Array<{
          apartment_id: string;
          created_at: string;
          apartments?: {
            apartment_number: string;
            project_id: string;
          };
        }>;
      }

      // Обработка данных для графиков
      const viewsByDate = new Map<string, number>();
      const leadsByDate = new Map<string, number>();

      (viewsData || []).forEach((view: { created_at: string }) => {
        const date = format(new Date(view.created_at), 'yyyy-MM-dd');
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
      });

      (leadsData || []).forEach((lead: { created_at: string }) => {
        const date = format(new Date(lead.created_at), 'yyyy-MM-dd');
        leadsByDate.set(date, (leadsByDate.get(date) || 0) + 1);
      });

      // Формирование данных для графиков
      const allDates = new Set([
        ...Array.from(viewsByDate.keys()),
        ...Array.from(leadsByDate.keys()),
      ]);
      const sortedDates = Array.from(allDates).sort();

      const projectViewsChart = sortedDates.map(date => ({
        date: format(new Date(date), 'dd.MM', { locale: ru }),
        views: viewsByDate.get(date) || 0,
      }));

      const leadsChart = sortedDates.map(date => ({
        date: format(new Date(date), 'dd.MM', { locale: ru }),
        leads: leadsByDate.get(date) || 0,
      }));

      // Топ проектов по просмотрам
      const projectViewsCount = new Map<string, { views: number; leads: number; name: string }>();
      (viewsData || []).forEach((view: {
        project_id: string;
        projects?: { id?: string; name?: string }
      }) => {
        const projectId = view.project_id;
        const projectName = view.projects?.name || projectsMap.get(projectId) || 'Unknown';
        const current = projectViewsCount.get(projectId) || { views: 0, leads: 0, name: projectName };
        current.views += 1;
        projectViewsCount.set(projectId, current);
      });

      (leadsData || []).forEach((lead: { project_id: string }) => {
        const projectId = lead.project_id;
        const projectName = projectsMap.get(projectId) || 'Unknown';
        const current = projectViewsCount.get(projectId) || { views: 0, leads: 0, name: projectName };
        current.leads += 1;
        projectViewsCount.set(projectId, current);
      });

      const topProjects = Array.from(projectViewsCount.entries())
        .map(([, data]) => ({
          name: data.name.length > 20 ? data.name.substring(0, 20) + '...' : data.name,
          views: data.views,
          leads: data.leads,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Статистика квартир
      const apartmentStats = {
        available: (apartmentsData || []).filter((a: { status: string }) => a.status === 'available').length,
        sold: (apartmentsData || []).filter((a: { status: string }) => a.status === 'sold').length,
        reserved: (apartmentsData || []).filter((a: { status: string }) => a.status === 'reserved').length,
        total: (apartmentsData || []).length,
      };

      // Расчет конверсии
      const totalViews = (viewsData || []).length;
      const totalLeads = (leadsData || []).length;
      const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

      // Топ квартир по просмотрам
      const apartmentViewsCount = new Map<string, { views: number; apartment_number: string; project_name: string }>();
      apartmentViewsData.forEach((view) => {
        const apartmentId = view.apartment_id;
        const apartment = view.apartments;
        if (apartment) {
          const projectName = projectsMap.get(apartment.project_id) || 'Unknown';
          const current = apartmentViewsCount.get(apartmentId) || {
            views: 0,
            apartment_number: apartment.apartment_number,
            project_name: projectName,
          };
          current.views += 1;
          apartmentViewsCount.set(apartmentId, current);
        }
      });

      const topApartments = Array.from(apartmentViewsCount.entries())
        .map(([, data]) => ({
          apartment_number: data.apartment_number,
          project_name: data.project_name.length > 20 ? data.project_name.substring(0, 20) + '...' : data.project_name,
          views: data.views,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      setAnalyticsData({
        projectViews: projectViewsChart,
        leads: leadsChart,
        topProjects,
        topApartments,
        apartmentStats,
        conversionRate,
        totalViews,
        totalLeads,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : (t('admin.analytics.loading') || 'Error loading analytics'));
    } finally {
      setLoading(false);
    }
  }, [user, userRole.type, dateRange, selectedProject, dateFrom, dateTo, getAvailableProjectIds, t]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="md" color={ADMIN_THEME.primary} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const apartmentStatsChart = [
    { name: t('admin.analytics.apartments.available'), value: analyticsData.apartmentStats.available },
    { name: t('admin.analytics.apartments.sold'), value: analyticsData.apartmentStats.sold },
    { name: t('admin.analytics.apartments.reserved'), value: analyticsData.apartmentStats.reserved },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.analytics.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.analytics.period')}
              </label>
              <Select value={dateRange} onValueChange={(value: '7' | '30' | '90' | 'all') => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('admin.analytics.periods.7days')}</SelectItem>
                  <SelectItem value="30">{t('admin.analytics.periods.30days')}</SelectItem>
                  <SelectItem value="90">{t('admin.analytics.periods.90days')}</SelectItem>
                  <SelectItem value="all">{t('admin.analytics.periods.all')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.analytics.dateFrom')}
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.analytics.dateTo')}
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.analytics.project')}
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.analytics.allProjects')}</SelectItem>
                  {workspaceProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.totalViews')}
                </p>
                <p className="text-2xl font-bold">{analyticsData.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.totalLeads')}
                </p>
                <p className="text-2xl font-bold">{analyticsData.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.conversionRate')}
                </p>
                <p className="text-2xl font-bold">{analyticsData.conversionRate.toFixed(2)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.totalApartments')}
                </p>
                <p className="text-2xl font-bold">{analyticsData.apartmentStats.total}</p>
              </div>
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График просмотров */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.analytics.projectViews')}</CardTitle>
            <CardDescription>
              {t('admin.analytics.projectViewsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.projectViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* График лидов */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.analytics.leads')}</CardTitle>
            <CardDescription>
              {t('admin.analytics.leadsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.leads}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Топ проектов */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.analytics.topProjects')}</CardTitle>
          <CardDescription>
            {t('admin.analytics.topProjectsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analyticsData.topProjects}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100}  />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#0088FE" name={t('admin.analytics.views')} />
              <Bar dataKey="leads" fill="#00C49F" name={t('admin.analytics.leads')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Топ квартир по просмотрам */}
      {analyticsData.topApartments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.analytics.topApartments')}</CardTitle>
            <CardDescription>
              {t('admin.analytics.topApartmentsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.topApartments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="apartment_number"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  label={{ value: t('admin.analytics.apartment'), position: 'insideBottom', offset: -5 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [value, t('admin.analytics.views')]}
                  labelFormatter={(label) => `${t('admin.analytics.apartment')} №${label}`}
                />
                <Legend />
                <Bar dataKey="views" fill="#FF8042" name={t('admin.analytics.views')} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.analytics.apartment')}</TableHead>
                    <TableHead>{t('admin.analytics.project')}</TableHead>
                    <TableHead>{t('admin.analytics.views')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.topApartments.map((apartment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">№{apartment.apartment_number}</TableCell>
                      <TableCell >{apartment.project_name}</TableCell>
                      <TableCell>{apartment.views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика квартир */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.analytics.apartmentsStats')}</CardTitle>
            <CardDescription>
              {t('admin.analytics.apartmentsStatsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analyticsData.apartmentStats.available}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.apartments.available')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{analyticsData.apartmentStats.sold}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.apartments.sold')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{analyticsData.apartmentStats.reserved}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.analytics.apartments.reserved')}
                </p>
              </div>
            </div>
            {apartmentStatsChart.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={apartmentStatsChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {apartmentStatsChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Детальная таблица по проектам */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.analytics.projectsTable')}</CardTitle>
            <CardDescription>
              {t('admin.analytics.projectsTableDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.analytics.project')}</TableHead>
                  <TableHead>{t('admin.analytics.views')}</TableHead>
                  <TableHead>{t('admin.analytics.leads')}</TableHead>
                  <TableHead>{t('admin.analytics.conversion')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.topProjects.map((project, index) => {
                  const conversion = project.views > 0 ? (project.leads / project.views * 100).toFixed(2) : '0.00';
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.views}</TableCell>
                      <TableCell>{project.leads}</TableCell>
                      <TableCell>{conversion}%</TableCell>
                    </TableRow>
                  );
                })}
                {analyticsData.topProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('admin.analytics.noData')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

