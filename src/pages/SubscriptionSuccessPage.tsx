import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguageNavigation } from '../hooks/useLanguageNavigation';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const { getLocalizedPath } = useLanguageNavigation();
  
  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // Refresh subscription data to get the latest status
    const timer = setTimeout(() => {
      refreshSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshSubscription]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Card */}
        <Card className="text-center border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800 dark:text-green-200">
              Подписка успешно активирована!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300 text-lg">
              Добро пожаловать в {planName || 'Pro'} план
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {amount && (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <p className="text-sm text-muted-foreground">Сумма платежа</p>
                <p className="text-2xl font-bold">${amount}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Что дальше?
              </h3>
              <ul className="text-left space-y-2 text-sm text-green-700 dark:text-green-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Ваша подписка активна и готова к использованию</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Все функции плана теперь доступны</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Квитанция отправлена на ваш email</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to={getLocalizedPath('/admin')}>
              Перейти в панель управления
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild size="lg">
            <Link to={getLocalizedPath('/subscription')}>
              Управление подпиской
            </Link>
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Возникли вопросы? {' '}
            <a 
              href="mailto:support@floorplan-wizard.com" 
              className="text-primary hover:underline"
            >
              Свяжитесь с поддержкой
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
