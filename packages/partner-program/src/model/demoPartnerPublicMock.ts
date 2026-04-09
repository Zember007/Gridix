/**
 * Демо-витрина партнёрки: моковые «аккаунты» клиентов (реферальные / управляемые)
 * и нижние пороги для метрик, если API вернул пусто.
 * Используется только при user_profiles.is_demo = true (см. applyDemoPartnerStatsOverlay).
 */
import type { PartnerClient, PartnerIncomePoint, PartnerStats } from "./types";

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86400000).toISOString();

const futureIso = (days: number): string =>
  new Date(Date.now() + days * 86400000).toISOString();

/** Стабильные UUID только для отображения (не ссылаются на реальные auth.users). */
const PID = (n: string) => `00000000-0000-7000-8000-${n.padStart(12, "0")}`;

/**
 * Список клиентов для вкладок «Клиенты» / карточек в демо-аккаунте партнёра.
 */
export function getDemoPartnerClientsMock(): PartnerClient[] {
  return [
    {
      id: PID("000000000001"),
      type: "referral",
      status: "active",
      created_at: isoDaysAgo(52),
      client_id: PID("000000000101"),
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "gridix_demo_seed",
      subscription_status: "active",
      subscription_expires_at: futureIso(300),
      user_profiles: {
        id: PID("000000000101"),
        full_name: "Marina Orlov",
        email: "marina.orlov@demo.gridix",
      },
      projects: [
        {
          id: PID("000000000201"),
          name: "Skyline Residence",
          subscription_status: "active",
          subscription_expires_at: futureIso(280),
        },
      ],
    },
    {
      id: PID("000000000002"),
      type: "referral",
      status: "active",
      created_at: isoDaysAgo(41),
      client_id: PID("000000000102"),
      utm_source: "telegram",
      utm_medium: "social",
      utm_campaign: "gridix_demo_seed",
      subscription_status: "active",
      subscription_expires_at: futureIso(120),
      user_profiles: {
        id: PID("000000000102"),
        full_name: "David Cohen",
        email: "d.cohen@demo.gridix",
      },
      projects: [
        {
          id: PID("000000000202"),
          name: "Marina Towers",
          subscription_status: "active",
          subscription_expires_at: futureIso(100),
        },
      ],
    },
    {
      id: PID("000000000003"),
      type: "referral",
      status: "active",
      created_at: isoDaysAgo(36),
      client_id: PID("000000000103"),
      utm_source: "direct",
      utm_medium: "referral",
      utm_campaign: "gridix_demo_seed",
      subscription_status: "trialing",
      subscription_expires_at: futureIso(10),
      user_profiles: {
        id: PID("000000000103"),
        full_name: "Sofia Rossi",
        email: "s.rossi@demo.gridix",
      },
      projects: [
        {
          id: PID("000000000203"),
          name: "Harbor View",
          subscription_status: "trialing",
          subscription_expires_at: futureIso(10),
        },
      ],
    },
    {
      id: PID("000000000004"),
      type: "referral",
      status: "active",
      created_at: isoDaysAgo(28),
      client_id: PID("000000000104"),
      utm_source: "youtube",
      utm_medium: "cpc",
      utm_campaign: "spring_promo",
      subscription_status: "active",
      subscription_expires_at: futureIso(200),
      user_profiles: {
        id: PID("000000000104"),
        full_name: "James Wright",
        email: "j.wright@demo.gridix",
      },
      projects: [
        {
          id: PID("000000000204"),
          name: "Parkside",
          subscription_status: "active",
          subscription_expires_at: futureIso(190),
        },
      ],
    },
    {
      id: PID("000000000005"),
      type: "referral",
      status: "active",
      created_at: isoDaysAgo(19),
      client_id: PID("000000000105"),
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "brand_search",
      subscription_status: "active",
      subscription_expires_at: futureIso(365),
      user_profiles: {
        id: PID("000000000105"),
        full_name: "Elena Petrov",
        email: "e.petrov@demo.gridix",
      },
      projects: [
        {
          id: PID("000000000205"),
          name: "City Garden",
          subscription_status: "active",
          subscription_expires_at: futureIso(350),
        },
      ],
    },
    {
      id: PID("000000000006"),
      type: "managed",
      status: "active",
      created_at: isoDaysAgo(44),
      client_id: PID("000000000106"),
      utm_source: "email_newsletter",
      utm_medium: "email",
      utm_campaign: "gridix_demo_seed",
      subscription_status: "active",
      subscription_expires_at: futureIso(400),
      user_profiles: {
        id: PID("000000000106"),
        full_name: "Integrator North LLC",
        email: "sales@integrator-north.demo.gridix",
      },
      projects: [
        {
          id: PID("000000000206"),
          name: "Client portfolio A",
          subscription_status: "active",
          subscription_expires_at: futureIso(380),
        },
        {
          id: PID("000000000207"),
          name: "Client portfolio B",
          subscription_status: "active",
          subscription_expires_at: futureIso(200),
        },
      ],
    },
    {
      id: PID("000000000007"),
      type: "managed",
      status: "active",
      created_at: isoDaysAgo(22),
      client_id: PID("000000000107"),
      utm_source: "facebook",
      utm_medium: "social",
      utm_campaign: "gridix_demo_seed",
      subscription_status: "active",
      subscription_expires_at: futureIso(150),
      user_profiles: {
        id: PID("000000000107"),
        full_name: "Studio Partner Co.",
        email: "hello@studio-partner.demo.gridix",
      },
      projects: [
        {
          id: PID("000000000208"),
          name: "Lakeside",
          subscription_status: "active",
          subscription_expires_at: futureIso(140),
        },
      ],
    },
    {
      id: PID("000000000008"),
      type: "managed",
      status: "active",
      created_at: isoDaysAgo(11),
      client_id: PID("000000000108"),
      utm_source: "blog",
      utm_medium: "organic",
      utm_campaign: "review_article",
      subscription_status: "trialing",
      subscription_expires_at: futureIso(12),
      user_profiles: {
        id: PID("000000000108"),
        full_name: "Urban Dev Agency",
        email: "contact@urban-dev.demo.gridix",
      },
      projects: [
        {
          id: PID("000000000209"),
          name: "Riverside",
          subscription_status: "trialing",
          subscription_expires_at: futureIso(12),
        },
      ],
    },
  ];
}

