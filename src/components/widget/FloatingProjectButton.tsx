import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';

export interface FloatingProjectButtonProps {
  projectId: string;
  side?: 'left' | 'right' | undefined;
  bottomOffset?: number | undefined;
  sideOffset?: number | undefined;
}

export const FloatingProjectButton = ({
  projectId,
  side = 'right',
  bottomOffset = 40,
  sideOffset = 32,
}: FloatingProjectButtonProps) => {
  const { language } = useLanguage();
  const { project } = useProject(projectId);
  const [themeColor, setThemeColor] = useState<string>('#000000');

  useEffect(() => {
    if (project && (project as unknown as Record<string, unknown>)?.theme_color) {
      setThemeColor((project as unknown as Record<string, unknown>).theme_color as string);
    }
  }, [project]);

  const getBaseDomain = async () => {
    // Получаем текущий домен
    const currentHostname = window.location.hostname;

    // Получаем домены проекта из project_domains
    const { data: projectDomains } = await supabase
      .from('project_domains')
      .select('domain, is_primary, status')
      .eq('project_id', project?.id || projectId)
      .eq('status', 'active');

    // Проверяем, есть ли текущий домен среди доменов проекта
    const isProjectDomain = projectDomains?.some(
      (pd) => pd.domain.toLowerCase() === currentHostname.toLowerCase()
    );

    // Определяем базовый домен
    let baseDomain: string;
    if (isProjectDomain) {
      baseDomain = window.location.origin;
    } else {
      const primaryDomain = projectDomains?.find((pd) => pd.is_primary)?.domain;
      if (primaryDomain) {
        baseDomain = 'https://' + primaryDomain;
      } else {
        baseDomain =
          'https://' + (import.meta.env.VITE_SERVER_DOMAIN || 'gridix.live');
      }
    }

    return baseDomain;
  };

  const openFullProjectPage = async () => {
    try {
      const baseDomain =
        process.env.NODE_ENV === 'production' ? await getBaseDomain() : '';
      const projectPath = project?.slug
        ? project.slug
        : `id/${project?.id || projectId}`;
      const url = `${baseDomain}/${language}/project/${projectPath}`;
      window.open(url, '_self');
    } catch (error) {
      console.error('Error opening full project page:', error);
      const fallbackDomain =
        import.meta.env.VITE_SERVER_DOMAIN || 'https://gridix.live';
      const projectPath = project?.slug
        ? project.slug
        : `id/${project?.id || projectId}`;
      const url = `${fallbackDomain}/${language}/project/${projectPath}`;
      window.open(url, '_self');
    }
  };

  if (!project) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: bottomOffset,
        [side]: sideOffset,
      }}
    >
      <Button
        size="icon-lg"
        onClick={openFullProjectPage}
        style={{ backgroundColor: themeColor }}
        className="shadow-[0_4px_20px_rgba(0,0,0,0.6)] rounded-full px-4 py-2 text-sm"
      >
        <ExternalLink />
      </Button>
    </div>
  );
};


