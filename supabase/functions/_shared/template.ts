import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Very small templating helper: replaces `{{path.to.value}}` with the payload value.
 *
 * Notes:
 * - Missing keys become an empty string.
 * - By default values are HTML-escaped. Use `{{{path}}}` to insert raw (dangerous).
 */
export function renderTemplate(template: string, payload: Record<string, unknown>): string {
  if (!template) return "";

  // Raw: triple braces
  const withRaw = template.replaceAll(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_m, key: string) => {
    const v = resolvePath(payload, key);
    if (v === null || v === undefined) return "";
    return String(v);
  });

  // Escaped: double braces
  return withRaw.replaceAll(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = resolvePath(payload, key);
    if (v === null || v === undefined) return "";
    return escapeHtml(String(v));
  });
}

