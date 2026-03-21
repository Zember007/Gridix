/**
 * Извлекает человекочитаемое сообщение из JSON-тела edge function.
 */
export function extractFunctionErrorMessageFromPayload(
  body: unknown,
): string | null {
  if (body == null) return null;
  if (typeof body === "string") {
    const s = body.trim();
    return s.length > 0 ? s : null;
  }
  if (typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  if (typeof o.message === "string" && o.message.trim())
    return o.message.trim();

  if (o.error && typeof o.error === "object") {
    const inner = o.error as Record<string, unknown>;
    if (typeof inner.message === "string" && inner.message.trim()) {
      return inner.message.trim();
    }
    if (typeof inner.detail === "string" && inner.detail.trim()) {
      return inner.detail.trim();
    }
  }
  return null;
}

/** Тело с ненулевым полем error, но без извлекаемого текста (например error: true). */
export function hasTruthyErrorField(data: unknown): boolean {
  if (data == null || typeof data !== "object") return false;
  const e = (data as Record<string, unknown>).error;
  return e != null && e !== false && e !== "";
}

async function readResponseAsErrorMessage(
  response: Response,
): Promise<string | null> {
  try {
    const text = await response.text();
    if (!text.trim()) return null;
    try {
      const json: unknown = JSON.parse(text);
      return (
        extractFunctionErrorMessageFromPayload(json) ?? text.trim() ?? null
      );
    } catch {
      return text.trim();
    }
  } catch {
    return null;
  }
}

function isGenericInvokeFailureMessage(message: string): boolean {
  return /non-2xx|non 2xx|edge function returned/i.test(message);
}

/**
 * При `functions.invoke` с HTTP error тело ответа часто лежит в `error.context` (Response),
 * а не в `data`. Собираем сообщение для toast.
 */
export async function resolveSupabaseFunctionInvokeErrorMessage(
  data: unknown,
  error: unknown,
  fallback: string,
): Promise<string> {
  const fromData = extractFunctionErrorMessageFromPayload(data);
  if (fromData) return fromData;

  if (error && typeof error === "object" && "context" in error) {
    const ctx = (error as { context: unknown }).context;
    if (ctx instanceof Response) {
      const fromBody = await readResponseAsErrorMessage(ctx);
      if (fromBody) return fromBody;
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const m = String((error as { message?: unknown }).message ?? "").trim();
    if (m.length > 0 && !isGenericInvokeFailureMessage(m)) return m;
  }

  return fallback;
}
