import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DurationOption {
  value: number;
  label: string;
}

interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  options: DurationOption[];
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange,
  options,
}) => {
  const { t } = useLanguage();

  const getMotivationalHint = (duration: number) => {
    if (duration === 36) {
      return (
        <p className="text-sm text-green-600 font-bold animate-in fade-in slide-in-from-bottom-1">
          {t('admin.subscriptionPage.hints.36')}
        </p>
      );
    }
    if (duration === 12) {
      return (
        <p className="text-sm text-blue-600 font-medium animate-in fade-in slide-in-from-bottom-1">
          {t('admin.subscriptionPage.hints.12')}
        </p>
      );
    }
    if (duration === 6) {
      return (
        <p className="text-sm text-purple-600 font-medium animate-in fade-in slide-in-from-bottom-1">
          {t('admin.subscriptionPage.hints.6')}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-muted p-1.5 rounded-2xl inline-flex">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onDurationChange(option.value)}
            className={`relative px-4 sm:px-6 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              selectedDuration === option.value
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center h-6">
        {getMotivationalHint(selectedDuration)}
      </div>
    </div>
  );
};

