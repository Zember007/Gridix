import { describe, it, expect } from "vitest";

/**
 * Replicate the slug generation and id-remapping logic used by
 * the clone-sub-project edge function handler so we can unit-test
 * it without a live Supabase connection.
 */

// ── Slug generation (mirrors project-editor/index.ts) ──

function generateBaseSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[а-яё]/gi, (c: string) => {
        const map: Record<string, string> = {
          а: "a",
          б: "b",
          в: "v",
          г: "g",
          д: "d",
          е: "e",
          ё: "yo",
          ж: "zh",
          з: "z",
          и: "i",
          й: "j",
          к: "k",
          л: "l",
          м: "m",
          н: "n",
          о: "o",
          п: "p",
          р: "r",
          с: "s",
          т: "t",
          у: "u",
          ф: "f",
          х: "h",
          ц: "ts",
          ч: "ch",
          ш: "sh",
          щ: "sch",
          ъ: "",
          ы: "y",
          ь: "",
          э: "e",
          ю: "yu",
          я: "ya",
        };
        return map[c.toLowerCase()] ?? c;
      }) || "korpus"
  );
}

// ── Apartment ID remapping (mirrors clone handler) ──

function remapApartmentIds(
  ids: string[] | null | undefined,
  idMap: Map<string, string>,
): string[] | null {
  if (!Array.isArray(ids)) return null;
  return ids.map((id) => idMap.get(id)).filter(Boolean) as string[];
}

// ── Tests ──

describe("clone-sub-project slug generation", () => {
  it("transliterates Cyrillic name", () => {
    expect(generateBaseSlug("Корпус А")).toBe("korpus-a");
  });

  it("handles Latin-only name", () => {
    expect(generateBaseSlug("Building B")).toBe("building-b");
  });

  it("strips special characters", () => {
    expect(generateBaseSlug("Tower #3 (copy)")).toBe("tower-3-copy");
  });

  it("falls back to 'korpus' for empty result", () => {
    expect(generateBaseSlug("!!!")).toBe("korpus");
  });

  it("produces default copy name slug", () => {
    expect(generateBaseSlug("Корпус A (copy)")).toBe("korpus-a-copy");
  });
});

describe("clone-sub-project apartment id remapping", () => {
  const idMap = new Map([
    ["old-1", "new-1"],
    ["old-2", "new-2"],
    ["old-3", "new-3"],
  ]);

  it("remaps all known ids", () => {
    expect(remapApartmentIds(["old-1", "old-3"], idMap)).toEqual([
      "new-1",
      "new-3",
    ]);
  });

  it("drops unknown ids", () => {
    expect(remapApartmentIds(["old-1", "unknown"], idMap)).toEqual(["new-1"]);
  });

  it("returns null for null input", () => {
    expect(remapApartmentIds(null, idMap)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(remapApartmentIds(undefined, idMap)).toBeNull();
  });

  it("returns empty array for empty input", () => {
    expect(remapApartmentIds([], idMap)).toEqual([]);
  });
});
