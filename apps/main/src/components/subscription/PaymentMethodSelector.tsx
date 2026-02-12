import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { RadioGroup, RadioGroupItem } from "@gridix/ui";
import { Alert, AlertDescription } from "@gridix/ui";
import { CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Spinner } from "@/shared/ui/Spinner";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: 'card' | 'invoice') => void;
  selectedMethod?: 'card' | 'invoice';
  disabled?: boolean;
}

export function PaymentMethodSelector({ 
  onMethodSelect, 
  selectedMethod, 
  disabled = false 
}: PaymentMethodSelectorProps) {
  const { settings, isSettingsComplete, loading } = useCompanySettings();
  const [showSettingsAlert, setShowSettingsAlert] = useState(false);

  const handleMethodChange = (method: 'card' | 'invoice') => {
    if (method === 'invoice' && !isSettingsComplete()) {
      setShowSettingsAlert(true);
      return;
    }
    setShowSettingsAlert(false);
    onMethodSelect(method);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Способ оплаты</CardTitle>
          <CardDescription>
            Выберите удобный способ оплаты подписки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod}
            onValueChange={handleMethodChange}
            disabled={disabled}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Банковская карта</div>
                    <div className="text-sm text-muted-foreground">
                      Оплата через защищенный платежный шлюз
                    </div>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="invoice" id="invoice" />
              <Label htmlFor="invoice" className="flex-1 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Выставить счет (Грузия)</div>
                    <div className="text-sm text-muted-foreground">
                      Получите PDF-счет для банковского перевода
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {selectedMethod === 'invoice' && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-4">
                {isSettingsComplete() ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {isSettingsComplete() ? 'Готово к выставлению счета' : 'Требуется заполнение реквизитов'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isSettingsComplete() 
                      ? 'Все необходимые данные компании заполнены. Счет будет сгенерирован автоматически.'
                      : 'Для выставления счета необходимо заполнить реквизиты компании в настройках.'
                    }
                  </div>
                  {!isSettingsComplete() && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        // Navigate to company settings
                        window.location.href = '/admin/settings';
                      }}
                    >
                      Заполнить реквизиты
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSettingsAlert && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Для выставления счета необходимо заполнить реквизиты компании. 
                Перейдите в настройки и заполните все обязательные поля.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedMethod === 'invoice' && isSettingsComplete() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Предварительный просмотр</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="space-y-2">
              <div><strong>Плательщик:</strong> {settings?.company_name}</div>
              <div><strong>Получатель:</strong> GRIDIX LLC</div>
              <div><strong>Назначение:</strong> Оплата подписки на [длительность] месяца по проекту "[название проекта]" (аккаунт {settings?.company_name})</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
