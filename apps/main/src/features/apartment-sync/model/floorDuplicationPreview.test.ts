import { describe, expect, it } from "vitest";
import {
  buildFloorDuplicationPreview,
  buildRenumberedApartmentNumber,
  type FloorDuplicationLoadedData,
  type FloorDuplicationSourceApartment,
} from "./floorDuplicationPreview";

function makeSourceApartment(
  overrides: Partial<FloorDuplicationSourceApartment> = {},
): FloorDuplicationSourceApartment {
  return {
    id: "source-1",
    apartment_number: "101",
    rooms: 2,
    area: 60,
    type: "apartment",
    polygon: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    ...overrides,
  };
}

function makeLoadedData(): FloorDuplicationLoadedData {
  return {
    targetApartmentsByFloor: {
      2: [],
      3: [],
    },
    floorPlansByFloor: {
      2: null,
      3: null,
    },
  };
}

describe("buildRenumberedApartmentNumber", () => {
  it("replaces the floor prefix when the number starts with the source floor", () => {
    expect(buildRenumberedApartmentNumber("101", 1, 2)).toBe("201");
    expect(buildRenumberedApartmentNumber("1001", 10, 11)).toBe("1101");
  });

  it("returns null when the apartment number cannot be safely renumbered", () => {
    expect(buildRenumberedApartmentNumber("01", 1, 2)).toBeNull();
    expect(buildRenumberedApartmentNumber("A-101", 1, 2)).toBeNull();
  });
});

describe("buildFloorDuplicationPreview", () => {
  it("matches by renumbered apartment number before falling back", () => {
    const loadedData = makeLoadedData();
    loadedData.targetApartmentsByFloor[2] = [
      {
        id: "target-201",
        floor_number: 2,
        apartment_number: "201",
        rooms: 2,
        area: 60,
        type: "apartment",
      },
    ];

    const preview = buildFloorDuplicationPreview({
      sourceFloorNumber: 1,
      targetFloorNumbers: [2],
      sourceImageUrl: "plan.png",
      sourceApartments: [makeSourceApartment()],
      loadedData,
      selectedMatchingRules: ["number_with_floor_prefix", "area_rooms_type"],
      selectedCopyOptions: ["floor_image", "apartment_polygons"],
    });

    expect(preview.floors[0]?.polygonMatches).toEqual([
      {
        sourceApartmentId: "source-1",
        sourceApartmentNumber: "101",
        targetApartmentId: "target-201",
        targetApartmentNumber: "201",
        strategy: "number_with_floor_prefix",
      },
    ]);
    expect(preview.summary.floorPlanOperations).toBe(1);
    expect(preview.summary.polygonOperations).toBe(1);
  });

  it("falls back to area + rooms + type only for a unique pair", () => {
    const loadedData = makeLoadedData();
    loadedData.targetApartmentsByFloor[2] = [
      {
        id: "target-fallback",
        floor_number: 2,
        apartment_number: "X-9",
        rooms: 2,
        area: 60,
        type: "apartment",
      },
    ];

    const preview = buildFloorDuplicationPreview({
      sourceFloorNumber: 1,
      targetFloorNumbers: [2],
      sourceImageUrl: "",
      sourceApartments: [makeSourceApartment()],
      loadedData,
      selectedMatchingRules: ["area_rooms_type"],
      selectedCopyOptions: ["apartment_polygons"],
    });

    expect(preview.floors[0]?.polygonMatches[0]?.strategy).toBe(
      "area_rooms_type",
    );
    expect(preview.summary.totalOperations).toBe(1);
  });

  it("skips ambiguous area fallback groups instead of pairing by index", () => {
    const loadedData = makeLoadedData();
    loadedData.targetApartmentsByFloor[2] = [
      {
        id: "target-1",
        floor_number: 2,
        apartment_number: "2A",
        rooms: 2,
        area: 60,
        type: "apartment",
      },
      {
        id: "target-2",
        floor_number: 2,
        apartment_number: "2B",
        rooms: 2,
        area: 60,
        type: "apartment",
      },
    ];

    const preview = buildFloorDuplicationPreview({
      sourceFloorNumber: 1,
      targetFloorNumbers: [2],
      sourceImageUrl: "",
      sourceApartments: [
        makeSourceApartment({ id: "source-1", apartment_number: "1A" }),
        makeSourceApartment({ id: "source-2", apartment_number: "1B" }),
      ],
      loadedData,
      selectedMatchingRules: ["area_rooms_type"],
      selectedCopyOptions: ["apartment_polygons"],
    });

    expect(preview.floors[0]?.polygonMatches).toHaveLength(0);
    expect(preview.floors[0]?.skippedApartments).toEqual([
      {
        sourceApartmentId: "source-1",
        sourceApartmentNumber: "1A",
        reason: "ambiguous",
      },
      {
        sourceApartmentId: "source-2",
        sourceApartmentNumber: "1B",
        reason: "ambiguous",
      },
    ]);
    expect(preview.summary.ambiguousMatches).toBe(2);
  });

  it("does not count floor image work when the target already has the same image", () => {
    const loadedData = makeLoadedData();
    loadedData.floorPlansByFloor[2] = {
      id: "plan-2",
      floor_number: 2,
      image_url: "plan.png",
    };

    const preview = buildFloorDuplicationPreview({
      sourceFloorNumber: 1,
      targetFloorNumbers: [2],
      sourceImageUrl: "plan.png",
      sourceApartments: [makeSourceApartment()],
      loadedData,
      selectedMatchingRules: ["number_with_floor_prefix"],
      selectedCopyOptions: ["floor_image"],
    });

    expect(preview.floors[0]?.floorPlanAction).toBe("skip");
    expect(preview.summary.floorPlanOperations).toBe(0);
  });
});
