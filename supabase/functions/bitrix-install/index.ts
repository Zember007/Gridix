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

type SetupResult = { title: string; ok: boolean; details?: string };

function htmlInstallFinish(opts: {
  claimToken: string | null;
  domain: string;
  memberId: string;
  siteUrl: string;
  connectUrl: string;
  authUrl: string;
  note?: string;
  setupResults?: SetupResult[];
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
      .row { display:flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
      input { flex:1; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      button { padding: 10px 12px; border: 1px solid #111827; background: #111827; color: #fff; border-radius: 10px; cursor: pointer; }
      button.secondary { background: #fff; color: #111827; }
      .ok { color: #16a34a; font-weight: 600; }
      .bad { color: #dc2626; font-weight: 600; }
      .list { margin-top: 10px; padding-left: 18px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>
  
    <div class="wrap">
      <div class="card">
        <div class="ok">✅ Приложение Gridix установлено в Bitrix24</div>
        <div class="muted" style="margin-top:6px">
          Домен портала: <span style="font-family: ui-monospace, monospace">${opts.domain}</span>
        </div>
        <div class="muted" style="margin-top:6px">
          member_id: <span class="mono">${opts.memberId}</span>
        </div>
        ${
          opts.note
            ? `<div class="muted" style="margin-top:8px">${opts.note}</div>`
            : `<div class="muted" style="margin-top:8px">
                Чтобы завершить подключение, войдите в Gridix и привяжите установку к аккаунту.
              </div>`
        }

        <div style="margin-top:12px; font-weight:600">Подключение</div>
        <div class="row">
          <button onclick="openAuth()">Войти в Gridix и подключить</button>
          <button class="secondary" onclick="openConnect()">Открыть страницу подключения</button>
        </div>
        <div class="muted" style="margin-top:8px">
          Если вы ещё не вошли в Gridix — используйте “Войти в Gridix и подключить”. Если уже вошли — достаточно “Открыть страницу подключения”.
        </div>

        <div style="margin-top:12px; font-weight:600">Token для привязки</div>
        ${
          opts.claimToken
            ? `<div class="row">
                <input id="token" value="${opts.claimToken}" readonly />
                <button class="secondary" onclick="copyToken()">Скопировать</button>
              </div>`
            : `<div class="muted" style="margin-top:8px">Token не был создан (возможно, установка уже привязана).</div>`
        }

        ${
          Array.isArray(opts.setupResults) && opts.setupResults.length > 0
            ? `<div style="margin-top:14px; font-weight:600">Диагностика установки</div>
               <ul class="list">
                 ${opts.setupResults
                   .map((r) => {
                     const status = r.ok ? '✅' : '❌';
                     const cls = r.ok ? 'muted' : 'bad';
                     const details = r.details ? `<div class="muted" style="margin-top:4px">${r.details}</div>` : '';
                     return `<li class="${cls}">${status} ${r.title}${details}</li>`;
                   })
                   .join('')}
               </ul>`
            : ``
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
      function openAuth() {
        try { window.open(${JSON.stringify(opts.authUrl)}, '_blank', 'noopener,noreferrer'); } catch (e) {}
      }
      function openConnect() {
        try { window.open(${JSON.stringify(opts.connectUrl)}, '_blank', 'noopener,noreferrer'); } catch (e) {}
      }
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
  const baseSiteUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;

  if (!siteUrl || !supabaseUrl || !serviceRoleKey) {
    console.error("Missing env configuration", {
      hasSiteUrl: !!siteUrl,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return new Response("Server configuration error", { status: 500 });
  }
  console.log("req.method", req.method);
  if (req.method === "GET") {
    return Response.redirect(`${baseSiteUrl}embed/connect/bitrix24`, 302);
  }

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
  const connectUrl = `${baseSiteUrl}embed/connect/bitrix24?domain=${encodeURIComponent(domain)}&member_id=${encodeURIComponent(memberId)}`;
  const authUrl = `${baseSiteUrl}ru/auth?redirect=${encodeURIComponent(
    `/embed/connect/bitrix24?domain=${encodeURIComponent(domain)}&member_id=${encodeURIComponent(memberId)}`
  )}`;

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

  // Bind UI placements (left menu + deal tab) + UF field + events (best effort)
  const setupResults: SetupResult[] = [];
  try {
    const projectsHandler = `${baseSiteUrl}embed/bitrix/projects`;
    const dealTabHandler = `${baseSiteUrl}embed/bitrix/deal-tab`;

    try {
      await callBitrixRest({
        domain,
        accessToken,
        method: "placement.bind",
        params: { PLACEMENT: "LEFT_MENU", HANDLER: projectsHandler, TITLE: "Проекты" },
      });
      setupResults.push({ title: "Размещение в левом меню (LEFT_MENU)", ok: true });
    } catch (e) {
      setupResults.push({
        title: "Размещение в левом меню (LEFT_MENU)",
        ok: false,
        details: e instanceof Error ? e.message : String(e),
      });
    }

    try {
      await callBitrixRest({
        domain,
        accessToken,
        method: "placement.bind",
        params: { PLACEMENT: "CRM_DEAL_DETAIL_TAB", HANDLER: dealTabHandler, TITLE: "Gridix" },
      });
      setupResults.push({ title: "Вкладка в сделке (CRM_DEAL_DETAIL_TAB)", ok: true });
    } catch (e) {
      setupResults.push({
        title: "Вкладка в сделке (CRM_DEAL_DETAIL_TAB)",
        ok: false,
        details: e instanceof Error ? e.message : String(e),
      });
    }

    // Ensure UF field exists for storing Gridix apartment id
    const ufName = "UF_GRIDIX_APARTMENT_ID";
    try {
      const ufList = await callBitrixRest({
        domain,
        accessToken,
        method: "crm.deal.userfield.list",
      });

      const exists =
        Array.isArray(ufList?.result) &&
        ufList.result.some((f: any) => String(f?.FIELD_NAME ?? "") === ufName);

      if (exists) {
        setupResults.push({ title: `Пользовательское поле сделки уже существует (${ufName})`, ok: true });
      } else {
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
        setupResults.push({ title: `Создание пользовательского поля сделки (${ufName})`, ok: true });
      }
    } catch (e) {
      setupResults.push({
        title: "Пользовательское поле сделки (UF_GRIDIX_APARTMENT_ID)",
        ok: false,
        details: e instanceof Error ? e.message : String(e),
      });
    }

    // Bind events for deal changes (Bitrix -> Gridix sync)
    if (webhookSecret) {
      const handlerUrl = `${supabaseUrl}/functions/v1/bitrix-app?event=deal_updated&secret=${encodeURIComponent(
        webhookSecret
      )}`;

      try {
        await callBitrixRest({
          domain,
          accessToken,
          method: "event.bind",
          params: { event: "OnCrmDealUpdate", handler: handlerUrl },
        });
        setupResults.push({ title: "Webhook: OnCrmDealUpdate", ok: true });
      } catch (e) {
        setupResults.push({
          title: "Webhook: OnCrmDealUpdate",
          ok: false,
          details: e instanceof Error ? e.message : String(e),
        });
      }

      try {
        await callBitrixRest({
          domain,
          accessToken,
          method: "event.bind",
          params: { event: "OnCrmDealAdd", handler: handlerUrl },
        });
        setupResults.push({ title: "Webhook: OnCrmDealAdd", ok: true });
      } catch (e) {
        setupResults.push({
          title: "Webhook: OnCrmDealAdd",
          ok: false,
          details: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      console.warn("JWT_SECRET is not set; skipping event.bind");
      setupResults.push({
        title: "Webhook: события сделок (event.bind)",
        ok: false,
        details: "JWT_SECRET не задан — синхронизация стадий Bitrix → Gridix работать не будет",
      });
    }
  } catch (e) {
    console.error("Bitrix placement/event/UF setup failed:", e);
    setupResults.push({
      title: "Инициализация интеграции в Bitrix (placement/UF/webhooks)",
      ok: false,
      details: e instanceof Error ? e.message : String(e),
    });
    // We still finish install to avoid broken installs; user can re-install later
  }

  const note =
    existingConn?.user_id
      ? "Эта установка уже привязана к аккаунту Gridix (токены обновлены). Если нужно привязать к другому аккаунту — используйте Token ниже."
      : undefined;

  return new Response(
    htmlInstallFinish({
      claimToken,
      domain,
      memberId,
      siteUrl: baseSiteUrl,
      connectUrl,
      authUrl,
      note,
      setupResults,
    }),
    {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
});