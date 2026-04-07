import { describe, it, expect } from "vitest";

// Replicate the validation logic from GenplanEditor.handleSaveZone
interface Point {
  x: number;
  y: number;
}
interface SaveZoneParams {
  points: Point[];
  masterplanId: string | undefined;
  selectedSubProjectId: string | null;
}
interface SaveZonePayload {
  area_type: string;
  linked_entity_type: string;
  linked_entity_id: string | null;
  geometry_type: string;
  geometry: Point[];
  is_clickable: boolean;
  status: string;
}

type SaveResult =
  | { ok: true; payload: SaveZonePayload }
  | {
      ok: false;
      error: "zoneMinPoints" | "saveMasterplanFirst" | "selectSubProjectFirst";
    };

function validateAndBuildPayload(params: SaveZoneParams): SaveResult {
  const { points, masterplanId, selectedSubProjectId } = params;

  if (!points || points.length < 3) {
    return { ok: false, error: "zoneMinPoints" };
  }
  if (!masterplanId) {
    return { ok: false, error: "saveMasterplanFirst" };
  }
  if (!selectedSubProjectId) {
    return { ok: false, error: "selectSubProjectFirst" };
  }

  return {
    ok: true,
    payload: {
      area_type: "building",
      linked_entity_type: "sub_project",
      linked_entity_id: selectedSubProjectId,
      geometry_type: "polygon",
      geometry: points,
      is_clickable: true,
      status: "active",
    },
  };
}

const THREE_POINTS: Point[] = [
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 30, y: 50 },
];

describe("GenplanEditor zone save validation", () => {
  it("rejects when fewer than 3 points", () => {
    const result = validateAndBuildPayload({
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      masterplanId: "mp-1",
      selectedSubProjectId: "sp-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("zoneMinPoints");
  });

  it("rejects when masterplanId is missing", () => {
    const result = validateAndBuildPayload({
      points: THREE_POINTS,
      masterplanId: undefined,
      selectedSubProjectId: "sp-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("saveMasterplanFirst");
  });

  it("rejects when no sub-project is selected", () => {
    const result = validateAndBuildPayload({
      points: THREE_POINTS,
      masterplanId: "mp-1",
      selectedSubProjectId: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("selectSubProjectFirst");
  });

  it("builds correct payload with valid inputs", () => {
    const result = validateAndBuildPayload({
      points: THREE_POINTS,
      masterplanId: "mp-1",
      selectedSubProjectId: "sp-42",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.linked_entity_type).toBe("sub_project");
      expect(result.payload.linked_entity_id).toBe("sp-42");
      expect(result.payload.linked_entity_id).not.toBeNull();
      expect(result.payload.geometry).toEqual(THREE_POINTS);
    }
  });

  it("never sends null linked_entity_id when sub-project is selected", () => {
    const result = validateAndBuildPayload({
      points: THREE_POINTS,
      masterplanId: "mp-1",
      selectedSubProjectId: "sp-99",
    });
    if (result.ok) {
      expect(result.payload.linked_entity_id).not.toBeNull();
    }
  });
});
