import type { SupabaseClientType } from "@/shared/api/supabase";
import type { Json } from "@gridix/types/database";

/** Логический владелец кабинета (см. `useAdminDashboardController`: manager mode → developerId, иначе user.id). */
export type EffectiveOwnerId = string;

export type AdminChecklistDerivedProgress = {
  projectCreated: boolean;
  crmConnected: boolean;
  /** После успешного ответа по CRM — источник правды для шага CRM; иначе можно опираться на localStorage. */
  crmQuerySucceeded: boolean;
  billingTouched: boolean;
  /** После успешного ответа по подписке — источник правды для шага billing; иначе можно опираться на localStorage. */
  billingQuerySucceeded: boolean;
};

export type ProjectChecklistDerivedProgress = {
  projectBasicInfoReady: boolean;
  projectFacadeConfigured: boolean;
  projectFirstApartmentCreated: boolean;
  /** Имеет смысл только для `project_type === "building"`; для `object` вызывающий может игнорировать. */
  projectFloorplanUploaded: boolean;
};

const PAID_SUBSCRIPTION_STATUSES = ["active"] as const;

// --- Pure predicates (совпадают с триггерами в UI, см. docs/usertour-checklist-events.md) ---

export function isProjectBasicInfoReadyPredicate(project: {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pdf_presentation_url: string | null;
}): boolean {
  const hasAddress =
    typeof project.address === "string" && project.address.trim().length > 0;
  const hasLat =
    typeof project.latitude === "number" && !Number.isNaN(project.latitude);
  const hasLon =
    typeof project.longitude === "number" && !Number.isNaN(project.longitude);
  const hasPdf =
    typeof project.pdf_presentation_url === "string" &&
    project.pdf_presentation_url.length > 0;
  return hasAddress && hasLat && hasLon && hasPdf;
}

export function polygonJsonHasPoints(polygon: Json | null): boolean {
  if (polygon == null) return false;
  return Array.isArray(polygon) && polygon.length > 0;
}

/**
 * Для `object` полигоны на фасаде могут не использоваться — этап считаем выполненным (N/A),
 * чтобы не показывать ложное «не готово» (см. план onboarding checklist).
 */
export function isProjectFacadeConfiguredPredicate(params: {
  projectType: string;
  buildingImageUrl: string | null;
  facadeImageUrl: string | null;
  hasPolygonFloor: boolean;
}): boolean {
  if (params.projectType === "object") return true;
  const hasImage = !!(
    (params.facadeImageUrl && params.facadeImageUrl.length > 0) ||
    (params.buildingImageUrl && params.buildingImageUrl.length > 0)
  );
  return hasImage && params.hasPolygonFloor;
}

export function isUserSubscriptionBillingTouched(row: {
  invoice_requested_at: string | null;
  invoice_paid_at: string | null;
  status: string;
  current_period_end: string | null;
}): boolean {
  if (row.invoice_requested_at != null || row.invoice_paid_at != null) {
    return true;
  }
  if (
    !PAID_SUBSCRIPTION_STATUSES.includes(
      row.status as (typeof PAID_SUBSCRIPTION_STATUSES)[number],
    )
  ) {
    return false;
  }
  const periodEnd = row.current_period_end
    ? new Date(row.current_period_end).getTime()
    : null;
  const hasPaidAccess = periodEnd === null || periodEnd > Date.now();
  return hasPaidAccess;
}

/** Как `useAmoCRMConnection`: живые access + refresh. */
export function isAmoCrmRowLive(row: {
  access_token: string | null;
  refresh_token: string | null;
}): boolean {
  return !!(row.access_token && row.refresh_token);
}

export function isBitrix24CrmRowLive(row: {
  bitrix_member_id: string | null;
  refresh_token: string | null;
}): boolean {
  return !!(
    (typeof row.bitrix_member_id === "string" &&
      row.bitrix_member_id.length > 0) ||
    (typeof row.refresh_token === "string" && row.refresh_token.length > 0)
  );
}

export function isCrmConnectionRowLive(row: {
  crm_type: string;
  access_token: string | null;
  refresh_token: string | null;
  bitrix_member_id: string | null;
}): boolean {
  if (row.crm_type === "amocrm") return isAmoCrmRowLive(row);
  if (row.crm_type === "bitrix24") return isBitrix24CrmRowLive(row);
  return !!(
    (row.refresh_token && row.refresh_token.length > 0) ||
    (row.access_token && row.access_token.length > 0)
  );
}

