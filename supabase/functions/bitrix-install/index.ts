import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function normalizeDomain(raw: string): string {
  const d = String(raw || "").trim();
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function extractSubdomain(domain: string): string {
  const d = normalizeDomain(domain);
  // Common case: xxx.bitrix24.ru / xxx.bitrix24.com / xxx.bitrix24.eu etc.
  return d.split(".")[0] ?? d;
}

function generateClaimToken(): string {
  // human-copyable, URL-safe token
  // Example: GRIDIX-AB12CD34EF56
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // base32 (RFC4648) without padding
  let out = "";
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  out = out.slice(0, 12);
  return `GRIDIX-${out}`;
}

async function callBitrixRest(opts: {
  domain: string;
  accessToken: string;
  method: string;
  params?: Record<string, unknown>;
}): Promise<any> {
  const domain = normalizeDomain(opts.domain);
  const url = `https://${domain}/rest/${opts.method}.json`;

  const body = new URLSearchParams();
  body.set("auth", opts.accessToken);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v === undefined) continue;
      if (v === null) {
        body.set(k, "");
        continue;
      }
      if (typeof v === "object") {
        body.set(k, JSON.stringify(v));
        continue;
      }
      body.set(k, String(v));
    }
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await resp.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!resp.ok) {
    console.error("Bitrix REST call failed", {
      url,
      status: resp.status,
      statusText: resp.statusText,
      body: text,
    });
    throw new Error(`Bitrix REST call failed: ${resp.status}`);
  }

  if (json?.error) {
    console.error("Bitrix REST returned error", { url, json });
    throw new Error(`Bitrix REST error: ${json.error}`);
  }

  return json;
}

