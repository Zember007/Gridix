import { describe, it, expect } from "vitest";
import {
  parseViewMode,
  parseFloor,
  parseFavoritesParam,
} from "../hooks/useUrlState";

describe("parseViewMode", () => {
  it("returns facade by default when no param", () => {
    const params = new URLSearchParams("");
    expect(parseViewMode(params)).toBe("facade");
  });

  it("returns valid view mode from URL", () => {
    expect(parseViewMode(new URLSearchParams("view=list"))).toBe("list");
    expect(parseViewMode(new URLSearchParams("view=chess"))).toBe("chess");
    expect(parseViewMode(new URLSearchParams("view=floor-plan"))).toBe(
      "floor-plan",
    );
    expect(parseViewMode(new URLSearchParams("view=map"))).toBe("map");
    expect(parseViewMode(new URLSearchParams("view=favorites"))).toBe(
      "favorites",
    );
    expect(parseViewMode(new URLSearchParams("view=facade"))).toBe("facade");
  });

  it("returns facade for invalid view mode", () => {
    expect(parseViewMode(new URLSearchParams("view=invalid"))).toBe("facade");
    expect(parseViewMode(new URLSearchParams("view="))).toBe("facade");
  });
});

describe("parseFloor", () => {
  it("returns null when no param", () => {
    const params = new URLSearchParams("");
    expect(parseFloor(params)).toBeNull();
  });

  it("returns number for valid floor", () => {
    expect(parseFloor(new URLSearchParams("floor=5"))).toBe(5);
    expect(parseFloor(new URLSearchParams("floor=0"))).toBe(0);
    expect(parseFloor(new URLSearchParams("floor=-1"))).toBe(-1);
  });

  it("returns null for non-numeric floor", () => {
    expect(parseFloor(new URLSearchParams("floor=abc"))).toBeNull();
    expect(parseFloor(new URLSearchParams("floor="))).toBeNull();
  });
});

describe("parseFavoritesParam", () => {
  it("returns empty when no param or empty", () => {
    expect(parseFavoritesParam(new URLSearchParams(""))).toEqual([]);
    expect(parseFavoritesParam(new URLSearchParams("favorites="))).toEqual([]);
  });

  it("splits and trims apartment numbers", () => {
    expect(parseFavoritesParam(new URLSearchParams("favorites=1,2,3"))).toEqual(
      ["1", "2", "3"],
    );
    expect(
      parseFavoritesParam(new URLSearchParams("favorites= 12 , 15 ,3 ")),
    ).toEqual(["12", "15", "3"]);
  });

  it("ignores empty segments", () => {
    expect(parseFavoritesParam(new URLSearchParams("favorites=1,,2,"))).toEqual(
      ["1", "2"],
    );
  });

  it("decodes percent-encoding from URLSearchParams", () => {
    const params = new URLSearchParams();
    params.set("favorites", "101, 102");
    expect(parseFavoritesParam(params)).toEqual(["101", "102"]);
  });
});
