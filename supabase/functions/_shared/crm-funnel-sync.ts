/**
 * Shared synchronization primitives for CRM funnels/stages.
 *
 * Key design:
 * - Stages are matched by external id stored in `crm_funnel_stages.crm_stage_id` (TEXT)
 * - Updates must not change local stage row ids (only name/order/color/external ids)
 * - When stages disappear from CRM, delete only if not referenced; otherwise detach external id
 */
export type SyncStageInput = {
  externalId: string;
  name: string;
  sort: number;
  color?: string | null;
};

let cachedStageOrderColumn: string | null = null;

export async function resolveStageOrderColumn(svc: any): Promise<string> {
  if (cachedStageOrderColumn) return cachedStageOrderColumn;
  // Prefer the modern column name; fall back to older naming if local DB differs.
  // IMPORTANT: information_schema is not guaranteed to be exposed via PostgREST,
  // so we detect by probing `crm_funnel_stages` selects.
  const candidates = ["order_index", "sort_order", "order", "position"];
  for (const c of candidates) {
    try {
      const { error } = await svc.from("crm_funnel_stages").select(c).limit(1);
      if (!error) {
        cachedStageOrderColumn = c;
        return c;
      }
      // Postgres: 42703 undefined_column
      if (String((error as any)?.code ?? "") !== "42703") break;
    } catch {
      // ignore
    }
  }
  cachedStageOrderColumn = "order_index";
  return cachedStageOrderColumn;
}

async function getStageUsage(svc: any, stageIds: string[]) {
  const [{ data: leadsUsing }, { data: triggersUsing }, { data: jobsUsing }] = await Promise.all([
    svc.from("leads").select("pipeline_stage_id").in("pipeline_stage_id", stageIds),
    svc.from("crm_funnel_triggers").select("stage_id").in("stage_id", stageIds),
    svc.from("crm_automation_jobs").select("stage_id").in("stage_id", stageIds),
  ]);

  return new Set<string>([
    ...(leadsUsing || []).map((r: any) => r.pipeline_stage_id).filter(Boolean),
    ...(triggersUsing || []).map((r: any) => r.stage_id).filter(Boolean),
    ...(jobsUsing || []).map((r: any) => r.stage_id).filter(Boolean),
  ]);
}

export async function syncCrmFunnelStages(opts: {
  svc: any;
  funnelId: string;
  externalFunnelId: number | null;
  stages: SyncStageInput[];
  /**
   * Optional hint map (external stage id -> local stage row id).
   * Used for legacy Bitrix rows where crm_stage_id was null but mapping existed.
   */
  preferExistingStageIdByExternalId?: Map<string, string>;
}): Promise<{
  orderCol: string;
  stageIdByExternalId: Map<string, string>;
  removedExternalIds: string[];
}> {
  const orderCol = await resolveStageOrderColumn(opts.svc);
  const desired = [...opts.stages].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const desiredExternalIds = new Set(desired.map((s) => String(s.externalId)));

  const { data: existingStages } = await opts.svc
    .from("crm_funnel_stages")
    .select(`id, name, color, crm_stage_id, ${orderCol}`)
    .eq("funnel_id", opts.funnelId);

  const existingByExternalId = new Map<string, string>();
  const existingRowById = new Map<string, any>();
  for (const row of existingStages || []) {
    const id = String((row as any).id);
    existingRowById.set(id, row);
    const ext = (row as any).crm_stage_id;
    if (ext !== null && ext !== undefined && String(ext).trim()) {
      existingByExternalId.set(String(ext), id);
    }
  }

  // Fast no-op: if all desired stages exist with same name/order/color and there are no extra external-mapped stages.
  // NOTE: We intentionally ignore rows with crm_stage_id NULL (detached history rows).
  if (existingByExternalId.size === desired.length) {
    const allMatch = desired.every((s, idx) => {
      const id = existingByExternalId.get(String(s.externalId));
      if (!id) return false;
      const row = existingRowById.get(id);
      if (!row) return false;
      const nameOk = String((row as any).name ?? "") === String(s.name ?? "");
      const orderOk = Number((row as any)[orderCol]) === idx;
      const desiredColor = String(s.color ?? "#d5d8dd");
      const colorOk = String((row as any).color ?? "#d5d8dd") === desiredColor;
      return nameOk && orderOk && colorOk;
    });
    if (allMatch) {
      const stageIdByExternalId = new Map<string, string>();
      for (const s of desired) {
        const id = existingByExternalId.get(String(s.externalId));
        if (id) stageIdByExternalId.set(String(s.externalId), id);
      }
      return { orderCol, stageIdByExternalId, removedExternalIds: [] };
    }
  }

  // Merge in legacy hints (Bitrix mapping) to preserve ids on first migration sync.
  const prefer = opts.preferExistingStageIdByExternalId ?? new Map<string, string>();
  for (const [ext, id] of prefer.entries()) {
    if (!desiredExternalIds.has(String(ext))) continue;
    const stageId = String(id);
    if (existingRowById.has(stageId) && !existingByExternalId.has(String(ext))) {
      existingByExternalId.set(String(ext), stageId);
    }
  }

  // Upsert stages by external id; never change local `id`.
  const stageIdByExternalId = new Map<string, string>();
  for (let i = 0; i < desired.length; i++) {
    const s = desired[i];
    const externalId = String(s.externalId);
    const existingId = existingByExternalId.get(externalId) ?? null;
    const patch: Record<string, unknown> = {
      name: s.name,
      color: s.color ?? "#d5d8dd",
      [orderCol]: i,
      crm_stage_id: externalId,
      crm_funnel_id: opts.externalFunnelId,
      crm_pipeline_id: opts.externalFunnelId,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      await opts.svc.from("crm_funnel_stages").update(patch).eq("id", existingId);
      stageIdByExternalId.set(externalId, existingId);
      existingByExternalId.delete(externalId); // mark processed
    } else {
      const { data: newStage, error } = await opts.svc
        .from("crm_funnel_stages")
        .insert({
          funnel_id: opts.funnelId,
          ...patch,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error || !newStage?.id) throw new Error("Failed to create funnel stage");
      stageIdByExternalId.set(externalId, String(newStage.id));
    }
  }

  // Any remaining entries in existingByExternalId are removed from CRM.
  const removedExternalIds = Array.from(existingByExternalId.keys());
  if (removedExternalIds.length > 0) {
    const removedStageIds = removedExternalIds
      .map((ext) => existingByExternalId.get(ext))
      .filter(Boolean)
      .map((id) => String(id)) as string[];

    const used = await getStageUsage(opts.svc, removedStageIds);
    const safeToDelete = removedStageIds.filter((id) => !used.has(id));
    const protectedToDetach = removedStageIds.filter((id) => used.has(id));

    if (safeToDelete.length > 0) {
      await opts.svc.from("crm_funnel_stages").delete().in("id", safeToDelete);
    }
    if (protectedToDetach.length > 0) {
      await opts.svc
        .from("crm_funnel_stages")
        .update({ crm_stage_id: null, updated_at: new Date().toISOString() })
        .in("id", protectedToDetach);
    }
  }

  return { orderCol, stageIdByExternalId, removedExternalIds };
}

