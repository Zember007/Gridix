import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CreditCard, Search, Filter, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { PartnerPayout } from '../../types/partner';

interface PayoutWithPartner extends PartnerPayout {
  partner_profiles: {
    id: string;
    user_id: string;
    partner_code: string;
    user_profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export function PartnerPayoutsManagement() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PayoutWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithPartner | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'mark_paid' | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('partner_payouts')
        .select(`
          *,
          partner_profiles!partner_payouts_partner_id_fkey (
            id,
            user_id,
            partner_code,
            user_profiles!partner_profiles_user_id_fkey (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список выплат",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'reject' | 'mark_paid') => {
    try {
      setIsProcessing(true);

      let newStatus: string;
      switch (action) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'mark_paid':
          newStatus = 'paid';
          break;
        default:
          throw new Error('Invalid action');
      }

      const { error } = await supabase
        .from('partner_payouts')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', payoutId);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Успешно",
        description: `Выплата ${action === 'approve' ? 'одобрена' : action === 'reject' ? 'отклонена' : 'отмечена как выплаченная'}`,
      });

      // Обновляем список
      await fetchPayouts();
      setIsActionDialogOpen(false);
      setSelectedPayout(null);
      setNotes('');
    } catch (error) {
      console.error('Error updating payout:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить статус выплаты",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (payout: PayoutWithPartner, action: 'approve' | 'reject' | 'mark_paid') => {
    setSelectedPayout(payout);
    setAction(action);
    setIsActionDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает рассмотрения';
      case 'approved':
        return 'Одобрено';
      case 'paid':
        return 'Выплачено';
      case 'rejected':
        return 'Отклонено';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'paid':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.partner_profiles.user_profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.partner_profiles.user_profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.partner_profiles.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.partner_profiles.partner_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const totalPending = payouts.filter(p => p.status === 'pending').length;
  const totalPendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление выплатами</h2>
          <p className="text-muted-foreground">
            Рассматривайте и обрабатывайте запросы на выплату от партнёров
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают рассмотрения</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              ${totalPendingAmount.toFixed(2)} к выплате
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Одобрено</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter(p => p.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ожидают выплаты
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выплачено</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter(p => p.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Завершённых выплат
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отклонено</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter(p => p.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Отклонённых запросов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Поиск по партнёру..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'approved' | 'paid' | 'rejected') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидают рассмотрения</SelectItem>
                  <SelectItem value="approved">Одобрено</SelectItem>
                  <SelectItem value="paid">Выплачено</SelectItem>
                  <SelectItem value="rejected">Отклонено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица выплат */}
      <Card>
        <CardHeader>
          <CardTitle>Запросы на выплату</CardTitle>
          <CardDescription>
            {filteredPayouts.length} из {payouts.length} запросов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Партнёр</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Способ выплаты</TableHead>
                <TableHead>Дата запроса</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {payout.partner_profiles.user_profiles.first_name} {payout.partner_profiles.user_profiles.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.partner_profiles.user_profiles.email}
                      </p>
                      <Badge variant="outline" className="text-xs font-mono">
                        {payout.partner_profiles.partner_code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-lg">
                      ${payout.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(payout.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payout.status)}
                        {getStatusText(payout.status)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payout.payment_method || 'Не указан'}
                  </TableCell>
                  <TableCell>
                    {new Date(payout.requested_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payout.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openActionDialog(payout, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(payout, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      {payout.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(payout, 'mark_paid')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Отметить выплаченным
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог подтверждения действия */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Одобрить выплату' : 
               action === 'reject' ? 'Отклонить выплату' : 
               'Отметить как выплаченную'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' ? 'Вы уверены, что хотите одобрить эту выплату?' :
               action === 'reject' ? 'Вы уверены, что хотите отклонить эту выплату?' :
               'Вы уверены, что выплата была произведена?'}
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedPayout.partner_profiles.user_profiles.first_name} {selectedPayout.partner_profiles.user_profiles.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayout.partner_profiles.user_profiles.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Код: {selectedPayout.partner_profiles.partner_code}
                </p>
                <p className="font-bold text-lg">
                  Сумма: ${selectedPayout.amount.toFixed(2)}
                </p>
                {selectedPayout.payment_method && (
                  <p className="text-sm">
                    Способ: {selectedPayout.payment_method}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Примечание (необязательно)</Label>
                <Textarea
                  id="notes"
                  placeholder="Добавьте примечание к действию..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsActionDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button 
                  variant={action === 'reject' ? 'destructive' : 'default'}
                  onClick={() => selectedPayout && handlePayoutAction(selectedPayout.id, action!)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Обработка..." : 
                   action === 'approve' ? "Одобрить" : 
                   action === 'reject' ? "Отклонить" : 
                   "Отметить выплаченным"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
