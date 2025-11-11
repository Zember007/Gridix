import { VideoPlayer } from './video-player';
import widgetVideo from '@/assets/video/widget.mp4';
import importVideo from '@/assets/video/import.mp4';
import crmVideo from '@/assets/video/crm.mp4';
import dateUpdateVideo from '@/assets/video/change_status.mp4';
import analyticsVideo from '@/assets/video/analytics.mp4';
import teamManagementVideo from '@/assets/video/managers.mp4';
import { Timeline } from '../ui/timeline';
import { useLanguage } from '@/contexts/LanguageContext';

export const ExpandedDemo = () => {
  const { t } = useLanguage();
  
  return (
    <Timeline
        title={
          <>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">{t('landing.expandedDemo.title')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('landing.expandedDemo.subtitle')}
            </p>
          </>
        }
        data={[
          {
            title: t('landing.expandedDemo.widget.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.widget.description')}
                </p>
                <VideoPlayer
                  src={widgetVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          },
          {
            title: t('landing.expandedDemo.excelImport.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.excelImport.description')}
                </p>
                <VideoPlayer
                  src={importVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          },
          {
            title: t('landing.expandedDemo.crmIntegration.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.crmIntegration.description')}
                </p>
                <VideoPlayer
                  src={crmVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          },
          {
            title: t('landing.expandedDemo.dataUpdate.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.dataUpdate.description')}
                </p>
                <VideoPlayer
                  src={dateUpdateVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          },
          {
            title: t('landing.expandedDemo.analytics.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.analytics.description')}
                </p>
                <VideoPlayer
                  src={analyticsVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          },
          {
            title: t('landing.expandedDemo.teamManagement.title'),
            content: (
              <div>
                <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
                  {t('landing.expandedDemo.teamManagement.description')}
                </p>
                <VideoPlayer
                  src={teamManagementVideo}
                  className="rounded-lg object-cover h-auto w-full bg-neutral-200 dark:bg-neutral-800 shadow"
                />
              </div>
            ),
          }
        ]}
      />
  );
};

