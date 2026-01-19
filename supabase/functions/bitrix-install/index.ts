// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import { createClient } from "npm:@supabase/supabase-js@2";

// TS in the web app workspace may not understand Supabase Edge runtime globals.
// In Edge runtime, `Deno` exists.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

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

  const appendParam = (sp: URLSearchParams, key: string, value: unknown) => {
    if (value === undefined) return;
    if (value === null) {
      sp.set(key, "");
      return;
    }
    if (Array.isArray(value)) {
      // Bitrix accepts JSON for arrays in many methods; keep as JSON string to avoid exploding the query.
      sp.set(key, JSON.stringify(value));
      return;
    }
    if (typeof value === "object") {
      // Bitrix often expects nested params as fields[KEY]=... instead of JSON strings.
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        appendParam(sp, `${key}[${k}]`, v);
      }
      return;
    }
    sp.set(key, String(value));
  };

  const body = new URLSearchParams();
  body.set("auth", opts.accessToken);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      appendParam(body, k, v);
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
    const desc = json?.error_description ? ` ${json.error_description}` : "";
    throw new Error(`Bitrix REST call failed: ${resp.status}${desc}`);
  }

  if (json?.error) {
    console.error("Bitrix REST returned error", { url, json });
    const desc = json?.error_description ? ` ${json.error_description}` : "";
    throw new Error(`Bitrix REST error: ${json.error}${desc}`);
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
  supabaseUrl: string;
  initiallyClaimed?: boolean;
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
      .pill { display:inline-block; padding: 4px 10px; border-radius: 999px; border: 1px solid #e5e7eb; font-size: 12px; }
      .pill.ok { border-color: rgba(22,163,74,.35); color: #16a34a; }
      .pill.wait { border-color: rgba(245,158,11,.35); color: #b45309; }
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
        <div style="margin-top:10px">
          <span id="claimStatus" class="pill wait">⏳ Ожидание привязки к аккаунту Gridix…</span>
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

        <!-- claim_token is kept in DB for support/debug, but not shown to avoid confusion with Gridix JWT token -->

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
          <button id="finishBtn" onclick="finish()" disabled>Завершить установку</button>
          <button class="secondary" onclick="checkClaim(true)">Проверить привязку</button>
        </div>
        <div class="muted" style="margin-top:10px">
          “Завершить установку” станет доступно автоматически, когда Bitrix будет привязан к аккаунту Gridix.
        </div>
      </div>
    </div>

    <script>
      var SUPABASE_URL = ${JSON.stringify(String(opts.supabaseUrl ?? ""))};
      var DOMAIN = ${JSON.stringify(String(opts.domain ?? ""))};
      var MEMBER_ID = ${JSON.stringify(String(opts.memberId ?? ""))};
      var INITIALLY_CLAIMED = ${JSON.stringify(!!opts.initiallyClaimed)};

      function setClaimUI(claimed) {
        var el = document.getElementById('claimStatus');
        var btn = document.getElementById('finishBtn');
        if (claimed) {
          if (el) { el.textContent = '✅ Bitrix привязан к аккаунту Gridix'; el.className = 'pill ok'; }
          if (btn) { btn.disabled = false; }
        } else {
          if (el) { el.textContent = '⏳ Ожидание привязки к аккаунту Gridix…'; el.className = 'pill wait'; }
          if (btn) { btn.disabled = true; }
        }
      }

      // Make sure these functions are on window so inline onclick handlers can find them.
      window.checkClaim = async function checkClaim(showAlert) {
        try {
          var base = (SUPABASE_URL || '');
          while (base.length > 0 && base.charAt(base.length - 1) === '/') base = base.slice(0, -1);
          var url = base + '/functions/v1/bitrix-app';
          var resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'install_status', domain: DOMAIN, member_id: MEMBER_ID })
          });
          var json = await resp.json().catch(function(){ return null; });
          if (!resp.ok) {
            if (showAlert) {
              alert('Не удалось проверить привязку (server error). Откройте “Войти в Gridix и подключить”, выполните привязку и повторите.');
            }
            return;
          }
          var claimed = !!(json && json.claimed);
          setClaimUI(claimed);
          if (showAlert && !claimed) {
            alert('Пока не привязано. Откройте “Войти в Gridix и подключить”, выполните привязку и повторите.');
          }
          if (claimed) {
            // Auto-finish once confirmed
            finish();
          }
        } catch (e) {
          if (showAlert) alert('Не удалось проверить привязку. Попробуйте ещё раз.');
        }
      };

      window.openAuth = function openAuth() {
        try { window.open(${JSON.stringify(String(opts.authUrl ?? ""))}, '_blank', 'noopener,noreferrer'); } catch (e) {}
      };
      window.openConnect = function openConnect() {
        try { window.open(${JSON.stringify(String(opts.connectUrl ?? ""))}, '_blank', 'noopener,noreferrer'); } catch (e) {}
      };
      window.finish = function finish() {
        try {
          if (typeof BX24 !== 'undefined' && BX24 && BX24.installFinish) {
            BX24.installFinish();
          }
        } catch (e) {}
      };

      // Poll claim status while the installer page is open.
      setClaimUI(INITIALLY_CLAIMED);
      if (INITIALLY_CLAIMED) {
        // If already claimed (e.g. reinstall), finish immediately.
        setTimeout(function(){ window.finish(); }, 250);
      } else {
        setTimeout(function(){ window.checkClaim(false); }, 800);
      }
      setInterval(function(){ window.checkClaim(false); }, 4000);
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

  // If a Bitrix portal was already connected earlier, try to update its tokens.
  // IMPORTANT: the DB may contain duplicates from older versions; never use maybeSingle() without limit(1).
  const { data: existingConn, error: existingConnErr } = await supabase
    .from("crm_connections")
    .select("id,user_id,updated_at")
    .eq("crm_type", "bitrix24")
    .or(`bitrix_member_id.eq.${memberId},base_domain.eq.${domain},subdomain.eq.${subdomain}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingConnErr) {
    console.error("Failed to query existing crm_connection:", existingConnErr);
    // Do NOT fail install; we can still store pending install and let user claim later.
  } else if (existingConn?.id) {
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
      // Do NOT fail install; user can re-install or claim again.
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
      const msg = e instanceof Error ? e.message : String(e);
      const already = /already binded/i.test(msg);
      setupResults.push({
        title: "Размещение в левом меню (LEFT_MENU)",
        ok: already ? true : false,
        details: already ? "Уже привязано (ok)" : msg,
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
      const msg = e instanceof Error ? e.message : String(e);
      const already = /already binded/i.test(msg);
      setupResults.push({
        title: "Вкладка в сделке (CRM_DEAL_DETAIL_TAB)",
        ok: already ? true : false,
        details: already ? "Уже привязано (ok)" : msg,
      });
    }

    // Ensure UF field exists for storing Gridix apartment id
    // Bitrix uses UF_CRM_* prefix for CRM entity userfields.
    const ufName = "UF_CRM_GRIDIX_APARTMENT_ID";
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
      const msg = e instanceof Error ? e.message : String(e);
      const alreadyExists = /уже существует/i.test(msg) || /already exists/i.test(msg);
      setupResults.push({
        title: `Пользовательское поле сделки (${ufName})`,
        ok: alreadyExists ? true : false,
        details: alreadyExists ? "Уже существует (ok)" : msg,
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
        const msg = e instanceof Error ? e.message : String(e);
        const already = /already binded/i.test(msg);
        setupResults.push({
          title: "Webhook: OnCrmDealUpdate",
          ok: already ? true : false,
          details: already ? "Уже привязано (ok)" : msg,
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
        const msg = e instanceof Error ? e.message : String(e);
        const already = /already binded/i.test(msg);
        setupResults.push({
          title: "Webhook: OnCrmDealAdd",
          ok: already ? true : false,
          details: already ? "Уже привязано (ok)" : msg,
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

  // Confirm claim status using the same criteria as bitrix-app install_status.
  const { data: claimedConn } = await supabase
    .from("crm_connections")
    .select("id,user_id,updated_at")
    .eq("crm_type", "bitrix24")
    .eq("base_domain", domain)
    .eq("bitrix_member_id", memberId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initiallyClaimed = !!claimedConn?.user_id;
  const note = initiallyClaimed
    ? "Эта установка уже привязана к аккаунту Gridix (токены обновлены). Установка будет завершена автоматически."
    : undefined;

  return new Response(
    htmlInstallFinish({
      claimToken,
      domain,
      memberId,
      siteUrl: baseSiteUrl,
      connectUrl,
      authUrl,
      supabaseUrl,
      initiallyClaimed,
      note,
      setupResults,
    }),
    {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
});