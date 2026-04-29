import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface IncomeChartProps {
  data: number[];
  dates: string[];
  language: string;
}

type IncomeChartPoint = {
  date: string;
  value: number;
};

type IncomeTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    color?: string;
    name?: string | number;
    value?: string | number;
  }>;
  locale: string;
};

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(locale: string) {
  if (!currencyFormatters.has(locale)) {
    currencyFormatters.set(
      locale,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    );
  }

  return currencyFormatters.get(locale)!;
}

function formatCurrency(value: number, locale: string) {
  return getCurrencyFormatter(locale).format(value);
}

function formatShortDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

function IncomeTooltip({ active, label, payload, locale }: IncomeTooltipProps) {
  if (!active || !payload?.length || !payload[0]) return null;

  const point = payload[0];
  const numericValue =
    typeof point.value === "number" ? point.value : Number(point.value ?? 0);

  return (
    <div className="min-w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
      {label ? (
        <div className="mb-2 text-xs font-medium text-gray-500">
          {formatShortDate(String(label), locale)}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-gray-500">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: point.color }}
          />
          <span>{point.name}</span>
        </span>
        <span className="font-semibold text-gray-950 tabular-nums">
          {formatCurrency(numericValue, locale)}
        </span>
      </div>
    </div>
  );
}

export const IncomeChart: React.FC<IncomeChartProps> = ({
  data,
  dates,
  language,
}) => {
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const chartData: IncomeChartPoint[] = data.map((value, index) => ({
    value,
    date: dates[index] ?? "",
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        —
      </div>
    );
  }

  return (
    <div className="h-[280px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
        >
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            minTickGap={24}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(value: string) => formatShortDate(value, locale)}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={64}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(value: number) => formatCurrency(value, locale)}
          />
          <Tooltip content={<IncomeTooltip locale={locale} />} cursor={false} />
          <Line
            type="monotone"
            dataKey="value"
            name="Income"
            stroke="#0f9f6e"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
