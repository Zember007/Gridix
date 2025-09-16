import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, FileText, Users, AlertTriangle, CreditCard, Gavel, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const TermsOfServicePage = () => {
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
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('legal.terms.title')}
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
                  <FileText className="h-6 w-6 text-blue-600" />
                  Общие положения
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
                  компанией Gridix (далее — «Компания», «мы») и пользователями сервиса FloorPlan Wizard 
                  (далее — «Сервис», «Платформа»).
                </p>
                <p className="mb-4">
                  Используя наш Сервис, вы соглашаетесь с условиями данного Соглашения. 
                  Если вы не согласны с какими-либо условиями, пожалуйста, не используйте Сервис.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Важно:</strong> Внимательно ознакомьтесь со всеми условиями перед началом использования Сервиса.
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

            {/* Service Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Описание сервиса</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  FloorPlan Wizard — это облачная платформа для создания интерактивных планов недвижимости, 
                  предоставляющая следующие возможности:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Загрузка и редактирование планов зданий</li>
                  <li>Создание интерактивных карт квартир</li>
                  <li>Управление статусами и характеристиками квартир</li>
                  <li>Интеграция с внешними системами (Excel, CRM)</li>
                  <li>Создание встраиваемых виджетов для веб-сайтов</li>
                  <li>Аналитика и отчетность</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Users className="h-6 w-6 text-blue-600" />
                  Учетные записи пользователей
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Регистрация:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Для использования Сервиса необходимо создать учетную запись</li>
                      <li>Вы должны предоставить точную и актуальную информацию</li>
                      <li>Вы несете ответственность за конфиденциальность своего пароля</li>
                      <li>Одно лицо может иметь только одну учетную запись</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Требования к пользователям:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Возраст не менее 18 лет или согласие родителей/опекунов</li>
                      <li>Правоспособность для заключения договоров</li>
                      <li>Соблюдение применимого законодательства</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Obligations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Обязательства пользователей</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">Используя Сервис, вы обязуетесь:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Использовать Сервис только в законных целях</li>
                  <li>Не нарушать права третьих лиц</li>
                  <li>Не загружать вредоносный контент</li>
                  <li>Не пытаться получить несанкционированный доступ к системе</li>
                  <li>Не использовать Сервис для спама или мошенничества</li>
                  <li>Соблюдать авторские права на загружаемые материалы</li>
                  <li>Не перепродавать доступ к Сервису без разрешения</li>
                </ul>
              </CardContent>
            </Card>

            {/* Prohibited Uses */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Запрещенные виды использования
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <p className="text-red-800 font-semibold mb-2">Строго запрещается:</p>
                </div>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Использование Сервиса для незаконной деятельности</li>
                  <li>Нарушение интеллектуальных прав</li>
                  <li>Распространение вредоносного ПО</li>
                  <li>Попытки взлома или обхода систем безопасности</li>
                  <li>Создание фальшивых аккаунтов</li>
                  <li>Спам и навязчивая реклама</li>
                  <li>Сбор персональных данных других пользователей</li>
                  <li>Использование автоматизированных средств без разрешения</li>
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Интеллектуальная собственность</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Права Компании:</h4>
                    <p className="mb-2">
                      Все права на Сервис, включая программное обеспечение, дизайн, 
                      товарные знаки и контент, принадлежат Компании.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Права пользователей:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Вы сохраняете права на загружаемый вами контент</li>
                      <li>Вы предоставляете Компании лицензию на использование контента для работы Сервиса</li>
                      <li>Вы гарантируете, что имеете права на загружаемые материалы</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Условия оплаты
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Тарифы и оплата:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Сервис предоставляется на основе подписочной модели</li>
                      <li>Цены указаны на официальном сайте и могут изменяться</li>
                      <li>Оплата производится заранее за выбранный период</li>
                      <li>Доступны различные способы оплаты</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Возврат средств:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Возврат возможен в течение 14 дней с момента оплаты</li>
                      <li>При существенных нарушениях со стороны Компании</li>
                      <li>Неиспользованная часть подписки не возмещается при досрочном расторжении</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Приостановка услуг:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>При просрочке платежа более 7 дней</li>
                      <li>При нарушении условий Соглашения</li>
                      <li>По техническим причинам (с уведомлением)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liability */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Gavel className="h-6 w-6 text-blue-600" />
                  Ответственность и гарантии
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Ограничение ответственности:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Сервис предоставляется "как есть" без каких-либо гарантий</li>
                      <li>Компания не несет ответственности за косвенные убытки</li>
                      <li>Максимальная ответственность ограничена суммой, уплаченной за Сервис</li>
                      <li>Компания не гарантирует бесперебойную работу Сервиса</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Ответственность пользователя:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>За сохранность данных учетной записи</li>
                      <li>За законность загружаемого контента</li>
                      <li>За ущерб, причиненный нарушением Соглашения</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data and Privacy */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Обработка данных</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Обработка персональных данных регулируется нашей 
                  <button 
                    onClick={() => navigate('/privacy-policy')} 
                    className="text-blue-600 hover:underline mx-1"
                  >
                    Политикой конфиденциальности
                  </button>.
                </p>
                <p className="mb-4">Основные принципы:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Сбор только необходимых данных</li>
                  <li>Обеспечение безопасности данных</li>
                  <li>Соблюдение прав субъектов данных</li>
                  <li>Прозрачность обработки</li>
                </ul>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Прекращение действия соглашения</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Прекращение пользователем:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>В любое время путем удаления учетной записи</li>
                      <li>Данные могут быть удалены в течение 30 дней</li>
                      <li>Неиспользованная часть подписки не возмещается</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Прекращение Компанией:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>При нарушении условий Соглашения</li>
                      <li>При неоплате услуг</li>
                      <li>При прекращении деятельности Сервиса (с уведомлением за 30 дней)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Изменения в соглашении</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Компания оставляет за собой право изменять условия данного Соглашения. 
                  О существенных изменениях мы уведомим пользователей не менее чем за 30 дней:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>По электронной почте</li>
                  <li>Через уведомления в Сервисе</li>
                  <li>На официальном сайте</li>
                </ul>
                <p className="mt-4">
                  Продолжение использования Сервиса после вступления изменений в силу 
                  означает ваше согласие с новыми условиями.
                </p>
              </CardContent>
            </Card>

            {/* Applicable Law */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Применимое право и разрешение споров</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Применимое право:</h4>
                    <p>Настоящее Соглашение регулируется законодательством Грузии.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Разрешение споров:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Приоритет отдается досудебному урегулированию</li>
                      <li>Споры рассматриваются судами Грузии</li>
                      <li>Возможно использование медиации</li>
                    </ul>
                  </div>
                </div>
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
                  По всем вопросам, связанным с данным Соглашением, обращайтесь к нам:
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
                    <strong>Время ответа:</strong> Мы стремимся отвечать на все обращения в течение 24 часов в рабочие дни.
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

export default TermsOfServicePage;
