import type { ColInfo } from "xlsx";

type XlsxRow = ReadonlyArray<unknown>;

/**
 * Sets reasonable Excel column widths (`wch`) from cell text length so opened files
 * need little or no manual column resize.
 */
export function computeXlsxColWidths(
  rows: ReadonlyArray<XlsxRow>,
  options?: { min?: number; max?: number; pad?: number },
): ColInfo[] {
  if (rows.length === 0) return [];
  const colCount = Math.max(...rows.map((r) => r.length), 0);
  if (colCount === 0) return [];

  const MIN = options?.min ?? 12;
  const MAX = options?.max ?? 52;
  const PAD = options?.pad ?? 2;
  const widths = Array<number>(colCount).fill(MIN);

  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      const raw = row[c];
      const len = String(raw ?? "").length;
      const next = Math.min(Math.max(widths[c]!, len + PAD), MAX);
      widths[c] = next;
    }
  }

  return widths.map((wch) => ({ wch }));
}
