
import { Globe } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language, LANGUAGE_CONFIG } from '@/shared/lib/language-utils';

export const LanguageToggle = ({ classNameButton = '' }: { classNameButton?: string }) => {
  
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 ${classNameButton}`}>
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`cursor-pointer ${language === code ? 'bg-accent' : ''}`}
          >
            <span className="mr-2">{config.flag}</span>
            {config.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