function sumTraffic(
  rows: Array<{ source: string; count: number }> | undefined,
): number {
  if (!rows?.length) return 0;
  return rows.reduce((s, x) => s + x.count, 0);
}

/** Запасной график дохода за 30 дней (если API вернул слишком мало точек). */
export function buildDemoIncomeHistoryFallback(): PartnerIncomePoint[] {
  const out: PartnerIncomePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const wave = 55 + Math.sin(i / 3.2) * 42 + ((29 - i) % 9) * 9;
    out.push({ date: key, amount: Math.round(wave * 100) / 100 });
  }
  return out;
}

/** Демо-график: если серия есть, но «плоская» (мало ненулевых дней / низкая сумма), подменяем на волну. */
export function resolveDemoIncomeHistoryForChart(
  baseHistory: PartnerIncomePoint[] | undefined | null,
): PartnerIncomePoint[] {
  const raw = baseHistory ?? [];
  const minLen = 20;
  const minTotal = 280;
  const minNonZeroDays = 5;

  if (raw.length < minLen) {
    return buildDemoIncomeHistoryFallback();
  }

  const total = raw.reduce((s, p) => s + (p.amount ?? 0), 0);
  const nonZeroDays = raw.filter((p) => (p.amount ?? 0) > 1e-6).length;

  if (total >= minTotal && nonZeroDays >= minNonZeroDays) {
    return raw;
  }

  return buildDemoIncomeHistoryFallback();
}

