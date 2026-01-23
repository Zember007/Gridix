
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

export const LanguageToggle = ({
  classNameButton = '',
  allowedLanguages,
}: {
  classNameButton?: string;
  allowedLanguages?: Language[];
}) => {
  const { language, setLanguage } = useLanguage();

  const options = (
    allowedLanguages?.length ? allowedLanguages : (Object.keys(LANGUAGE_CONFIG) as Language[])
  ).filter((code): code is Language => code in LANGUAGE_CONFIG);

  // If only one language is available, don't show the switcher.
  if (options.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 ${classNameButton}`}>
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((code) => {
          const config = LANGUAGE_CONFIG[code];
          return (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`cursor-pointer ${language === code ? 'bg-accent' : ''}`}
          >
            <span className="mr-2">{config.flag}</span>
            {config.name}
          </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