function htmlInstallFinish(opts: {
  claimToken: string | null;
  domain: string;
  siteUrl: string;
  note?: string;
}) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Gridix • Bitrix24 install</title>
    <script src="https://api.bitrix24.com/api/v1/"></script>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #fff; }
      .wrap { max-width: 720px; margin: 24px auto; padding: 0 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
      .muted { color: #6b7280; font-size: 14px; }
      .row { display:flex; gap: 8px; margin-top: 12px; }
      input { flex:1; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      button { padding: 10px 12px; border: 1px solid #111827; background: #111827; color: #fff; border-radius: 10px; cursor: pointer; }
      button.secondary { background: #fff; color: #111827; }
      .ok { color: #16a34a; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="ok">✅ Приложение Gridix установлено в Bitrix24</div>
        <div class="muted" style="margin-top:6px">
          Домен портала: <span style="font-family: ui-monospace, monospace">${opts.domain}</span>
        </div>
        ${
          opts.note
            ? `<div class="muted" style="margin-top:8px">${opts.note}</div>`
            : `<div class="muted" style="margin-top:8px">
                Теперь откройте Gridix → Проект → Интеграции → Bitrix24 и введите Email + Token, чтобы привязать установку.
              </div>`
        }

        <div style="margin-top:12px; font-weight:600">Token для привязки</div>
        ${
          opts.claimToken
            ? `<div class="row">
                <input id="token" value="${opts.claimToken}" readonly />
                <button class="secondary" onclick="copyToken()">Скопировать</button>
              </div>`
            : `<div class="muted" style="margin-top:8px">Token не был создан (возможно, установка уже привязана).</div>`
        }

        <div class="row" style="margin-top:14px">
          <button onclick="finish()">Завершить установку</button>
        </div>
        <div class="muted" style="margin-top:10px">
          Если окно не закрывается автоматически — нажмите “Завершить установку”.
        </div>
      </div>
    </div>

    <script>
      function copyToken() {
        try {
          var el = document.getElementById('token');
          if (!el) return;
          el.focus();
          el.select();
          document.execCommand('copy');
        } catch (e) {}
      }
      function finish() {
        try {
          if (typeof BX24 !== 'undefined' && BX24 && BX24.installFinish) {
            BX24.installFinish();
          }
        } catch (e) {}
      }
      // Auto-finish after short delay as fallback.
      setTimeout(function () { finish(); }, 15000);
    </script>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = Deno.env.get("JWT_SECRET") ?? "";

  if (!siteUrl || !supabaseUrl || !serviceRoleKey) {
    console.error("Missing env configuration", {
      hasSiteUrl: !!siteUrl,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return new Response("Server configuration error", { status: 500 });
  }

  if (req.method === "GET") {
    return Response.redirect(`${siteUrl}embed/connect/bitrix24`, 302);
  }

  // Allow browser preflight / health probes (doesn't affect Bitrix server-to-server POST)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method === "HEAD") {
    return new Response(null, { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const queryParams = new URL(req.url).searchParams;

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString();
  }

  const domain = normalizeDomain(
    queryParams.get("DOMAIN") ??
      params["DOMAIN"] ??
      params["domain"] ??
      params["auth[domain]"] ??
      ""
  );
  const subdomain = extractSubdomain(domain);

  console.log("Bitrix install query params:", Object.fromEntries(queryParams.entries()));
  console.log("Bitrix install request:", params);

  const accessToken = params["AUTH_ID"];
  const refreshToken = params["REFRESH_ID"];
  const memberId = params["member_id"];
  const expiresInRaw = params["AUTH_EXPIRES"] ?? params["expires_in"];
  const expiresIn = expiresInRaw ? Number(expiresInRaw) : null;
  const tokenExpiresAt =
    typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

  if (!domain || !accessToken || !refreshToken || !memberId) {
    return new Response(
      "Invalid install request: missing DOMAIN/AUTH_ID/REFRESH_ID/member_id",
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const claimToken = generateClaimToken();

  // If the user already pre-configured Bitrix subdomain in Gridix (crm_connections exists),
  // we can attach tokens immediately without any "claim" UI step.
  const { data: existingConn, error: existingConnErr } = await supabase
    .from("crm_connections")
    .select("id,user_id")
    .eq("crm_type", "bitrix24")
    .or(`base_domain.eq.${domain},subdomain.eq.${subdomain}`)
    .maybeSingle();

  if (existingConnErr) {
    console.error("Failed to query existing crm_connection:", existingConnErr);
    return new Response("Internal error", { status: 500 });
  }

  if (existingConn?.id) {
    const { error: updateErr } = await supabase
      .from("crm_connections")
      .update({
        base_domain: domain,
        subdomain,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        bitrix_member_id: memberId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingConn.id);

    if (updateErr) {
      console.error("Failed to update crm_connection with Bitrix tokens:", updateErr);
      return new Response("Internal error", { status: 500 });
    }
  }

  // Always keep a pending token record for the "email + token" claim flow (even if a connection exists),
  // so the installer can copy the token and bind later in Gridix.
  const { error: pendingErr } = await supabase
    .from("bitrix_pending_installs")
    .upsert(
      {
        domain,
        subdomain,
        member_id: memberId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        claim_token: claimToken,
      },
      { onConflict: "member_id,domain" }
    );

  if (pendingErr) {
    console.error("Supabase upsert pending install error:", pendingErr);
    return new Response("Internal error", { status: 500 });
  }

  // Bind UI placements (left menu + deal tab)
  try {
    const projectsHandler = `${siteUrl}embed/bitrix/projects`;
    const dealTabHandler = `${siteUrl}embed/bitrix/deal-tab`;

    await callBitrixRest({
      domain,
      accessToken,
      method: "placement.bind",
      params: {
        PLACEMENT: "LEFT_MENU",
        HANDLER: projectsHandler,
        TITLE: "Проекты",
      },
    });

    await callBitrixRest({
      domain,
      accessToken,
      method: "placement.bind",
      params: {
        PLACEMENT: "CRM_DEAL_DETAIL_TAB",
        HANDLER: dealTabHandler,
        TITLE: "Gridix",
      },
    });

    // Ensure UF field exists for storing Gridix apartment id
    const ufName = "UF_GRIDIX_APARTMENT_ID";
    const ufList = await callBitrixRest({
      domain,
      accessToken,
      method: "crm.deal.userfield.list",
    });

    const exists =
      Array.isArray(ufList?.result) &&
      ufList.result.some((f: any) => String(f?.FIELD_NAME ?? "") === ufName);

    if (!exists) {
      await callBitrixRest({
        domain,
        accessToken,
        method: "crm.deal.userfield.add",
        params: {
          fields: {
            FIELD_NAME: ufName,
            EDIT_FORM_LABEL: { ru: "Gridix квартира", en: "Gridix apartment" },
            LIST_COLUMN_LABEL: { ru: "Gridix квартира", en: "Gridix apartment" },
            USER_TYPE_ID: "string",
            XML_ID: "GRIDIX_APARTMENT_ID",
            SORT: 500,
            MULTIPLE: "N",
            MANDATORY: "N",
            SHOW_FILTER: "N",
          },
        },
      });
    }

    // Bind events for deal changes (Bitrix -> Gridix sync)
    if (webhookSecret) {
      const handlerUrl = `${supabaseUrl}/functions/v1/bitrix-app?event=deal_updated&secret=${encodeURIComponent(
        webhookSecret
      )}`;

      // Best-effort: some portals/apps may not allow bind or may require additional scopes
      await callBitrixRest({
        domain,
        accessToken,
        method: "event.bind",
        params: { event: "OnCrmDealUpdate", handler: handlerUrl },
      }).catch((e) => console.warn("event.bind OnCrmDealUpdate failed:", e));

      await callBitrixRest({
        domain,
        accessToken,
        method: "event.bind",
        params: { event: "OnCrmDealAdd", handler: handlerUrl },
      }).catch((e) => console.warn("event.bind OnCrmDealAdd failed:", e));
    } else {
      console.warn("JWT_SECRET is not set; skipping event.bind");
    }
  } catch (e) {
    console.error("Bitrix placement/event/UF setup failed:", e);
    // We still finish install to avoid broken installs; user can re-install or we can add a retry action later
  }

  const note =
    existingConn?.user_id
      ? "Эта установка уже привязана к аккаунту Gridix (токены обновлены). Если нужно привязать к другому аккаунту — используйте Token ниже."
      : undefined;

  return new Response(htmlInstallFinish({ claimToken, domain, siteUrl, note }), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});