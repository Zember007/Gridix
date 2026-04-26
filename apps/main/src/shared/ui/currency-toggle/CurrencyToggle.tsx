import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from "@gridix/ui";
import {
  cn,
  CurrencyType,
  getCurrencySymbol,
  isValidCurrency,
} from "@gridix/utils/lib";

export interface CurrencyToggleProps {
  selectedCurrency: string;
  onChange: (currency: CurrencyType) => void;
  projectCurrency?: string | null;
  /** Explicit list of currencies to show. Overrides the default derivation from projectCurrency. */
  availableCurrencies?: CurrencyType[] | null;
  themeColor?: string;
  className?: string;
  /** Кнопки с переносом строк или компактный выпадающий список */
  variant?: "buttons" | "select";
}

function getCurrenciesToShow(
  projectCurrency: string | null | undefined,
  availableCurrencies?: CurrencyType[] | null,
): CurrencyType[] {
  if (availableCurrencies && availableCurrencies.length > 0) {
    return availableCurrencies;
  }

  type Currency = CurrencyType;
  const preferredOrder: Array<Exclude<Currency, "RUB">> = [
    "USD",
    "GEL",
    "EUR",
    "KZT",
  ];
  const baseProjectCurrency: Currency = isValidCurrency(String(projectCurrency))
    ? (projectCurrency as Currency)
    : "RUB";

  const list: Currency[] = [
    ...preferredOrder,
    ...(preferredOrder.includes(baseProjectCurrency as Exclude<Currency, "RUB">)
      ? []
      : [baseProjectCurrency]),
  ];

  return list.filter((c, i) => list.indexOf(c) === i);
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  selectedCurrency,
  onChange,
  projectCurrency,
  availableCurrencies,
  themeColor = "#000000",
  className,
  variant = "buttons",
}) => {
  const currenciesToShow = getCurrenciesToShow(
    projectCurrency,
    availableCurrencies,
  );

  if (variant === "buttons") {
    return (
      <ToggleGroup
        type="single"
        value={selectedCurrency}
        onValueChange={(v) => v && onChange(v as CurrencyType)}
        className={cn(
          "flex flex-wrap items-center justify-start gap-2",
          className,
        )}
      >
        {currenciesToShow.map((c) => (
          <ToggleGroupItem
            key={c}
            value={c}
            size="sm"
            aria-label={c}
            className="h-9 w-9 shrink-0 rounded-full bg-gray-100 p-0 text-base text-gray-600 data-[state=on]:text-white"
            style={
              {
                "--tw-bg-opacity": selectedCurrency === c ? "1" : undefined,
                backgroundColor:
                  selectedCurrency === c ? themeColor : undefined,
              } as React.CSSProperties
            }
          >
            {getCurrencySymbol(c)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <Select
      value={selectedCurrency}
      onValueChange={(v) => v && onChange(v as CurrencyType)}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-auto min-w-[5.5rem] max-w-[9rem] shrink-0 border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-0",
          className,
        )}
        style={
          {
            borderColor: `${themeColor}55`,
          } as React.CSSProperties
        }
        aria-label={selectedCurrency}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" sideOffset={6} className="z-[120]">
        {currenciesToShow.map((c) => (
          <SelectItem
            key={c}
            value={c}
            className="cursor-pointer py-2 pl-8 pr-8 text-sm"
          >
            <span className="inline-flex items-baseline gap-2">
              <span className="text-base tabular-nums">
                {getCurrencySymbol(c)}
              </span>
              <span className="text-xs font-medium tracking-wide text-gray-500">
                {c}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencyToggle;
