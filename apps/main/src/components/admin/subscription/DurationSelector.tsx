import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
        <p className="text-sm font-bold text-green-600 animate-in fade-in slide-in-from-bottom-1">
          {t("admin.subscriptionPage.hints.36")}
        </p>
      );
    }
    if (duration === 12) {
      return (
        <p className="text-sm font-medium text-blue-600 animate-in fade-in slide-in-from-bottom-1">
          {t("admin.subscriptionPage.hints.12")}
        </p>
      );
    }
    if (duration === 6) {
      return (
        <p className="text-sm font-medium text-purple-600 animate-in fade-in slide-in-from-bottom-1">
          {t("admin.subscriptionPage.hints.6")}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="no-scrollbar mx-auto inline-flex overflow-x-auto whitespace-nowrap rounded-2xl bg-muted p-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onDurationChange(option.value)}
            className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:px-6 md:text-sm ${
              selectedDuration === option.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-3 h-6 text-center">
        {getMotivationalHint(selectedDuration)}
      </div>
    </div>
  );
};
