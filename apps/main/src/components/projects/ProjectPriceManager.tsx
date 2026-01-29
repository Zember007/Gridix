import { useState } from 'react';
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@gridix/ui";
import { DollarSign, Percent, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectPriceManagerProps {
  projectId: string;
}

export function ProjectPriceManager({ projectId }: ProjectPriceManagerProps) {
  const { t } = useLanguage();
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!value || isNaN(parseFloat(value))) {
      toast.error(t('projectEditor.priceUpdateInvalidValue') || 'Please enter a valid value');
      return;
    }

    const numValue = parseFloat(value);
    if (numValue < 0) {
      toast.error(t('projectEditor.priceUpdateNegativeValue') || 'Value must be positive');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-project-prices', {
        body: {
          projectId,
          operation,
          type,
          value: numValue
        }
      });

      if (error) throw error;

      toast.success(t('projectEditor.priceUpdateSuccess') || 'Prices updated successfully');
      setValue('');
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error(t('projectEditor.priceUpdateError') || 'Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-l-4 border-l-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('projectEditor.priceManagement') || 'Price Management'}
        </CardTitle>
        <CardDescription>
          {t('projectEditor.priceManagementDesc') || 'Mass update prices for all apartments in this project.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-3">
            <Label className="mb-2 block">{t('projectEditor.operation') || 'Operation'}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={operation === 'increase' ? 'default' : 'outline'}
                onClick={() => setOperation('increase')}
                className={`flex-1 ${operation === 'increase' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('projectEditor.increase') || 'Increase'}
              </Button>
              <Button
                type="button"
                variant={operation === 'decrease' ? 'default' : 'outline'}
                onClick={() => setOperation('decrease')}
                className={`flex-1 ${operation === 'decrease' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                {t('projectEditor.decrease') || 'Decrease'}
              </Button>
            </div>
          </div>

          <div className="md:col-span-3">
            <Label className="mb-2 block">{t('projectEditor.type') || 'Type'}</Label>
            <Select value={type} onValueChange={(v: 'percentage' | 'fixed') => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                    {t('projectEditor.percentage') || 'Percentage (%)'}
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    {t('projectEditor.fixedAmount') || 'Fixed Amount'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-4">
            <Label htmlFor="price-value" className="mb-2 block">
              {t('projectEditor.value') || 'Value'} 
              {type === 'percentage' ? ' (%)' : ''}
            </Label>
            <div className="relative">
              <Input
                id="price-value"
                type="number"
                min="0"
                step={type === 'percentage' ? '0.1' : '1'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percentage' ? '10' : '1000'}
                className="pl-9"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                {type === 'percentage' ? (
                  <Percent className="h-4 w-4" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Button 
              onClick={handleUpdate} 
              disabled={loading || !value}
              className="w-full"
            >
              {loading ? (t('projectEditor.updating') || 'Updating...') : (t('projectEditor.apply') || 'Apply')}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-md flex items-start gap-3 text-sm text-muted-foreground">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
          <p>
            {(() => {
              const warningKey = operation === 'increase' 
                ? 'projectEditor.increaseWarning' 
                : 'projectEditor.decreaseWarning';
              const warningText = t(warningKey) || '';
              const typeText = type === 'percentage' 
                ? (t('projectEditor.percentage') || '%') 
                : (t('projectEditor.fixedAmount') || 'units');
              const displayValue = value || '...';
              
              return warningText
                .replace('{value}', displayValue)
                .replace('{type}', typeText);
            })()}
            {' '}
            {t('projectEditor.irreversibleWarning') || 'This action affects all units immediately.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

