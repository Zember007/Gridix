import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, CreditCard, Calendar, AlertCircle, CheckCircle, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const RefundPolicyPage = () => {
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Building2 className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
                  Gridix
                </h1>
                <p className="text-xs text-gray-500">FloorPlan Wizard</p>
              </div>
            </div>
            <div className={`flex ${isMobile ? 'justify-center' : ''} items-center gap-3`}>
              <LanguageToggle />
              <Button 
                onClick={goHome}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                size={isMobile ? 'sm' : 'default'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('legal.backHome')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Политика возврата средств
            </h1>
            <p className="text-xl text-gray-600">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Общие положения
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Компания Gridix стремится обеспечить высокое качество обслуживания и удовлетворенность клиентов. 
                  Настоящая Политика возврата средств описывает условия, при которых вы можете запросить возврат 
                  оплаченных средств за использование сервиса FloorPlan Wizard.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Важно:</strong> Пожалуйста, внимательно ознакомьтесь с условиями возврата перед оформлением подписки.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Информация о компании
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span><strong>Название:</strong> Gridix</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span><strong>Адрес:</strong> Грузия, Батуми, ул. Леселидзе 3</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span><strong>Email:</strong> inbox@gridix.live</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 14-Day Money Back Guarantee */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Гарантия возврата средств (14 дней)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Мы предлагаем <strong>14-дневную гарантию возврата средств</strong> для новых подписок:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Возврат доступен в течение 14 календарных дней с момента первого платежа</li>
                  <li>Применяется только к первой оплате подписки (не распространяется на продления)</li>
                  <li>Возврат осуществляется в полном объеме</li>
                  <li>Не требуется объяснение причин возврата</li>
                  <li>После возврата доступ к платным функциям будет прекращен</li>
                </ul>
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800">
                    <strong>Примечание:</strong> Для оформления возврата в течение 14 дней свяжитесь с нами по адресу inbox@gridix.live
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Refund Eligibility */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Условия получения возврата
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-green-600">✓ Возврат возможен в следующих случаях:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Первая подписка в течение 14 дней с момента оплаты</li>
                      <li>Технические проблемы, которые делают сервис непригодным для использования</li>
                      <li>Несоответствие заявленной функциональности при условии документального подтверждения</li>
                      <li>Двойное списание средств по техническим причинам</li>
                      <li>Отмена подписки по инициативе компании</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-red-600">✗ Возврат НЕ предоставляется в следующих случаях:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Прошло более 14 дней с момента первого платежа</li>
                      <li>Продление существующей подписки</li>
                      <li>Нарушение Пользовательского соглашения</li>
                      <li>Блокировка аккаунта за нарушение правил использования</li>
                      <li>Частичное использование оплаченного периода (кроме 14-дневной гарантии)</li>
                      <li>Изменение решения пользователя без объективных причин (после 14 дней)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Process */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Процесс возврата средств</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">Для оформления возврата средств выполните следующие шаги:</p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Отправьте запрос</h4>
                      <p>Напишите на inbox@gridix.live с темой "Запрос на возврат средств"</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Укажите информацию</h4>
                      <p>Предоставьте email аккаунта, дату платежа и причину возврата (по желанию)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Получите подтверждение</h4>
                      <p>Мы рассмотрим ваш запрос в течение 2-3 рабочих дней</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Получите возврат</h4>
                      <p>При одобрении возврат будет произведен в течение 5-10 рабочих дней на исходный способ оплаты</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Timeline */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Сроки возврата средств
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Время обработки запроса:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Рассмотрение запроса: 2-3 рабочих дня</li>
                      <li>Одобрение/отклонение: в течение 1 рабочего дня после рассмотрения</li>
                      <li>Уведомление клиента: в течение 24 часов</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Время поступления средств:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Кредитные/дебетовые карты: 5-10 рабочих дней</li>
                      <li>PayPal: 3-5 рабочих дней</li>
                      <li>Банковский перевод: 7-14 рабочих дней</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">
                      <strong>Обратите внимание:</strong> Фактические сроки зачисления средств могут зависеть от вашего банка или платежной системы.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partial Refunds */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Частичные возвраты</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  В некоторых случаях может быть предоставлен частичный возврат средств:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>При существенных технических проблемах, затронувших часть периода подписки</li>
                  <li>При изменении условий сервиса, существенно влияющих на функциональность</li>
                  <li>В случае прекращения работы определенных функций</li>
                </ul>
                <p className="mt-4">
                  Размер частичного возврата рассчитывается пропорционально неиспользованному периоду подписки 
                  или степени недоступности сервиса.
                </p>
              </CardContent>
            </Card>

            {/* Subscription Cancellation */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Отмена подписки без возврата</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Вы можете отменить автоматическое продление подписки в любое время:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Доступ к сервису сохраняется до конца оплаченного периода</li>
                  <li>Автоматическое списание средств прекращается</li>
                  <li>Возврат средств за оставшийся период не производится (кроме случаев, описанных выше)</li>
                  <li>Вы можете возобновить подписку в любое время</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Как отменить:</strong> Перейдите в раздел "Подписка" в вашем аккаунте и нажмите "Отменить подписку"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Special Cases */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                  Особые случаи
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Технические проблемы:</h4>
                    <p>
                      Если вы столкнулись с техническими проблемами, препятствующими использованию сервиса, 
                      пожалуйста, сначала свяжитесь с нашей службой поддержки. Мы постараемся решить проблему 
                      до рассмотрения вопроса о возврате средств.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Форс-мажор:</h4>
                    <p>
                      В случае форс-мажорных обстоятельств, делающих невозможным предоставление услуг, 
                      мы можем предложить пропорциональный возврат средств или продление подписки.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Изменение функциональности:</h4>
                    <p>
                      Если существенные изменения в функциональности сервиса не соответствуют вашим ожиданиям, 
                      мы рассмотрим возможность возврата средств в индивидуальном порядке.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dispute Resolution */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Разрешение споров</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Если вы не согласны с решением по вашему запросу на возврат средств:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Вы можете запросить повторное рассмотрение с предоставлением дополнительных доказательств</li>
                  <li>Мы стремимся найти справедливое решение для обеих сторон</li>
                  <li>При необходимости вопрос может быть передан на рассмотрение руководству</li>
                  <li>В крайнем случае споры рассматриваются в соответствии с применимым законодательством</li>
                </ul>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Изменения в политике возврата</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Компания Gridix оставляет за собой право изменять условия данной Политики возврата средств. 
                  Изменения вступают в силу с момента публикации на сайте.
                </p>
                <p>
                  Существенные изменения, ухудшающие условия для пользователей, не применяются к уже 
                  оформленным подпискам до их продления.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <p className="mb-4">
                  Для вопросов о возврате средств обращайтесь:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Email: inbox@gridix.live</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>Адрес: Грузия, Батуми, ул. Леселидзе 3</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Время ответа:</strong> Мы стремимся отвечать на все запросы о возврате в течение 2-3 рабочих дней.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RefundPolicyPage;

