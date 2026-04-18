import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
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

  const periodLabel = t("admin.subscriptionPage.checkout.summary.period");

  return (
    <div className="flex flex-col">
      <div className="w-full lg:hidden">
        <Select
          value={String(selectedDuration)}
          onValueChange={(v) => onDurationChange(Number(v))}
        >
          <SelectTrigger
            aria-label={periodLabel}
            className="h-11 min-h-11 w-full rounded-2xl border-border bg-muted px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring focus:ring-offset-0"
          >
            <SelectValue placeholder={periodLabel} />
          </SelectTrigger>
          <SelectContent position="popper" className="rounded-xl">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={String(option.value)}
                className="rounded-lg py-2.5"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="no-scrollbar mx-auto hidden max-w-full overflow-x-auto whitespace-nowrap rounded-2xl bg-muted p-1.5 lg:inline-flex">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDurationChange(option.value)}
            className={`relative rounded-xl px-4 py-2 text-xs font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0 sm:px-6 lg:text-sm ${
              selectedDuration === option.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-inset ring-border"
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
