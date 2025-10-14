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
import { Plus, X, RotateCcw, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  current_period_end: string;
  subscription_plans: {
    name: string;
    slug: string;
  };
  user_profiles: {
    email: string;
    full_name: string;
  };
}

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Array<{id: string, name: string, base_price: number}>>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states for creating subscription
  const [createForm, setCreateForm] = useState({
    userEmail: '',
    planId: '',
    durationMonths: 1,
  });
  
  // Form states for refund
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (name, slug),
          user_profiles (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data as unknown as Subscription[]) || []);
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

  const handleCancelSubscription = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/superadmin-user-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'cancel_subscription',
          subscription_id: subscriptionId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

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

  const handleCreateSubscription = async () => {
    if (!createForm.userEmail || !createForm.planId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/superadmin-user-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_subscription',
          user_email: createForm.userEmail,
          plan_id: createForm.planId,
          duration_months: createForm.durationMonths,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Успешно',
        description: 'Подписка создана',
      });

      setCreateForm({ userEmail: '', planId: '', durationMonths: 1 });
      setIsCreateDialogOpen(false);
      fetchSubscriptions();
    } catch (error) {
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

  const handleRefundSubscription = async () => {
    if (!selectedSubscription) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/superadmin-user-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'refund_subscription',
          subscription_id: selectedSubscription.id,
          refund_amount: refundForm.amount ? parseFloat(refundForm.amount) : undefined,
          reason: refundForm.reason || 'Admin refund',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Успешно',
        description: 'Возврат обработан',
      });

      setRefundForm({ amount: '', reason: '' });
      setIsRefundDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обработать возврат',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRefundDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsRefundDialogOpen(true);
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Управление подписками</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать подписку
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                        {plan.name} - {plan.base_price}₽
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Длительность (месяцев)</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  min="1" 
                  value={createForm.durationMonths}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 1 }))}
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

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>План</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Окончание</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.user_profiles?.full_name || '—'}</TableCell>
                <TableCell>{sub.user_profiles?.email}</TableCell>
                <TableCell>{sub.subscription_plans?.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : sub.status === 'trialing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sub.status}
                  </span>
                </TableCell>
                <TableCell>
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString('ru-RU')
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(sub.id)}
                      disabled={sub.status === 'cancelled' || sub.status === 'refunded' || isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Отменить
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openRefundDialog(sub)}
                      disabled={sub.status === 'refunded' || isProcessing}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Возврат
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Обработать возврат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubscription && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Пользователь:</strong> {selectedSubscription.user_profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedSubscription.user_profiles?.email}</p>
                <p><strong>План:</strong> {selectedSubscription.subscription_plans?.name}</p>
                <p><strong>Статус:</strong> {selectedSubscription.status}</p>
              </div>
            )}
            <div>
              <Label>Сумма возврата (₽)</Label>
              <Input 
                type="number" 
                placeholder="Оставьте пустым для полного возврата"
                value={refundForm.amount}
                onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Причина возврата</Label>
              <Textarea 
                placeholder="Укажите причину возврата"
                value={refundForm.reason}
                onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRefundDialogOpen(false);
                  setSelectedSubscription(null);
                  setRefundForm({ amount: '', reason: '' });
                }}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                onClick={handleRefundSubscription}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Обработать возврат
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
