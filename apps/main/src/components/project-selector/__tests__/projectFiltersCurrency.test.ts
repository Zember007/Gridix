import { describe, expect, it } from "vitest";
import { normalizePriceRangeForCurrencyChange } from "../hooks/useProjectFilters";

describe("normalizePriceRangeForCurrencyChange", () => {
  it("converts entered range to target currency and keeps ordering", () => {
    const nextRange = normalizePriceRangeForCurrencyChange({
      prevCurrency: "USD",
      nextCurrency: "EUR",
      prevRange: [1000, 2000],
      minPrice: 0,
      maxPrice: 10_000,
    });

    expect(nextRange[0]).toBeCloseTo(909.09, 1);
    expect(nextRange[1]).toBeCloseTo(1818.18, 1);
  });

  it("clamps converted values to provided bounds", () => {
    const nextRange = normalizePriceRangeForCurrencyChange({
      prevCurrency: "RUB",
      nextCurrency: "USD",
      prevRange: [1000, 900_000],
      minPrice: 100,
      maxPrice: 2000,
    });

    expect(nextRange).toEqual([100, 2000]);
  });
});
