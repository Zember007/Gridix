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
                           }: RangeInputProps) => {
    const from = Math.floor(value[0]);
    const to = Math.ceil(value[1]);


    const [fromText, setFromText] = React.useState<string>(String(from));
    const [toText, setToText] = React.useState<string>(String(to));

    React.useEffect(() => {
        setFromText(String(from));
    }, [from]);

    React.useEffect(() => {
        setToText(String(to));
    }, [to]);

    const parseNumber = (raw: string): number | null => {
        const trimmed = raw.trim();

        if (trimmed === "") {
            return null;
        }

        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) {
            return null;
        }

        return parsed;
    };

    const commit = (nextFrom: number, nextTo: number) => {
        const f = clampNum(nextFrom, min, max);
        const t = clampNum(nextTo, min, max);
        onChange([f, t]);
    };

    const commitFrom = () => {
        const parsedFrom = parseNumber(fromText);

        if (parsedFrom === null) {
            setFromText("");
            return;
        }

        const boundedFrom = clampNum(parsedFrom, min, max);
        const boundedTo = clampNum(to, min, max);
        const nextFrom = Math.min(boundedFrom, boundedTo);

        commit(nextFrom, boundedTo);
        setFromText(String(nextFrom));
        setToText(String(boundedTo));
    };

    const commitTo = () => {
        const parsedTo = parseNumber(toText);

        if (parsedTo === null) {
            setToText("");
            return;
        }

        const boundedFrom = clampNum(from, min, max);
        const boundedTo = clampNum(parsedTo, min, max);
        const nextTo = Math.max(boundedTo, boundedFrom);

        commit(boundedFrom, nextTo);
        setFromText(String(boundedFrom));
        setToText(String(nextTo));
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
                        value={fromText}
                        placeholder={fromPlaceholder}
                        className={`${inputClassName} pr-10`} // место под unit справа
                        onChange={(e) => {
                            setFromText(e.target.value);
                        }}
                        onBlur={commitFrom}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                commitFrom();
                            }
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
                        value={toText}
                        placeholder={toPlaceholder}
                        className={`${inputClassName} pr-10`}
                        onChange={(e) => {
                            setToText(e.target.value);
                        }}
                        onBlur={commitTo}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                commitTo();
                            }
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
