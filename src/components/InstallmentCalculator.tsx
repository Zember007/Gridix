import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calculator, CreditCard } from 'lucide-react';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstallmentCalculatorProps {
  apartmentPrice: number;
  currency: string | null;
  minDownPaymentPercent: number;
  maxInstallmentMonths: number;
  applyInstallment: () => void;
  onCalculate?: (calculation: InstallmentCalculation) => void;
  themeColor?: string;
}

export interface InstallmentCalculation {
  apartmentPrice: number;
  downPayment: number;
  downPaymentPercent: number;
  remainingAmount: number;
  monthlyPayment: number;
  installmentMonths: number;
}

const InstallmentCalculator: React.FC<InstallmentCalculatorProps> = ({
  apartmentPrice,
  currency,
  minDownPaymentPercent,
  maxInstallmentMonths,
  applyInstallment,
  onCalculate,
  themeColor = '#000000'
}) => {
  const { t } = useLanguage();

  const sliderStyle = {
    '--slider-thumb-color': themeColor,
    '--slider-range-color': themeColor,
  } as React.CSSProperties;
  
  // Состояние для выбранных значений
  const [downPaymentPercent, setDownPaymentPercent] = useState(minDownPaymentPercent);
  const [installmentMonths, setInstallmentMonths] = useState(Math.min(12, maxInstallmentMonths));

  // Расчетные значения
  const calculation = useMemo(() => {
    const downPayment = Math.round((apartmentPrice * downPaymentPercent) / 100);
    const remainingAmount = apartmentPrice - downPayment;
    const monthlyPayment = Math.round(remainingAmount / installmentMonths);

    return {
      apartmentPrice,
      downPayment,
      downPaymentPercent,
      remainingAmount,
      monthlyPayment,
      installmentMonths
    };
  }, [apartmentPrice, downPaymentPercent, installmentMonths]);

  const { downPayment, remainingAmount, monthlyPayment } = calculation;

  // Вызываем callback при изменении расчетов
  useEffect(() => {
    onCalculate?.(calculation);
  }, [calculation, onCalculate]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Стоимость квартиры */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-medium text-gray-700">{t('apartment.price')}</span>
          <span className="text-lg font-semibold">
            {formatPriceWithCurrency(apartmentPrice, currency)}
          </span>
        </div>

        {/* Первоначальный взнос */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">{t('installment.downPayment')}</Label>
            <div className="text-right">
              <div className="font-semibold">{formatPriceWithCurrency(downPayment, currency)}</div>
              <div className="text-sm text-gray-500">{downPaymentPercent}%</div>
            </div>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(value) => setDownPaymentPercent(value[0])}
            min={minDownPaymentPercent}
            max={100}
            step={5}
            className="w-full"
            style={sliderStyle}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('installment.minimum')}: {minDownPaymentPercent}%</span>
            <span>{t('installment.maximum')}: 100%</span>
          </div>
        </div>

        {/* Количество месяцев */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">{t('installment.period')}</Label>
            <div className="text-right">
              <div className="font-semibold">{installmentMonths} {t('installment.months')}</div>
            </div>
          </div>
          <Slider
            value={[installmentMonths]}
            onValueChange={(value) => setInstallmentMonths(value[0])}
            min={1}
            max={maxInstallmentMonths}
            step={1}
            className="w-full"
            style={sliderStyle}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 {t('installment.month')}</span>
            <span>{maxInstallmentMonths} {t('installment.months')}</span>
          </div>
        </div>

        {/* Результаты расчета */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{t('installment.remainingAmount')}</span>
            <span className="font-medium">{formatPriceWithCurrency(remainingAmount, currency)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-900">{t('installment.monthlyPayment')}</span>
            <span className="text-xl font-bold text-blue-900">
              {formatPriceWithCurrency(monthlyPayment, currency)}
            </span>
          </div>
        </div>

        {/* Кнопка для оформления рассрочки */}
        <Button 
          className="w-full gap-2 text-white hover:opacity-90" 
          size="lg"
          onClick={applyInstallment}
          style={{ backgroundColor: themeColor }}
        >
          <CreditCard className="h-4 w-4" />
          {t('installment.apply')}
        </Button>

        {/* Дополнительная информация */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• {t('installment.info.noInterest')}</p>
          <p>• {t('installment.info.earlyPayment')}</p>
          <p>• {t('installment.info.contactManager')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallmentCalculator;
