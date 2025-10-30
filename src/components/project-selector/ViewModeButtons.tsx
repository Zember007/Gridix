import { Button } from '@/components/ui/button';
import { Building2, Grid, List, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ViewMode = 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites';

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  favoritesCount: number;
  isMobile: boolean;
  projectType?: 'building' | 'object' | null;
  themeColor?: string;
  mapVisible?: boolean
}

export const ViewModeButtons = ({ viewMode, setViewMode, favoritesCount, isMobile, projectType, themeColor = '#000000', mapVisible }: ViewModeButtonsProps) => {
  const { t } = useLanguage();

  const buttonClass = (mode: ViewMode) =>
    `${viewMode === mode ? 'text-white' : 'border-gray-300'} ${isMobile ? 'text-xs px-2' : ''}`;

  const buttonStyle = (mode: ViewMode) =>
    viewMode === mode ? { backgroundColor: themeColor } : {};

  return (
    <div className={`flex ${isMobile ? 'justify-center' : 'items-center'} gap-1 md:gap-2`}>
      <Button
        variant={viewMode === 'facade' ? 'default' : 'outline'}
        size="sm"
        className={buttonClass('facade')}
        style={buttonStyle('facade')}
        onClick={() => setViewMode('facade')}
      >
        <Building2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && t('project.facade')}
      </Button>

      {projectType !== 'object' && (
        <Button
          variant={viewMode === 'floor-plan' ? 'default' : 'outline'}
          size="sm"
          className={buttonClass('floor-plan')}
          style={buttonStyle('floor-plan')}
          onClick={() => setViewMode('floor-plan')}
        >
          <Grid className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
          {!isMobile && t('project.floorPlan')}
        </Button>
      )}

      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        className={buttonClass('list')}
        style={buttonStyle('list')}
        onClick={() => setViewMode('list')}
      >
        <List className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && t('project.listView')}
      </Button>
      {mapVisible && (
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          size="sm"
          className={buttonClass('map')}
          style={buttonStyle('map')}
          onClick={() => setViewMode('map')}
        >
          <MapPin className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
          {!isMobile && t('embed.onMap')}
        </Button>
      )}
      <Button
        variant={viewMode === 'favorites' ? 'default' : 'outline'}
        size="sm"
        className={`${buttonClass('favorites')} relative`}
        style={buttonStyle('favorites')}
        onClick={() => setViewMode('favorites')}
      >
        <Heart className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && (t('favorites.title') || 'Избранное')}
        {favoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {favoritesCount > 99 ? '99+' : favoritesCount}
          </span>
        )}
      </Button>
    </div>
  );
};
