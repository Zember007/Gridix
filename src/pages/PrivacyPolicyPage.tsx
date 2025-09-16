import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, Shield, Eye, Database, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const PrivacyPolicyPage = () => {
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
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('legal.privacy.title')}
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
                  <Eye className="h-6 w-6 text-blue-600" />
                  Введение
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Компания Gridix (далее — «мы», «нас», «наша») серьезно относится к защите вашей конфиденциальности. 
                  Настоящая Политика конфиденциальности описывает, как мы собираем, используем, храним и защищаем 
                  вашу персональную информацию при использовании нашего сервиса FloorPlan Wizard.
                </p>
                <p>
                  Используя наш сервис, вы соглашаетесь с условиями данной Политики конфиденциальности.
                </p>
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

            {/* Data Collection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Database className="h-6 w-6 text-blue-600" />
                  Какие данные мы собираем
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Персональные данные:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Имя и фамилия</li>
                      <li>Адрес электронной почты</li>
                      <li>Номер телефона (при предоставлении)</li>
                      <li>Информация о компании (при регистрации)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Техническая информация:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>IP-адрес</li>
                      <li>Тип браузера и его версия</li>
                      <li>Операционная система</li>
                      <li>Файлы cookie и данные сессий</li>
                      <li>Логи использования сервиса</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Контент пользователей:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Загруженные планы зданий</li>
                      <li>Данные о квартирах и проектах</li>
                      <li>Настройки проектов</li>
                      <li>Фотографии и изображения</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                  Как мы используем ваши данные
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">Мы используем собранную информацию для следующих целей:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Предоставление и поддержка функциональности сервиса</li>
                  <li>Создание и управление вашим аккаунтом</li>
                  <li>Обработка ваших запросов и обращений в службу поддержки</li>
                  <li>Отправка важных уведомлений о сервисе</li>
                  <li>Улучшение качества нашего сервиса и пользовательского опыта</li>
                  <li>Обеспечение безопасности и предотвращение мошенничества</li>
                  <li>Соблюдение правовых обязательств</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Передача данных третьим лицам</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Мы не продаем, не сдаем в аренду и не передаем ваши персональные данные третьим лицам, 
                  за исключением следующих случаев:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>С вашего явного согласия</li>
                  <li>Для предоставления запрошенных вами услуг</li>
                  <li>При использовании доверенных сервис-провайдеров (хостинг, аналитика)</li>
                  <li>В случае требования закона или судебного решения</li>
                  <li>Для защиты наших прав и безопасности пользователей</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Shield className="h-6 w-6 text-blue-600" />
                  Безопасность данных
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Мы принимаем разумные технические и организационные меры для защиты ваших данных:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Шифрование данных при передаче (SSL/TLS)</li>
                  <li>Шифрование чувствительных данных при хранении</li>
                  <li>Ограниченный доступ к персональным данным</li>
                  <li>Регулярные проверки безопасности системы</li>
                  <li>Обучение сотрудников вопросам конфиденциальности</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Ваши права</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">У вас есть следующие права в отношении ваших персональных данных:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Право доступа:</strong> получение информации о том, какие данные мы обрабатываем</li>
                  <li><strong>Право на исправление:</strong> исправление неточных или неполных данных</li>
                  <li><strong>Право на удаление:</strong> удаление ваших персональных данных</li>
                  <li><strong>Право на ограничение:</strong> ограничение обработки в определенных случаях</li>
                  <li><strong>Право на портируемость:</strong> получение данных в структурированном формате</li>
                  <li><strong>Право на возражение:</strong> возражение против обработки данных</li>
                </ul>
                <p className="mt-4">
                  Для реализации ваших прав обращайтесь по адресу: inbox@gridix.live
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Использование файлов cookie</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Мы используем файлы cookie и аналогичные технологии для улучшения функциональности сервиса:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Необходимые cookie:</strong> для базовой функциональности сайта</li>
                  <li><strong>Функциональные cookie:</strong> для запоминания ваших настроек</li>
                  <li><strong>Аналитические cookie:</strong> для анализа использования сервиса</li>
                </ul>
                <p className="mt-4">
                  Вы можете управлять настройками cookie в вашем браузере.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Сроки хранения данных</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Мы храним ваши персональные данные только в течение необходимого периода:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Данные аккаунта: до удаления аккаунта или 3 года неактивности</li>
                  <li>Проектные данные: до удаления проекта пользователем</li>
                  <li>Логи системы: до 12 месяцев</li>
                  <li>Данные поддержки: до 3 лет после закрытия обращения</li>
                </ul>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Изменения в политике</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p>
                  Мы можем периодически обновлять данную Политику конфиденциальности. 
                  О существенных изменениях мы уведомим вас по электронной почте или 
                  через уведомления в сервисе. Дата последнего обновления указана в начале документа.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <p className="mb-4">
                  Если у вас есть вопросы о данной Политике конфиденциальности или обработке ваших данных, 
                  свяжитесь с нами:
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
