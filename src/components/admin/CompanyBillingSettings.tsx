import { useState, useEffect } from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CompanyBillingSettings() {
  const { settings, loading, error, saveSettings, isSettingsComplete } = useCompanySettings();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    bank_name: '',
    iban: '',
    currency: 'GEL',
    vat_payer: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        tax_id: settings.tax_id || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        bank_name: settings.bank_name || '',
        iban: settings.iban || '',
        currency: settings.currency || 'GEL',
        vat_payer: settings.vat_payer || false,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveSettings(formData);
      toast({
        title: 'Настройки сохранены',
        description: 'Информация о компании успешно обновлена',
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isComplete = isSettingsComplete();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Реквизиты компании
          </CardTitle>
          <CardDescription>
            Заполните данные вашей компании для выставления счетов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Все необходимые данные заполнены. Вы можете запрашивать счета на оплату.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Название компании *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Например: S2 Capital"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Идентификационный код *</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                placeholder="საიდენტიფიკაციო კოდი"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Юридический адрес *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Полный юридический адрес регистрации"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+995 32 123 45 67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="company@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Банк *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                placeholder="Например: TBC Bank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                placeholder="GE29NB0000000101904917"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Валюта</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="vat_payer"
                  checked={formData.vat_payer}
                  onCheckedChange={(checked) => handleInputChange('vat_payer', checked)}
                />
                <Label htmlFor="vat_payer">НДС-плательщик</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить настройки
            </Button>
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Готово к выставлению счетов</CardTitle>
            <CardDescription>
              Все необходимые данные заполнены. Теперь вы можете запрашивать счета на оплату подписки.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