const DEMO_TRAFFIC_FALLBACK = {
  by_source: [
    { source: "instagram", count: 148 },
    { source: "direct", count: 96 },
    { source: "telegram", count: 72 },
    { source: "youtube", count: 58 },
    { source: "google", count: 44 },
    { source: "email_newsletter", count: 32 },
  ],
  by_medium: [
    { source: "social", count: 210 },
    { source: "cpc", count: 102 },
    { source: "referral", count: 88 },
    { source: "email", count: 36 },
    { source: "organic", count: 28 },
  ],
  by_campaign: [
    { source: "gridix_demo_seed", count: 176 },
    { source: "spring_promo", count: 62 },
    { source: "brand_search", count: 48 },
    { source: "review_article", count: 34 },
  ],
};

const DEMO_FUNNEL_FLOORS = {
  minClicks: 620,
  minRegistrations: 38,
  minPaying: 12,
  minEarned: 14200,
};

/**
 * Объединяет ответ edge `get_stats` с демо-витриной: список клиентов — только мок;
 * клики / источники / воронка / доход — max(API, порог), график — из API или fallback.
 */
export function applyDemoPartnerStatsOverlay(
  base: PartnerStats,
  isDemo: boolean,
): PartnerStats {
  if (!isDemo) return base;

  const mockClients = getDemoPartnerClientsMock();
  const referralN = mockClients.filter((c) => c.type === "referral").length;
  const managedN = mockClients.filter((c) => c.type === "managed").length;

  const income = resolveDemoIncomeHistoryForChart(base.income_history);

  const income30 = income.reduce((s, x) => s + x.amount, 0);
  const earned = Math.max(
    base.total_earned ?? 0,
    DEMO_FUNNEL_FLOORS.minEarned,
    income30,
  );
  const withdrawn = base.total_withdrawn ?? 0;
  const available = Math.max(
    base.available_for_withdrawal ?? 0,
    earned - withdrawn,
  );

  const hasApiTraffic = sumTraffic(base.traffic_by_source) > 0;
  const trafficBySource = hasApiTraffic
    ? base.traffic_by_source!
    : DEMO_TRAFFIC_FALLBACK.by_source;
  const trafficByMedium =
    hasApiTraffic && (base.traffic_by_medium?.length ?? 0) > 0
      ? base.traffic_by_medium!
      : DEMO_TRAFFIC_FALLBACK.by_medium;
  const trafficByCampaign =
    hasApiTraffic && (base.traffic_by_campaign?.length ?? 0) > 0
      ? base.traffic_by_campaign!
      : DEMO_TRAFFIC_FALLBACK.by_campaign;

  return {
    ...base,
    total_clients: Math.max(base.total_clients ?? 0, mockClients.length),
    referral_clients: Math.max(base.referral_clients ?? 0, referralN),
    managed_clients: Math.max(base.managed_clients ?? 0, managedN),
    total_clicks: Math.max(
      base.total_clicks ?? 0,
      DEMO_FUNNEL_FLOORS.minClicks,
    ),
    funnel_registrations: Math.max(
      base.funnel_registrations ?? base.total_clients ?? 0,
      DEMO_FUNNEL_FLOORS.minRegistrations,
    ),
    funnel_paying_clients: Math.max(
      base.funnel_paying_clients ?? 0,
      DEMO_FUNNEL_FLOORS.minPaying,
    ),
    total_earned: earned,
    available_for_withdrawal: available,
    income_history: income,
    traffic_by_source: trafficBySource,
    traffic_by_medium: trafficByMedium,
    traffic_by_campaign: trafficByCampaign,
    clients: mockClients as PartnerStats["clients"],
  };
}

/** Для usePartnerClients: тот же список, что и в карточке статистики. */
export function applyDemoPartnerClientsOverlay(
  apiClients: PartnerClient[],
  isDemo: boolean,
): PartnerClient[] {
  if (!isDemo) return apiClients;
  return getDemoPartnerClientsMock();
}
