import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {AlertCircle, Calendar, Eye, Home, TrendingUp, Users,} from 'lucide-react';
import {useUserRole} from '@/hooks/useUserRole.ts';
import {useWorkspace} from '@/contexts/WorkspaceContext.tsx';
import {useAuth} from '@/contexts/AuthContext.tsx';
import {useWorkspaceProjects} from '@/entities/workspace/queries/useWorkspaceProjects.ts';
import Spinner from '@/shared/ui/Spinner.tsx';
import {KpiCard} from "@/components/admin/analytics/KpiCard.tsx";
import {useLanguage} from "@/contexts/LanguageContext";
import {supabase} from "@/shared/api/supabase.ts";

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

const EMPTY_ANALYTICS: AnalyticsData = {
  projectViews: [],
  leads: [],
  topProjects: [],
  topApartments: [],
  apartmentStats: { available: 0, sold: 0, reserved: 0, total: 0 },
  conversionRate: 0,
  totalViews: 0,
  totalLeads: 0,
};

function truncateLabel(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.substring(0, maxLen) + '...';
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { projects: workspaceProjects } = useWorkspaceProjects();

  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const {
    data: analyticsDataRaw,
    isLoading,
    error: queryError,
  } = useQuery<AnalyticsData>({
    queryKey: [
      'adminAnalytics',
      user?.id,
      isManagerMode,
      activeWorkspaceId,
      dateRange,
      selectedProject,
      dateFrom,
      dateTo,
    ],
    enabled: Boolean(user && userRole.type !== 'loading'),
    staleTime: 120_000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const startedAt = performance.now();

      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          dateRange,
          selectedProject,
          dateFrom,
          dateTo,
          isManagerMode,
          developerId: isManagerMode && activeWorkspaceId ? activeWorkspaceId : null,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const tookMs = Math.round(performance.now() - startedAt);
      if (import.meta.env.DEV) {
        console.log('[AdminAnalytics] loaded in', tookMs, 'ms');
      }

      const raw = (data ?? {}) as Record<string, unknown>;

      const projectViewsRaw = Array.isArray(raw.projectViews) ? raw.projectViews : [];
      const leadsRaw = Array.isArray(raw.leads) ? raw.leads : [];
      const topProjectsRaw = Array.isArray(raw.topProjects) ? raw.topProjects : [];
      const topApartmentsRaw = Array.isArray(raw.topApartments) ? raw.topApartments : [];
      const apartmentStatsRaw = (raw.apartmentStats ?? {}) as Record<string, unknown>;

      const viewsByIso = new Map<string, number>();
      projectViewsRaw.forEach((p) => {
        const row = p as Record<string, unknown>;
        const iso = typeof row.date === 'string' ? row.date : null;
        if (!iso) return;
        viewsByIso.set(iso, safeNumber(row.views));
      });

      const leadsByIso = new Map<string, number>();
      leadsRaw.forEach((p) => {
        const row = p as Record<string, unknown>;
        const iso = typeof row.date === 'string' ? row.date : null;
        if (!iso) return;
        leadsByIso.set(iso, safeNumber(row.leads));
      });

      const allIsoDates = Array.from(new Set([...viewsByIso.keys(), ...leadsByIso.keys()])).sort();

      return {
        projectViews: allIsoDates.map((iso) => ({
          date: format(new Date(iso), 'dd.MM', { locale: ru }),
          views: viewsByIso.get(iso) || 0,
        })),
        leads: allIsoDates.map((iso) => ({
          date: format(new Date(iso), 'dd.MM', { locale: ru }),
          leads: leadsByIso.get(iso) || 0,
        })),
        topProjects: topProjectsRaw.map((p) => {
          const row = p as Record<string, unknown>;
          const name = typeof row.name === 'string' ? row.name : 'Unknown';
          return {
            name: truncateLabel(name, 20),
            views: safeNumber(row.views),
            leads: safeNumber(row.leads),
          };
        }),
        topApartments: topApartmentsRaw.map((p) => {
          const row = p as Record<string, unknown>;
          const apt = typeof row.apartment_number === 'string' ? row.apartment_number : '';
          const projectName = typeof row.project_name === 'string' ? row.project_name : 'Unknown';
          return {
            apartment_number: apt,
            project_name: truncateLabel(projectName, 20),
            views: safeNumber(row.views),
          };
        }),
        apartmentStats: {
          available: safeNumber(apartmentStatsRaw.available),
          sold: safeNumber(apartmentStatsRaw.sold),
          reserved: safeNumber(apartmentStatsRaw.reserved),
          total: safeNumber(apartmentStatsRaw.total),
        },
        conversionRate: safeNumber(raw.conversionRate),
        totalViews: safeNumber(raw.totalViews),
        totalLeads: safeNumber(raw.totalLeads),
      };
    },
  });

  const analyticsData = analyticsDataRaw ?? EMPTY_ANALYTICS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <Spinner size="md" />
      </div>
    );
  }

  if (queryError) {
    const msg =
      queryError instanceof Error
        ? queryError.message
        : (t('admin.analytics.loading') || 'Error loading analytics');

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {msg}
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="relative">
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">

                  <Calendar className="h-4 w-4 text-black" />
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.analytics.dateTo')}
              </label>
              <div className="relative">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-black" />
                </span>
              </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <KpiCard value={analyticsData.totalViews}
                 title={t('admin.analytics.totalViews')}
                 icon={<Eye className="h-8 w-8"/>}/>
        <KpiCard value={analyticsData.totalLeads}
                 title={t('admin.analytics.totalLeads')}
                 icon={<Users className="h-8 w-8"/>}/>
        <KpiCard value={`${analyticsData.conversionRate.toFixed(2)}%`}
                 title={t('admin.analytics.conversionRate')}
                 icon={<TrendingUp className="h-8 w-8"/>}/>
        <KpiCard value={analyticsData.apartmentStats.total}
                 title={t('admin.analytics.totalApartments')}
                 icon={<Home className="h-8 w-8"/>}/>
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

