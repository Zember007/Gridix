import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePartnerStats } from '@/entities/partner/queries/usePartnerStats';
import { toast } from '@/shared/ui/sonner';
import { supabase } from '@/shared/api/supabase';
import { PartnerPayout } from '@/entities/partner/model/types';
import { useLanguage } from '@/contexts/LanguageContext';

export function PayoutRequests() {
  const { stats, loading: statsLoading } = usePartnerStats();
  const { t } = useLanguage();
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [contactInfo, setContactInfo] = useState('');
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

      setPayouts((payoutsData || []) as PartnerPayout[]);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount <= 0) {
      toast.error(t('partners.invalidAmount'));
      return;
    }


    if (amount > (stats?.available_for_withdrawal || 0)) {
      toast.error(t('partners.insufficientFunds'));
      return;
    }


    try {
      setIsSubmitting(true);

      const { data, error: functionError } = await supabase.functions.invoke('partner-program', {
        body: {
          action: 'payout_request',
          amount: amount,
          payment_method: paymentMethod,
          contact_info: contactInfo
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(t('partners.requestCreated'));

      // Сбрасываем форму
      setPayoutAmount('');
      setPaymentMethod('');
      setContactInfo('');
      setIsDialogOpen(false);
      
      // Обновляем список
      await fetchPayouts();
    } catch (error) {
      console.error('Error creating payout request:', error);
      toast.error(error instanceof Error ? error.message : t('partners.requestFailed'));
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
        return t('partners.status.pending');
      case 'approved':
        return t('partners.status.approved');
      case 'paid':
        return t('partners.status.paid');
      case 'rejected':
        return t('partners.status.rejected');
      default:
        return t('partners.status.unknown');
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
          <h2 className="text-2xl font-bold">{t('partners.payoutRequests')}</h2>
          <p className="text-muted-foreground">
            {t('partners.managePayouts')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!stats?.available_for_withdrawal || stats.available_for_withdrawal <= 0}>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('partners.requestPayout')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('partners.payoutRequest')}</DialogTitle>
              <DialogDescription>
                {t('partners.payoutRequestDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('partners.amountToWithdraw')}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={t('partners.amountPlaceholder')}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={stats?.available_for_withdrawal || 0}
                />
                <p className="text-sm text-muted-foreground">
                  {t('partners.available')}: ${stats?.available_for_withdrawal?.toFixed(2) || '0'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">{t('partners.paymentMethod')}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('partners.selectPaymentMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">{t('partners.bankTransfer')}</SelectItem>
                    <SelectItem value="paypal">{t('partners.paypal')}</SelectItem>
                    <SelectItem value="crypto">{t('partners.crypto')}</SelectItem>
                    <SelectItem value="other">{t('partners.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-info">{t('partners.contactInfo')}</Label>
                <Input
                  id="contact-info"
                  type="text"
                  placeholder={t('partners.contactInfoPlaceholder')}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {t('partners.contactInfoDesc')}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('partners.cancel')}
                </Button>
                <Button 
                  onClick={handleCreatePayout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('partners.creating') : t('partners.createRequest')}
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
          <strong>{t('partners.availableForWithdrawal')}:</strong> ${stats?.available_for_withdrawal?.toFixed(2) || '0'} | {' '}
          <strong>{t('partners.totalEarned')}:</strong> ${stats?.total_earned?.toFixed(2) || '0'} | {' '}
          <strong>{t('partners.totalWithdrawn')}:</strong> ${stats?.total_withdrawn?.toFixed(2) || '0'}
        </AlertDescription>
      </Alert>

      {/* Список запросов */}
      <div className="space-y-4">
        {payouts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('partners.noPayoutRequests')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('partners.createFirstRequest')}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('partners.createRequest')}
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
                      <p className="font-medium">{t('partners.payoutRequestTitle')}</p>
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
                          {t('partners.paymentMethod')}: {payout.payment_method}
                        </p>
                      )}
                      {payout.contact_info && (
                        <p className="text-sm text-muted-foreground">
                          {t('partners.contactInfo')}: {payout.contact_info}
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
                          {t('partners.processedAt')}: {new Date(payout.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {payout.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>{t('partners.notes')}:</strong> {payout.notes}
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
