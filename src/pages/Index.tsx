
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Testimonials } from '@/components/ui/testimonials';
import { Building2, Users, Settings, BarChart3, Upload, Eye, Star, CheckCircle, ArrowRight, Zap, Shield, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

const Index = () => {
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [currentFeature, setCurrentFeature] = useState(0);

  const goToAdmin = () => {
    navigate('/admin');
  };

  const goToPrivacyPolicy = () => {
    navigate('/privacy-policy');
  };

  const goToTermsOfService = () => {
    navigate('/terms-of-service');
  };

  // Автоматическое переключение слайдов для интерактивности
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Upload, key: 'planUpload' },
    { icon: Settings, key: 'interactiveEditing' },
    { icon: BarChart3, key: 'excelIntegration' },
    { icon: Eye, key: 'embeddableWidget' },
    { icon: Users, key: 'statusManagement' },
    { icon: Building2, key: 'multiProject' }
  ];

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
                onClick={goToAdmin}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                size={isMobile ? 'sm' : 'default'}
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('nav.admin')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} relative overflow-hidden`}>
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-500 rounded-full animate-ping"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              Инновационное решение для недвижимости
            </span>
          </div>
          
          <h2 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-bold mb-6`}>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('landing.title')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {t('landing.subtitle')}
            </span>
          </h2>
          
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-gray-700 mb-10 max-w-4xl mx-auto leading-relaxed`}>
            {t('landing.description')}
          </p>
          
          {/* Stats */}
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-6 mb-10 max-w-2xl mx-auto`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter end={1000} suffix="+" />
              </div>
              <div className="text-sm text-gray-600">Проектов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-sm text-gray-600">Компаний</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter end={99.9} suffix="%" />
              </div>
              <div className="text-sm text-gray-600">Время работы</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-gray-600">Поддержка</div>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'gap-6'} justify-center ${isMobile ? 'px-4' : ''}`}>
            <Button 
              size={isMobile ? 'lg' : 'lg'} 
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${isMobile ? 'text-lg px-8 py-4' : 'text-xl px-10 py-5'}`}
              onClick={goToAdmin}
            >
              <Zap className="w-5 h-5 mr-2" />
              {t('landing.getStarted')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size={isMobile ? 'lg' : 'lg'} 
              variant="outline" 
              className={`border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${isMobile ? 'text-lg px-8 py-4' : 'text-xl px-10 py-5'}`}
            >
              <Eye className="w-5 h-5 mr-2" />
              {t('landing.viewDemo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold mb-4`}>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('landing.features')}
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Мощные инструменты для создания интерактивных планов недвижимости
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-12 mb-16`}>
            <div className="space-y-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div 
                    key={feature.key}
                    className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                      currentFeature === index 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105' 
                        : 'bg-white/80 hover:bg-white hover:shadow-lg'
                    }`}
                    onClick={() => setCurrentFeature(index)}
                  >
                    <div className="flex items-center gap-4">
                      <IconComponent className={`h-12 w-12 ${currentFeature === index ? 'text-white' : 'text-blue-600'}`} />
                      <div>
                        <h4 className={`text-xl font-bold ${currentFeature === index ? 'text-white' : 'text-gray-900'}`}>
                          {t(`landing.${feature.key}`)}
                        </h4>
                        <p className={`${currentFeature === index ? 'text-blue-100' : 'text-gray-600'}`}>
                          {t(`landing.${feature.key}Desc`)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
                    {(() => {
                      const IconComponent = features[currentFeature].icon;
                      return <IconComponent className="h-16 w-16 text-white" />;
                    })()}
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">
                    {t(`landing.${features[currentFeature].key}`)}
                  </h4>
                  <p className="text-gray-600 max-w-sm">
                    {t(`landing.${features[currentFeature].key}Desc`)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
            {[
              { icon: Zap, title: 'Быстрая настройка', desc: 'Создайте проект за 5 минут' },
              { icon: Shield, title: 'Безопасность', desc: 'Защищенное хранение данных' },
              { icon: Globe, title: 'Мультиязычность', desc: 'Поддержка 3 языков' },
              { icon: Smartphone, title: 'Мобильная версия', desc: 'Работает на всех устройствах' },
              { icon: CheckCircle, title: 'Простота', desc: 'Интуитивный интерфейс' },
              { icon: Star, title: 'Качество', desc: 'Профессиональный результат' }
            ].map((item, index) => (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} bg-gradient-to-br from-gray-50 to-blue-50/50`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold mb-4`}>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Отзывы наших клиентов
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Узнайте, что говорят о нас профессионалы рынка недвижимости
            </p>
          </div>
          
          <Testimonials isMobile={isMobile} />
          
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-gray-700 font-medium">4.9/5 средняя оценка от 100+ клиентов</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h3 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold text-white mb-6`}>
            {t('landing.readyToStart')}
          </h3>
          <p className={`${isMobile ? 'text-lg' : 'text-2xl'} text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed`}>
            {t('landing.readyToStartDesc')}
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Button 
              size="lg"
              className={`bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 ${isMobile ? 'text-lg px-8 py-4' : 'text-xl px-12 py-6'}`}
              onClick={goToAdmin}
            >
              <Zap className="w-6 h-6 mr-3" />
              {t('landing.enterAdmin')}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <p className="text-blue-200 text-sm">
              Бесплатный пробный период • Без обязательств • Настройка за 5 минут
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-gray-900 text-gray-100 ${isMobile ? 'py-12' : 'py-16'}`}>
        <div className="container mx-auto px-4">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-4 gap-8'} mb-8`}>
            {/* Company Info */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Building2 className="h-8 w-8 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Gridix
                  </h3>
                  <p className="text-sm text-gray-400">FloorPlan Wizard</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Инновационная платформа для создания интерактивных планов недвижимости. 
                Упрощаем процесс продаж и повышаем конверсию.
              </p>
              <div className="text-sm text-gray-400">
                <p><strong>Компания:</strong> Gridix</p>
                <p><strong>Адрес:</strong> Грузия, Батуми, ул. Леселидзе 3</p>
                <p><strong>Email:</strong> inbox@gridix.live</p>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Быстрые ссылки</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={goToAdmin} className="hover:text-blue-400 transition-colors">Админ панель</button></li>
   {/*              <li><button className="hover:text-blue-400 transition-colors">Демо</button></li>
                <li><button className="hover:text-blue-400 transition-colors">Документация</button></li> */}
                <li><button 
                onClick={() => {
                  window.open('https://t.me/Klasterdigital', '_blank');
                }}
                className="hover:text-blue-400 transition-colors">Поддержка</button></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Правовая информация</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={goToPrivacyPolicy} className="hover:text-blue-400 transition-colors">Политика конфиденциальности</button></li>
                <li><button onClick={goToTermsOfService} className="hover:text-blue-400 transition-colors">Пользовательское соглашение</button></li>
                {/* <li><button className="hover:text-blue-400 transition-colors">Cookie Policy</button></li> */}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className={`flex ${isMobile ? 'flex-col gap-4 text-center' : 'justify-between items-center'}`}>
              <p className="text-gray-400">
                © 2024 Gridix. Все права защищены.
              </p>
            
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
