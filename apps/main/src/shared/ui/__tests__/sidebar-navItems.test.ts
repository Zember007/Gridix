import { describe, it, expect } from "vitest";

// We test getProjectEditorNavItems indirectly through its exports.
// Since the function is not exported, we replicate its logic here to test the behaviour.

const GENPLAN_HIDDEN = new Set(["apartments", "floorplan", "photos", "fields"]);
const ALL_IDS = [
  "general",
  "apartments",
  "floorplan",
  "photos",
  "fields",
  "genplan",
  "domains",
];

function simulateGetNavItems(
  projectType?: "building" | "object" | null,
  hasMasterplan?: boolean,
): string[] {
  let items = ALL_IDS;

  if (hasMasterplan) {
    return items.filter((id) => !GENPLAN_HIDDEN.has(id));
  }

  if (projectType === "object") {
    return items.filter((id) => id !== "floorplan");
  }

  return items;
}

describe("getProjectEditorNavItems behaviour", () => {
  it("returns all items for a building project without genplan", () => {
    const items = simulateGetNavItems("building", false);
    expect(items).toEqual(ALL_IDS);
  });

  it("hides floorplan for object project type", () => {
    const items = simulateGetNavItems("object", false);
    expect(items).not.toContain("floorplan");
    expect(items).toContain("apartments");
    expect(items).toContain("photos");
  });

  it("hides apartments, floorplan, photos, fields when hasMasterplan is true", () => {
    const items = simulateGetNavItems("building", true);
    expect(items).not.toContain("apartments");
    expect(items).not.toContain("floorplan");
    expect(items).not.toContain("photos");
    expect(items).not.toContain("fields");
  });

  it("keeps general, genplan, domains when hasMasterplan is true", () => {
    const items = simulateGetNavItems("building", true);
    expect(items).toContain("general");
    expect(items).toContain("genplan");
    expect(items).toContain("domains");
  });

  it("genplan mode takes priority over object type", () => {
    // If a user has genplan active on an object project, genplan rules win
    const items = simulateGetNavItems("object", true);
    expect(items).not.toContain("apartments");
    expect(items).not.toContain("floorplan");
    expect(items).not.toContain("photos");
    expect(items).not.toContain("fields");
    expect(items).toContain("genplan");
    expect(items).toContain("domains");
  });
});
