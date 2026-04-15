import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@gridix/ui";
import {
  CurrencyType,
  getCurrencySymbol,
  isValidCurrency,
} from "@gridix/utils/lib";

export interface CurrencyToggleProps {
  selectedCurrency: string;
  onChange: (currency: CurrencyType) => void;
  projectCurrency?: string | null;
  themeColor?: string;
  className?: string;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  selectedCurrency,
  onChange,
  projectCurrency,
  themeColor = "#000000",
  className = "gap-2",
}) => {
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

  const currenciesToShow = list.filter((c, i) => list.indexOf(c) === i);

  return (
    <ToggleGroup
      type="single"
      value={selectedCurrency}
      onValueChange={(v) => v && onChange(v as Currency)}
      className={className}
    >
      {currenciesToShow.map((c) => (
        <ToggleGroupItem
          key={c}
          value={c}
          size="sm"
          aria-label={c}
          className="h-9 w-9 rounded-full bg-gray-100 p-0 text-base text-gray-600 data-[state=on]:text-white"
          style={
            {
              "--tw-bg-opacity": selectedCurrency === c ? "1" : undefined,
              backgroundColor: selectedCurrency === c ? themeColor : undefined,
            } as React.CSSProperties
          }
        >
          {getCurrencySymbol(c)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default CurrencyToggle;
