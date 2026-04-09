import { describe, it, expect } from "vitest";

// Replicate the UUID detection logic from SubProjectEditorPage
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveProjectField(projectSlug: string): "id" | "slug" {
  return UUID_RE.test(projectSlug) ? "id" : "slug";
}

describe("SubProjectEditorPage: UUID vs slug detection", () => {
  it("detects a valid UUID and returns 'id'", () => {
    expect(resolveProjectField("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "id",
    );
  });

  it("detects a valid UUID (uppercase) and returns 'id'", () => {
    expect(resolveProjectField("550E8400-E29B-41D4-A716-446655440000")).toBe(
      "id",
    );
  });

  it("detects a slug and returns 'slug'", () => {
    expect(resolveProjectField("my-project-slug")).toBe("slug");
  });

  it("detects a slug that starts with numbers but is not UUID-shaped", () => {
    expect(resolveProjectField("123-my-project")).toBe("slug");
  });

  it("returns 'slug' for an empty string", () => {
    expect(resolveProjectField("")).toBe("slug");
  });

  it("returns 'slug' for a partial UUID-looking string", () => {
    expect(resolveProjectField("550e8400-e29b-41d4")).toBe("slug");
  });
});
