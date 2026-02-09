import * as React from "react";
import { Input } from "./input";
import { cn } from "@gridix/utils/lib";

export type RangeValue = [number,number];

type RangeInputProps = {
    label?: React.ReactNode;

    min: number;
    max: number;

    value: RangeValue;
    onChange: (next: RangeValue) => void;

    fromPlaceholder?: string;
    toPlaceholder?: string;

    formatHint?: (n: number) => string; // например formatPrice
    unit?: string; // "м²" или "₽"


    className?: string;
    inputClassName?: string;

    // Если хочешь более строгий UX: автоматом править from/to если вышли за min/max
    clamp?: boolean;
};

const clampNum = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

export const RangeInput = ({
                               label,
                               min,
                               max,
                               value,
                               onChange,
                               fromPlaceholder,
                               toPlaceholder,
                               unit,
                               className,
                               inputClassName,
                               clamp = false,
                           }: RangeInputProps) => {
    const from = value[0];
    const to = value[1];

    const commit = (nextFrom: number, nextTo: number) => {
        if (!clamp) {
            onChange([nextFrom, nextTo]);
            return;
        }

        const f = clampNum(nextFrom, min, max);
        const t = clampNum(nextTo, min, max);
        onChange([f, t]);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label ? <div className="text-xs text-gray-500">{label}</div> : null}

            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={min}
                        max={to}
                        value={from}
                        placeholder={fromPlaceholder}
                        className={`${inputClassName} pr-10`} // место под unit справа
                        onChange={(e) => {
                            const raw = e.target.value;
                            const nextFrom = raw === "" ? min : Number(raw);
                            commit(nextFrom, to);
                        }}
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
    {unit}
  </span>
                </div>

                <div className=" relative">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={from}
                        max={max}
                        value={to}
                        placeholder={toPlaceholder}
                        className={`${inputClassName} pr-10`}
                        onChange={(e) => {
                            const raw = e.target.value;
                            const nextTo = raw === "" ? max : Number(raw);
                            commit(from, nextTo);
                        }}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
    {unit}
  </span>
                </div>
            </div>
        </div>
    );
};

RangeInput.displayName = "RangeInput";