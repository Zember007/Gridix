import { useState } from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSubscription } from '@/entities/subscription/queries/useSubscription';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { InvoiceViewer } from './InvoiceViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InvoiceSubscriptionFlowProps {
  projectId: string;
  planId: string;
  durationMonths: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceSubscriptionFlow({ 
  projectId, 
  planId, 
  durationMonths, 
  onSuccess, 
  onCancel 
}: InvoiceSubscriptionFlowProps) {
  const { settings, isSettingsComplete, loading: settingsLoading } = useCompanySettings();
  const { requestInvoice, loading: subscriptionLoading } = useSubscription();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice' | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [invoiceRequested, setInvoiceRequested] = useState(false);

  const handlePaymentMethodSelect = (method: 'card' | 'invoice') => {
    setPaymentMethod(method);
  };

  const handleRequestInvoice = async () => {
    if (!isSettingsComplete()) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо заполнить реквизиты компании',
        variant: 'destructive',
      });
      return;
    }

    setIsRequesting(true);
    try {
      await requestInvoice(projectId, planId, durationMonths);
      setInvoiceRequested(true);
      toast({
        title: 'Запрос отправлен',
        description: 'Счет будет сгенерирован администратором',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось запросить счет',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = () => {
    if (invoiceRequested) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (isRequesting) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const getStatusText = () => {
    if (invoiceRequested) {
      return 'Запрос на счет отправлен';
    }
    if (isRequesting) {
      return 'Отправка запроса...';
    }
    return 'Готово к отправке запроса';
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      {!paymentMethod && (
        <PaymentMethodSelector
          onMethodSelect={handlePaymentMethodSelect}
          disabled={subscriptionLoading}
        />
      )}

      {/* Invoice Flow */}
      {paymentMethod === 'invoice' && (
        <div className="space-y-4">
          {/* Company Settings Check */}
          {!isSettingsComplete() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Для выставления счета необходимо заполнить реквизиты компании. 
                Перейдите в настройки и заполните все обязательные поля.
              </AlertDescription>
            </Alert>
          )}

          {/* Settings Complete - Ready to Request */}
          {isSettingsComplete() && !invoiceRequested && (
            <Card>
              <CardHeader>
                <CardTitle>Готово к выставлению счета</CardTitle>
                <CardDescription>
                  Все необходимые данные заполнены. Можете запросить счет на оплату.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Предварительный просмотр</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Плательщик:</strong> {settings?.company_name}</div>
                    <div><strong>Получатель:</strong> GRIDIX LLC</div>
                    <div><strong>Назначение:</strong> Оплата подписки на {durationMonths} месяца по проекту (аккаунт {settings?.company_name})</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleRequestInvoice}
                    disabled={isRequesting}
                    className="flex items-center gap-2"
                  >
                    {isRequesting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Запросить счет
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isRequesting}
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Requested */}
          {invoiceRequested && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon()}
                  {getStatusText()}
                </CardTitle>
                <CardDescription>
                  Администратор сгенерирует PDF-счет и отправит вам ссылку для скачивания
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Что дальше:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Администратор сгенерирует PDF-счет</li>
                        <li>Вы получите ссылку для скачивания</li>
                        <li>Оплатите счет через банковский перевод</li>
                        <li>Администратор подтвердит оплату и активирует подписку</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                  >
                    Закрыть
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Card Payment Flow */}
      {paymentMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>Оплата картой</CardTitle>
            <CardDescription>
              Оплата через защищенный платежный шлюз
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Функция оплаты картой будет реализована в следующих версиях.
                Пока доступна только оплата по счету для компаний из Грузии.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setPaymentMethod(null)}
              >
                Назад к выбору
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