// --- Fetches ---

const emptyAdminProgress: AdminChecklistDerivedProgress = {
  projectCreated: false,
  crmConnected: false,
  crmQuerySucceeded: false,
  billingTouched: false,
  billingQuerySucceeded: false,
};

const emptyProjectProgress: ProjectChecklistDerivedProgress = {
  projectBasicInfoReady: false,
  projectFacadeConfigured: false,
  projectFirstApartmentCreated: false,
  projectFloorplanUploaded: false,
};

/**
 * Прогресс чеклиста аккаунта из БД по `effectiveOwnerId` (не текущему session user при manager mode).
 */
export async function fetchAdminChecklistDerived(
  client: SupabaseClientType,
  effectiveOwnerId: EffectiveOwnerId | null | undefined,
): Promise<AdminChecklistDerivedProgress> {
  if (!effectiveOwnerId) return { ...emptyAdminProgress };

  const [projectsRes, crmRes, subsRes] = await Promise.all([
    client
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", effectiveOwnerId),
    client
      .from("crm_connections")
      .select("crm_type, access_token, refresh_token, bitrix_member_id")
      .eq("user_id", effectiveOwnerId),
    client
      .from("user_subscriptions")
      .select(
        "invoice_requested_at, invoice_paid_at, status, current_period_end",
      )
      .eq("user_id", effectiveOwnerId),
  ]);

  const projectCreated = !projectsRes.error && (projectsRes.count ?? 0) > 0;

  const crmConnected =
    !crmRes.error &&
    (crmRes.data?.some((row) => isCrmConnectionRowLive(row)) ?? false);

  const crmQuerySucceeded = !crmRes.error;

  const billingTouched =
    !subsRes.error &&
    (subsRes.data?.some((row) => isUserSubscriptionBillingTouched(row)) ??
      false);

  const billingQuerySucceeded = !subsRes.error;

  return {
    projectCreated,
    crmConnected,
    crmQuerySucceeded,
    billingTouched,
    billingQuerySucceeded,
  };
}

/**
 * Прогресс чеклиста проекта из БД по `projectId`.
 */
export async function fetchProjectChecklistDerived(
  client: SupabaseClientType,
  projectId: string | null | undefined,
): Promise<ProjectChecklistDerivedProgress> {
  if (!projectId) return { ...emptyProjectProgress };

  const projectRes = await client
    .from("projects")
    .select(
      "address, latitude, longitude, pdf_presentation_url, building_image_url, project_type",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projectRes.error || !projectRes.data) {
    return { ...emptyProjectProgress };
  }

  const project = projectRes.data;
  const projectBasicInfoReady = isProjectBasicInfoReadyPredicate(project);

  const [apartmentsRes, floorPlansRes, facadesRes, floorsRes] =
    await Promise.all([
      client
        .from("apartments")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      client
        .from("floor_plans")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .not("image_url", "is", null)
        .neq("image_url", ""),
      client
        .from("project_facades")
        .select("image_url")
        .eq("project_id", projectId)
        .not("image_url", "is", null)
        .neq("image_url", "")
        .limit(1),
      client
        .from("building_floors")
        .select("polygon")
        .eq("project_id", projectId),
    ]);

  const projectFirstApartmentCreated =
    !apartmentsRes.error && (apartmentsRes.count ?? 0) > 0;

  const projectFloorplanUploaded =
    !floorPlansRes.error && (floorPlansRes.count ?? 0) > 0;

  const facadeImageUrl =
    facadesRes.data?.[0]?.image_url != null &&
    String(facadesRes.data[0].image_url).length > 0
      ? String(facadesRes.data[0].image_url)
      : null;

  const hasPolygonFloor =
    !floorsRes.error &&
    (floorsRes.data?.some((row) => polygonJsonHasPoints(row.polygon)) ?? false);

  const projectFacadeConfigured = isProjectFacadeConfiguredPredicate({
    projectType: project.project_type,
    buildingImageUrl: project.building_image_url,
    facadeImageUrl,
    hasPolygonFloor,
  });

  return {
    projectBasicInfoReady,
    projectFacadeConfigured,
    projectFirstApartmentCreated,
    projectFloorplanUploaded,
  };
}
