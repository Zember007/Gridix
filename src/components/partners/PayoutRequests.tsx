import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePartnerStats } from '../../hooks/usePartnerStats';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { PartnerPayout } from '../../types/partner';

export function PayoutRequests() {
  const { stats, loading: statsLoading } = usePartnerStats();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Получаем профиль партнёра
      const { data: partnerProfile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerProfile) return;

      // Получаем запросы на выплату
      const { data: payoutsData, error } = await supabase
        .from('partner_payouts')
        .select('*')
        .eq('partner_id', partnerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts:', error);
        return;
      }

      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive",
      });
      return;
    }

    if (amount > (stats?.available_for_withdrawal || 0)) {
      toast({
        title: "Ошибка",
        description: "Недостаточно средств для вывода",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error: functionError } = await supabase.functions.invoke('partner-program', {
        body: {
          action: 'payout_request',
          amount: amount,
          payment_method: paymentMethod,
          payment_details: paymentDetails ? JSON.parse(paymentDetails) : undefined
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Запрос создан",
        description: "Ваш запрос на выплату отправлен на рассмотрение",
      });

      // Сбрасываем форму
      setPayoutAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      setIsDialogOpen(false);
      
      // Обновляем список
      await fetchPayouts();
    } catch (error) {
      console.error('Error creating payout request:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать запрос на выплату",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  if (statsLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Запросы на выплату</h2>
          <p className="text-muted-foreground">
            Управляйте выводом заработанных средств
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!stats?.available_for_withdrawal || stats.available_for_withdrawal <= 0}>
              <CreditCard className="h-4 w-4 mr-2" />
              Запросить выплату
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Запрос на выплату</DialogTitle>
              <DialogDescription>
                Укажите сумму и способ получения выплаты
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма к выводу</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={stats?.available_for_withdrawal || 0}
                />
                <p className="text-sm text-muted-foreground">
                  Доступно: ${stats?.available_for_withdrawal?.toFixed(2) || '0'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Способ выплаты</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ выплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Банковский перевод</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Криптовалюта</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-details">Детали выплаты (JSON)</Label>
                <Textarea
                  id="payment-details"
                  placeholder='{"account": "1234567890", "bank": "Сбербанк"}'
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Укажите реквизиты для выплаты в формате JSON
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleCreatePayout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Создание..." : "Создать запрос"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Информация о балансе */}
      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertDescription>
          <strong>Доступно для вывода:</strong> ${stats?.available_for_withdrawal?.toFixed(2) || '0'} | 
          <strong>Всего заработано:</strong> ${stats?.total_earned?.toFixed(2) || '0'} | 
          <strong>Уже выведено:</strong> ${stats?.total_withdrawn?.toFixed(2) || '0'}
        </AlertDescription>
      </Alert>

      {/* Список запросов */}
      <div className="space-y-4">
        {payouts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет запросов на выплату</h3>
                <p className="text-muted-foreground mb-4">
                  Создайте первый запрос на выплату заработанных средств
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Создать запрос
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          payouts.map((payout) => (
            <Card key={payout.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Запрос на выплату</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payout.requested_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {payout.payment_method && (
                        <p className="text-sm text-muted-foreground">
                          Способ: {payout.payment_method}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(payout.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payout.status)}
                        {getStatusText(payout.status)}
                      </div>
                    </Badge>
                    
                    <div className="text-right">
                      <p className="font-bold">
                        ${payout.amount.toFixed(2)}
                      </p>
                      {payout.processed_at && (
                        <p className="text-sm text-muted-foreground">
                          Обработано: {new Date(payout.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {payout.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Примечание:</strong> {payout.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
