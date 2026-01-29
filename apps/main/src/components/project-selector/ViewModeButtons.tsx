import { useState } from 'react';
import { Button } from "@gridix/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@gridix/ui";
import { Building2, Grid, List, MapPin, Heart, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';



type ViewMode = 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites' | 'chess';

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  favoritesCount: number;
  isMobile: boolean;
  projectType?: 'building' | 'object' | null;
  themeColor?: string;
  mapVisible?: boolean
  isWidget?: boolean;
}



export const ViewModeButtons = ({ isWidget = false, viewMode, setViewMode, favoritesCount, isMobile, projectType, themeColor = '#000000', mapVisible }: ViewModeButtonsProps) => {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const buttonClass = (mode: ViewMode) =>
    ` -mb-[2px] px-4 h-9 rounded-none bg-transparent hover:bg-transparent transition-all duration-200
       ${viewMode === mode
      ? 'text-gray-900 font-bold border-b-2'
      : 'text-gray-500 font-medium border-b-2 border-transparent hover:text-gray-700'
    }
       ${isMobile ? 'text-xs' : 'text-sm'}`;

  const buttonStyle = (mode: ViewMode) =>
    viewMode === mode
      ? { borderColor: themeColor }
      : {};

  const getModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'chess':
        return t('project.chess') || 'Шахматка';
      case 'facade':
        return t('project.facade');
      case 'list':
        return t('project.listView'); // "Помещения" mapped to List
      case 'floor-plan':
        return t('project.floorPlan'); // "Этажи" mapped to Floor Plan
      case 'map':
        return t('embed.onMap');
      case 'favorites':
        return t('favorites.title');
      default:
        return '';
    }
  };

  // Mobile: burger menu with icons and labels
  if (isMobile) {
    return (
      <nav
        className="flex items-center justify-between gap-2">
        <DropdownMenu
          open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger className='!border-none ' asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="`h-9 w-9 p-0 relative z-20 block cursor-pointer lg:hidden focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0">
              <Menu className={`${isMenuOpen ? 'rotate-180 scale-0 opacity-0' : ''}   m-auto size-6 duration-200`} />
              <X className={`${isMenuOpen ? '!rotate-0 !scale-100 !opacity-100' : ''} absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[10rem]">
            <DropdownMenuItem
              onClick={() => setViewMode('chess')}
              className={viewMode === 'chess' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Grid className="mr-2 h-4 w-4" />
              <span>{getModeLabel('chess')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setViewMode('facade')}
              className={viewMode === 'facade' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>{getModeLabel('facade')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}
            >
              <List className="mr-2 h-4 w-4" />
              <span>{getModeLabel('list')}</span>
            </DropdownMenuItem>

            {projectType !== 'object' && (
              <DropdownMenuItem
                onClick={() => setViewMode('floor-plan')}
                className={viewMode === 'floor-plan' ? 'bg-accent text-accent-foreground' : ''}
              >
                <Grid className="mr-2 h-4 w-4" />
                <span>{getModeLabel('floor-plan')}</span>
              </DropdownMenuItem>
            )}

            {projectType !== 'object' && (
              null
            )}

            {mapVisible && (
              <DropdownMenuItem
                onClick={() => setViewMode('map')}
                className={viewMode === 'map' ? 'bg-accent text-accent-foreground' : ''}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <span>{getModeLabel('map')}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setViewMode('favorites')}
              className={viewMode === 'favorites' ? 'bg-accent text-accent-foreground' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Heart className="mr-2 h-4 w-4" />
                  <span>{getModeLabel('favorites')}</span>
                </div>
                {favoritesCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    );
  }

  return (
    <div className="flex justify-center md:items-center  border-b-2 border-gray-200">
      {/* 1. Chess - Шахматка */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass('chess')}
        style={buttonStyle('chess')}
        onClick={() => setViewMode('chess')}
      >
        <Grid className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && (getModeLabel('chess'))}
      </Button>

      {/* 2. Facade - Фасады */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass('facade')}
        style={buttonStyle('facade')}
        onClick={() => setViewMode('facade')}
      >
        <Building2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && getModeLabel('facade')}
      </Button>

      {/* 3. List - Помещения */}
      <Button
        variant="ghost"
        size="sm"
        className={buttonClass('list')}
        style={buttonStyle('list')}
        onClick={() => setViewMode('list')}
      >
        <List className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && getModeLabel('list')}
      </Button>

      {/* 4. Floor Plan - Этажи */}
      {projectType !== 'object' && (
        <Button
          variant="ghost"
          size="sm"
          className={buttonClass('floor-plan')}
          style={buttonStyle('floor-plan')}
          onClick={() => setViewMode('floor-plan')}
        >
          <Grid className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
          {!isMobile && getModeLabel('floor-plan')}
        </Button>
      )}

      {mapVisible && (
        <Button
          variant="ghost"
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
        variant="ghost"
        size="sm"
        className={`${buttonClass('favorites')} relative`}
        style={buttonStyle('favorites')}
        onClick={() => setViewMode('favorites')}
      >
        <Heart className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
        {!isMobile && (t('favorites.title') || 'Избранное')}
        {favoritesCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
            {favoritesCount > 99 ? '99+' : favoritesCount}
          </span>
        )}
      </Button>
     
    </div>
  );
};
