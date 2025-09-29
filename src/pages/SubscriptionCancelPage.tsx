import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguageNavigation } from '../hooks/useLanguageNavigation';

export default function SubscriptionCancelPage() {
  const { getLocalizedPath } = useLanguageNavigation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Cancel Card */}
        <Card className="text-center border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-800 dark:text-yellow-200">
              Оплата отменена
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300 text-lg">
              Ничего страшного! Ваш аккаунт остается активным
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Что произошло?
              </h3>
              <ul className="text-left space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• Процесс оплаты был прерван</li>
                <li>• Средства с карты не списаны</li>
                <li>• Ваш текущий план остается без изменений</li>
              </ul>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">
                Если у вас есть пробный период
              </p>
              <p className="text-sm">
                Вы можете продолжить пользоваться всеми функциями до окончания пробного периода
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to={getLocalizedPath('/subscription')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Попробовать снова
            </Link>
          </Button>
          
          <Button variant="outline" asChild size="lg">
            <Link to={getLocalizedPath('/admin')}>
              Перейти в панель управления
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Нужна помощь?</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Проблемы с оплатой?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Проверьте данные карты, лимиты и свяжитесь с банком при необходимости
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Вопросы по планам?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Изучите сравнение планов или свяжитесь с поддержкой для консультации
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Остались вопросы? {' '}
            <a 
              href="mailto:support@floorplan-wizard.com" 
              className="text-primary hover:underline"
            >
              Напишите в поддержку
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
