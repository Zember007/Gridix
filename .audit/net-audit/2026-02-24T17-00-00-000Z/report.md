# Network Audit Report — `/en/admin?page=leads`

**Date:** 2026-02-24T17:00:00Z
**App:** main (`apps/main`)
**URL:** `http://localhost:8080/en/admin?page=leads`
**Mode:** static analysis (browser MCP unavailable)
**Focus:** sequential request chains, overlapping queries, duplicate fetches on leads tab

---

## Global Query Client Config

| Setting                | Value              |
| ---------------------- | ------------------ |
| `staleTime`            | 5 min (300 000 ms) |
| `gcTime`               | 30 min             |
| `refetchOnWindowFocus` | `false` (global)   |
| `refetchOnReconnect`   | `true`             |
| `retry`                | 1                  |

**Source:** `packages/utils/src/api/queryClient.ts`

---

## Previous Audit Fix Status

The previous audit (2026-02-24T16:30) identified 7 findings. Current status:

| ID  | Finding                                 | Status                                              |
| --- | --------------------------------------- | --------------------------------------------------- |
| F1  | Heavy `useLeads()` for badge count      | **Fixed** → `useUnreadLeadsCount`                   |
| F3  | Bare `getManagerProjectIds()` calls     | **Fixed** → all use cached `useManagerProjectIds()` |
| F4  | Funnel stages/triggers bare `useEffect` | **Fixed** → migrated to `useQuery`                  |
| F5  | Lead details bare `useEffect`           | **Fixed** → migrated to `useQuery`                  |
| F7  | Redundant `refetchOnWindowFocus: false` | **Fixed** → removed per-query overrides             |
| F2  | `useAllFailedLeadsStats` overlap        | Partial (not on leads tab)                          |
| F6  | Sequential requests in `fetchLeads`     | **Open**                                            |

---

## New Findings for `/en/admin?page=leads`

### N1 — `fetchLeads` makes 2 **sequential** Supabase requests ⬆ HIGH

**File:** `apps/main/src/entities/lead/api/leadApi.ts:10–85`

```ts
const { data, error } = await query; // ① leads + joins
// ...wait for response...
const { data: reads } = await supabase // ② lead_reads
  .from("lead_reads")
  .select("lead_id, read_at")
  .eq("user_id", userId)
  .in("lead_id", leadIds);
```

Request ② depends on the lead IDs from ①, but we can remove that dependency by fetching ALL reads for the current user and joining client-side. This lets both requests run **in parallel**, cutting wall-clock latency roughly in half.

**Impact:** 2 sequential round-trips → 2 parallel round-trips. Saves ~100–300 ms on every leads fetch depending on network.

---

### N2 — `useUnreadLeadsCount` makes 2 **sequential** requests ⬆ MEDIUM

**File:** `apps/main/src/hooks/useUnreadLeadsCount.ts:37–60`

Same pattern as N1: first fetches all lead IDs, then sequentially fetches read marks:

```ts
const { data: leads } = await query; // ① leads.id
const leadIds = leads.map((l) => l.id);
const { data: reads } = await supabase // ② lead_reads
  .from("lead_reads")
  .select("lead_id")
  .eq("user_id", user.id)
  .in("lead_id", leadIds);
```

On the leads page, this is doubly wasteful because `useLeadsQuery` already loads leads with `read_at` and `useAdminLeadsData` computes `totalUnreadCount` from them. But since `useUnreadLeadsCount` also powers the sidebar badge on other tabs, it must remain. Parallelizing its queries eliminates the sequential latency.

**Impact:** 2 sequential round-trips → 2 parallel round-trips.

---

### N3 — Duplicate funnel stages query ⬆ MEDIUM

**File:** `apps/main/src/hooks/useAdminLeadsData.ts`

Two separate queries fetch overlapping data:

| Query                             | Key                                          | Select          | Filter             |
| --------------------------------- | -------------------------------------------- | --------------- | ------------------ |
| `allFunnelStagesQuery` (line 304) | `["crm_funnel_stages", "by_funnel", userId]` | `id, funnel_id` | all funnel IDs     |
| `funnelStagesQuery` (line 349)    | `["crm_funnel_stages", activeFunnelId]`      | `*`             | active funnel only |

The active funnel's stages are a strict subset of the all-funnels query. By expanding the all-funnels query to include `name, color, order_index`, we can derive active funnel stages client-side and eliminate the second query entirely.

**Impact:** 1 fewer Supabase REST request on every funnel switch + initial load.

---

## Request Waterfall on `/en/admin?page=leads` Initial Load

| #   | Source                 | Endpoint                           | Parallel?              | Verdict            |
| --- | ---------------------- | ---------------------------------- | ---------------------- | ------------------ |
| 1   | `fetchLeads`           | `leads + joins`                    | —                      | required           |
| 2   | `fetchLeads`           | `lead_reads`                       | **sequential after 1** | **parallelize**    |
| 3   | `useUnreadLeadsCount`  | `leads.id`                         | —                      | required (sidebar) |
| 4   | `useUnreadLeadsCount`  | `lead_reads`                       | **sequential after 3** | **parallelize**    |
| 5   | `useAdminLeadsData`    | `crm_funnels`                      | —                      | required           |
| 6   | `useAdminLeadsData`    | `crm_funnel_triggers` (compliance) | after 5                | required           |
| 7   | `useAdminLeadsData`    | `crm_funnel_stages` (all)          | after 5                | required           |
| 8   | `useAdminLeadsData`    | `crm_funnel_stages` (active)       | after 5                | **duplicate of 7** |
| 9   | `useAdminLeadsData`    | `crm_funnel_triggers` (active)     | after 5                | required           |
| 10  | `useManagerProjectIds` | manager lookups (2-3 calls)        | —                      | cached, OK         |

**Before fix:** 9–10 requests, 2 sequential chains, 1 duplicate
**After fix:** 7–8 requests, 0 sequential chains, 0 duplicates

---

## Summary Table

| ID  | Pattern                                      | Severity | Auto-safe | Files                  |
| --- | -------------------------------------------- | -------- | --------- | ---------------------- |
| N1  | Sequential requests in `fetchLeads`          | HIGH     | auto      | leadApi.ts             |
| N2  | Sequential requests in `useUnreadLeadsCount` | MEDIUM   | auto      | useUnreadLeadsCount.ts |
| N3  | Duplicate funnel stages query                | MEDIUM   | auto      | useAdminLeadsData.ts   |
