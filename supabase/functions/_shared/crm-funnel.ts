/**
 * Shared funnel synchronization helpers for external CRMs (AmoCRM / Bitrix24)
 *
 * Schema (after 2026-01-19 migration):
 * - crm_funnels.crm_funnel_id: external funnel id (Amo pipeline id / Bitrix category id)
 * - crm_funnel_stages.crm_stage_id: external stage id (TEXT; Amo status id stringified / Bitrix stage id)
 * - crm_funnel_stages.crm_funnel_id / crm_pipeline_id: external funnel id (number, duplicated for backward compat)
 */

import { syncCrmFunnelStages } from "./crm-funnel-sync.ts";

export interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
  statuses: AmoCRMStatus[];
}

export interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  type: number;
  pipeline_id: number;
}

export type BitrixStage = {
  stageId: string;
  name: string;
  sort: number;
  color?: string;
};

/**
 * Maps AmoCRM color hex codes to Tailwind color names
 */
export function mapAmoCRMColorToTailwind(amoColor: string): string {
  const colorMap: Record<string, string> = {
    "#fffeb2": "yellow",
    "#fffd7f": "yellow",
    "#ff8a00": "orange",
    "#e6e8ff": "blue",
    "#c1e0ff": "blue",
    "#99ccff": "blue",
    "#d6f9dd": "green",
    "#ccff66": "green",
    "#ace2ce": "green",
    "#ffc8c8": "red",
    "#ff8f92": "red",
    "#eb93ff": "purple",
    "#ccc8f9": "purple",
    "#d5d8dd": "slate",
  };
  return colorMap[String(amoColor || "").toLowerCase()] || "slate";
}

/**
 * AmoCRM: creates or updates a local funnel based on AmoCRM pipeline data.
 *
 * Kept signature for existing callers.
 */
