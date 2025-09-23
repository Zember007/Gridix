import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const WidgetPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const { setLanguage } = useLanguage();
  
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  const projectSlug = searchParams.get('projectSlug');
  const lang = searchParams.get('lang') || 'ru';

  useEffect(() => {
    // Устанавливаем язык из параметров URL
    setLanguage(lang as 'ru' | 'en');
  }, [lang, setLanguage]);

  useEffect(() => {
    // Настраиваем конфигурацию виджета
    let widgetConfig = {};
    
    if (type === 'projects' && userId) {
      widgetConfig = {
        type: 'projects',
        userId: userId,
        language: lang
      };
    } else if (type === 'project') {
      widgetConfig = {
        type: 'project',
        projectId: projectId,
        projectSlug: projectSlug,
        language: lang
      };
    }

    // Устанавливаем конфигурацию в window
    (window as typeof window & { GridixWidgetConfig: typeof widgetConfig }).GridixWidgetConfig = widgetConfig;

    // Загружаем скрипт виджета
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Очистка при размонтировании
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as typeof window & { GridixWidget?: unknown }).GridixWidget;
      delete (window as typeof window & { GridixWidgetConfig?: unknown }).GridixWidgetConfig;
    };
  }, [type, userId, projectId, projectSlug, lang]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Предварительный просмотр виджета
          </h1>
          <p className="text-gray-600">
            Это демонстрация того, как виджет будет выглядеть на вашем сайте
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div id="gridix-widget-container"></div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Информация о виджете:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Тип:</strong> {type}</li>
            {userId && <li><strong>ID пользователя:</strong> {userId}</li>}
            {projectId && <li><strong>ID проекта:</strong> {projectId}</li>}
            {projectSlug && <li><strong>Slug проекта:</strong> {projectSlug}</li>}
            <li><strong>Язык:</strong> {lang}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WidgetPreviewPage;
