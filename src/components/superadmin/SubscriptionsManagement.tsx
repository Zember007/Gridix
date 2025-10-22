import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, X, Check, Loader2, Upload, ExternalLink, FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subscription {
  id: string;
  user_id: string;
  project_id: string;
  status: string;
  current_period_end: string;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_requested_at: string | null;
  final_price: number | null;
  subscription_plans: {
    name: string;
    slug: string;
  };
  user_profiles: {
    email: string;
    full_name: string;
  };
  projects: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  user_id: string;
}

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Array<{id: string, name: string, base_price: number}>>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states for creating subscription
  const [createForm, setCreateForm] = useState({
    userEmail: '',
    projectId: '',
    planId: '',
    durationMonths: 1,
    invoiceNumber: '',
    invoiceUrl: '',
  });
  
  // Form states for updating invoice
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceUrl: '',
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchProjects();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (name, slug),
          projects!user_subscriptions_project_id_fkey (name)
        `)
        .not('status', 'eq', 'migrated')
        .not('project_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Now fetch user profiles separately for each subscription
      const subscriptionsWithProfiles = await Promise.all(
        (data || []).map(async (sub: any) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, full_name')
            .eq('user_id', sub.user_id)
            .single();
          
          return {
            ...sub,
            user_profiles: profile || { email: 'Unknown', full_name: 'Unknown' }
          };
        })
      );

      setSubscriptions((subscriptionsWithProfiles as unknown as Subscription[]) || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить подписки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, user_id')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateSubscription = async () => {
    if (!createForm.userEmail || !createForm.projectId || !createForm.planId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', createForm.userEmail)
        .single();

      if (userError || !userData) {
        throw new Error('User not found with this email');
      }

      // Verify project belongs to user
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', createForm.projectId)
        .eq('user_id', userData.user_id)
        .single();

      if (projectError || !projectData) {
        throw new Error('Project not found or does not belong to this user');
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + createForm.durationMonths);

      // Create subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userData.user_id,
          project_id: createForm.projectId,
          plan_id: createForm.planId,
          status: 'active',
          duration_months: createForm.durationMonths,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          invoice_number: createForm.invoiceNumber || null,
          invoice_url: createForm.invoiceUrl || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Успешно',
        description: 'Подписка создана',
      });

      setCreateForm({ userEmail: '', projectId: '', planId: '', durationMonths: 1, invoiceNumber: '', invoiceUrl: '' });
      setIsCreateDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать подписку',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateInvoice = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { 
          action: 'generate-invoice',
          subscription_id: subscriptionId
        },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'PDF-счет сгенерирован и отправлен',
      });

      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сгенерировать счет',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateSubscription = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { 
          action: 'confirm-payment',
          subscription_id: subscriptionId
        },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Оплата подтверждена, подписка активирована',
      });

      setInvoiceForm({ invoiceNumber: '', invoiceUrl: '' });
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось активировать подписку',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Подписка отменена',
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отменить подписку',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trialing':
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'pending_payment':
        return <Badge className="bg-yellow-500">Pending Payment</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending_payment');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Управление подписками</h2>
          {pendingSubscriptions.length > 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              {pendingSubscriptions.length} запрос(ов) на счет ожидает обработки
            </p>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать подписку
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новую подписку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email пользователя *</Label>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  value={createForm.userEmail}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, userEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label>Проект *</Label>
                <Select 
                  value={createForm.projectId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>План *</Label>
                <Select 
                  value={createForm.planId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, planId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите план" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.base_price}/месяц
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Длительность (месяцев) *</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  min="1" 
                  value={createForm.durationMonths}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Номер счета</Label>
                <Input 
                  placeholder="INV-12345" 
                  value={createForm.invoiceNumber}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label>URL счета</Label>
                <Input 
                  placeholder="https://..." 
                  value={createForm.invoiceUrl}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, invoiceUrl: e.target.value }))}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateSubscription}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Создать подписку
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {pendingSubscriptions.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Запросы на счет
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>План</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Запрошено</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.user_profiles?.full_name || '—'}</div>
                      <div className="text-sm text-muted-foreground">{sub.user_profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{sub.projects?.name || '—'}</TableCell>
                  <TableCell>{sub.subscription_plans?.name}</TableCell>
                  <TableCell>${sub.final_price?.toFixed(2) || '—'}</TableCell>
                  <TableCell>
                    {sub.invoice_requested_at
                      ? new Date(sub.invoice_requested_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!sub.invoice_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInvoice(sub.id)}
                          disabled={isProcessing}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Сгенерировать PDF
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sub.invoice_url!, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Просмотр
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sub.invoice_url!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Скачать
                          </Button>
                        </>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={!sub.invoice_url || isProcessing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Подтвердить оплату
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Подтвердить оплату</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p><strong>Проект:</strong> {sub.projects?.name}</p>
                              <p><strong>Пользователь:</strong> {sub.user_profiles?.full_name}</p>
                              <p><strong>План:</strong> {sub.subscription_plans?.name}</p>
                              <p><strong>Сумма:</strong> {sub.final_price?.toFixed(2)} GEL</p>
                              {sub.invoice_number && (
                                <p><strong>Номер счета:</strong> {sub.invoice_number}</p>
                              )}
                            </div>
                            
                            {sub.invoice_url && (
                              <div className="p-4 border rounded-lg">
                                <p className="font-medium mb-2">Счет:</p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(sub.invoice_url!, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Просмотр PDF
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(sub.invoice_url!, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Скачать
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Убедитесь, что оплата поступила на счет, прежде чем подтверждать активацию подписки.
                              </AlertDescription>
                            </Alert>
                            
                            <Button 
                              onClick={() => handleActivateSubscription(sub.id)}
                              disabled={isProcessing}
                              className="w-full"
                            >
                              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Подтвердить оплату и активировать
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* All Subscriptions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Все подписки</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Проект</TableHead>
              <TableHead>План</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Окончание</TableHead>
              <TableHead>Счет</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{sub.user_profiles?.full_name || '—'}</div>
                    <div className="text-sm text-muted-foreground">{sub.user_profiles?.email}</div>
                  </div>
                </TableCell>
                <TableCell>{sub.projects?.name || '—'}</TableCell>
                <TableCell>{sub.subscription_plans?.name}</TableCell>
                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                <TableCell>
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>
                  {sub.invoice_number ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{sub.invoice_number}</span>
                      {sub.invoice_url && (
                        <a href={sub.invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {sub.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(sub.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Отменить
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