export async function createOrUpdateLocalFunnel(
  projectId: string,
  userId: string,
  amoPipeline: AmoCRMPipeline,
  svc: any
): Promise<void> {
  // Check if funnel already exists for this user and AmoCRM pipeline.
  const { data: existingFunnel } = await svc
    .from("crm_funnels")
    // Keep legacy columns in select to support older DBs during rollout.
    .select("id, name, project_id, crm_funnel_id, amocrm_pipeline_id")
    .eq("user_id", userId)
    .or(`crm_funnel_id.eq.${amoPipeline.id},amocrm_pipeline_id.eq.${amoPipeline.id}`)
    .maybeSingle();

  const sortedStatuses = [...amoPipeline.statuses].sort((a, b) => a.sort - b.sort);

  let funnelId: string;
  if (existingFunnel) {
    funnelId = existingFunnel.id;
    const funnelPatch: Record<string, unknown> = {
      crm_funnel_id: amoPipeline.id,
      amocrm_pipeline_id: amoPipeline.id,
      project_id: null,
      updated_at: new Date().toISOString(),
    };
    if (existingFunnel.name !== amoPipeline.name) funnelPatch.name = amoPipeline.name;
    await svc.from("crm_funnels").update(funnelPatch).eq("id", funnelId);
  } else {
    const { data: newFunnel, error } = await svc
      .from("crm_funnels")
      .insert({
        user_id: userId,
        project_id: null,
        name: amoPipeline.name,
        crm_funnel_id: amoPipeline.id,
        amocrm_pipeline_id: amoPipeline.id,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !newFunnel?.id) throw new Error("Failed to create funnel");
    funnelId = newFunnel.id;
  }

  await syncCrmFunnelStages({
    svc,
    funnelId,
    externalFunnelId: amoPipeline.id,
    stages: sortedStatuses.map((s) => ({
      externalId: String(s.id),
      name: s.name,
      sort: s.sort,
      color: mapAmoCRMColorToTailwind(s.color),
    })),
  });
}

/**
 * Bitrix24: creates/updates a project-bound local funnel and maintains `bitrix_stage_mapping`.
 * Returns { funnelId, firstStageId } where firstStageId is Bitrix stage_id to use for new deals.
 */
export async function createOrUpdateBitrixProjectFunnel(opts: {
  projectId: string;
  userId: string;
  categoryId: number;
  categoryName: string;
  stages: BitrixStage[];
  svc: any;
}): Promise<{ funnelId: string; firstStageId: string }> {
  const stagesSorted = [...opts.stages].sort((a, b) => a.sort - b.sort);
  if (stagesSorted.length === 0) throw new Error("No stages to sync");

  const desiredName = `Bitrix: ${opts.categoryName}`;

  // Bitrix funnels should be shared across projects:
  // one funnel per (user_id + categoryId). We keep project-scoped funnels only as legacy data and
  // "promote" the first found one to project_id = NULL so ids remain stable.
  let existingFunnel: any | null = null;
  const { data: sharedById } = await opts.svc
    .from("crm_funnels")
    .select("id, name, project_id, crm_funnel_id")
    .eq("user_id", opts.userId)
    .eq("crm_funnel_id", opts.categoryId)
    .is("project_id", null)
    .limit(1)
    .maybeSingle();
  existingFunnel = sharedById ?? null;

  if (!existingFunnel) {
    // Any funnel (legacy per-project) with the same external id — we'll promote it to shared.
    const { data: anyById } = await opts.svc
      .from("crm_funnels")
      .select("id, name, project_id, crm_funnel_id")
      .eq("user_id", opts.userId)
      .eq("crm_funnel_id", opts.categoryId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingFunnel = anyById ?? null;
  }

  if (!existingFunnel) {
    const { data: sharedByName } = await opts.svc
      .from("crm_funnels")
      .select("id, name, project_id, crm_funnel_id")
      .eq("user_id", opts.userId)
      .eq("name", desiredName)
      .is("project_id", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingFunnel = sharedByName ?? null;
  }

  if (!existingFunnel) {
    // Legacy per-project funnel by name (common in old installs) — promote to shared.
    const { data: anyByName } = await opts.svc
      .from("crm_funnels")
      .select("id, name, project_id, crm_funnel_id")
      .eq("user_id", opts.userId)
      .eq("name", desiredName)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingFunnel = anyByName ?? null;
  }

  let funnelId: string;
  if (existingFunnel?.id) {
    funnelId = String(existingFunnel.id);
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      crm_funnel_id: opts.categoryId,
      project_id: null, // promote to shared
    };
    if (existingFunnel.name !== desiredName) patch.name = desiredName;
    await opts.svc.from("crm_funnels").update(patch).eq("id", funnelId);
  } else {
    const { data: newFunnel, error } = await opts.svc
      .from("crm_funnels")
      .insert({
        user_id: opts.userId,
        project_id: null,
        is_default: false,
        name: desiredName,
        crm_funnel_id: opts.categoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !newFunnel?.id) throw new Error("Failed to create funnel");
    funnelId = String(newFunnel.id);
  }

  // Load existing mapping (Bitrix stage_id -> local stage id)
  const { data: existingMappings } = await opts.svc
    .from("bitrix_stage_mapping")
    .select("id, bitrix_stage_id, lead_pipeline_stage_id")
    .eq("project_id", opts.projectId);
  const mapByBitrix = new Map<string, { mappingId: string; stageId: string }>(
    (existingMappings || []).map((m: any) => [String(m.bitrix_stage_id), { mappingId: String(m.id), stageId: String(m.lead_pipeline_stage_id) }])
  );

  const preferExisting = new Map<string, string>(Array.from(mapByBitrix.entries()).map(([ext, v]) => [ext, v.stageId]));
  const synced = await syncCrmFunnelStages({
    svc: opts.svc,
    funnelId,
    externalFunnelId: opts.categoryId,
    preferExistingStageIdByExternalId: preferExisting,
    stages: stagesSorted.map((s) => ({
      externalId: String(s.stageId),
      name: s.name,
      sort: s.sort,
      color: String(s.color ?? "#d5d8dd"),
    })),
  });

  // Upsert mapping (Bitrix stage_id -> local stage row id)
  for (const st of stagesSorted) {
    const stageRowId = synced.stageIdByExternalId.get(String(st.stageId));
    if (!stageRowId) continue;
    const existing = mapByBitrix.get(st.stageId) ?? null;
    if (existing?.mappingId) {
      if (existing.stageId !== stageRowId) {
        await opts.svc
          .from("bitrix_stage_mapping")
          .update({ lead_pipeline_stage_id: stageRowId, updated_at: new Date().toISOString() })
          .eq("id", existing.mappingId);
      } else {
        await opts.svc.from("bitrix_stage_mapping").update({ updated_at: new Date().toISOString() }).eq("id", existing.mappingId);
      }
      mapByBitrix.delete(st.stageId);
    } else {
      await opts.svc.from("bitrix_stage_mapping").insert({
        project_id: opts.projectId,
        bitrix_stage_id: st.stageId,
        lead_pipeline_stage_id: stageRowId,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Remove mappings for stages removed from Bitrix
  if (synced.removedExternalIds.length > 0) {
    await opts.svc.from("bitrix_stage_mapping").delete().eq("project_id", opts.projectId).in("bitrix_stage_id", synced.removedExternalIds);
  }

  return { funnelId, firstStageId: stagesSorted[0].stageId };
}

