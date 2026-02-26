# Network Audit Report — `/en/admin`

**Date:** 2026-02-24T16:30:00Z
**App:** main (`apps/main`)
**URL:** `http://localhost:8080/en/admin`
**Mode:** static analysis (browser MCP unavailable)
**Focus:** redundant queries, duplicate data sources, missing cache, broad invalidation

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

Good baseline — `refetchOnWindowFocus: false` prevents focus-refetch globally.

---

## Findings

### F1 — Heavy leads fetch on every admin tab ⬆ HIGH

**File:** `apps/main/src/components/admin/AdminDashboard.tsx:226`

```ts
const { leads: allLeadsForUnread } = useLeads();
const crmUnreadCount = useMemo(
  () => allLeadsForUnread.filter((l) => !l.read_at).length,
  [allLeadsForUnread],
);
```

`useLeads()` is called in the **root** `AdminDashboard` component (renders on ALL tabs).
It triggers `fetchLeads()` which makes **2 sequential Supabase requests:**

1. `SELECT *, projects!inner(...), apartments!inner(...) FROM leads ORDER BY created_at DESC`
2. `SELECT lead_id, read_at FROM lead_reads WHERE user_id = ? AND lead_id IN (?...)`

The entire leads dataset (with full joins) is loaded just to compute a badge count.
This fires on every tab, including "projects" (the default).

**Impact:** 2 Supabase REST calls + full payload parse on every admin page load.

---

### F2 — `useAllFailedLeadsStats` overlaps with `useLeads` ⬆ MEDIUM

**File:** `apps/main/src/hooks/useAllFailedLeadsStats.ts`
**Consumer:** `ProjectList.tsx` → `<LeadsStats projectId={project.id} />`

On the default "projects" tab, `LeadsStats` calls `useAllFailedLeadsStats()` which fetches:

```sql
SELECT project_id, status FROM leads WHERE project_id IN (?)
```

This overlaps with F1's `useLeads()` which already loads all leads (including `project_id` and `status`).

**On initial admin load (default "projects" tab), Supabase gets hit with:**

1. `fetchLeads` → leads query (F1)
2. `fetchLeads` → lead_reads query (F1)
3. `useAllFailedLeadsStats` → leads stats query (F2)
4. `useWorkspaceProjects` → projects query
5. `useUserRole`, `useWorkspace` context queries

Total: **at minimum 5 Supabase REST requests** for the initial render.

---

### F3 — `getManagerProjectIds()` called as bare function inside multiple queryFn ⬆ MEDIUM

**Files:**

- `entities/lead/queries/useLeadsQuery.ts:26`
- `entities/workspace/queries/useWorkspaceProjects.ts:53`
- `hooks/useAllFailedLeadsStats.ts:41`
- `hooks/useAdminLeadsData.ts:815`

`getManagerProjectIds(userId, developerId)` makes **2–3 Supabase calls** per invocation:

1. `manager_accounts` lookup
2. `manager_project_access` lookup
3. Possibly `projects` fallback

It is called as a **bare async function** inside each hook's `queryFn`.
The cached `useManagerProjectIds` hook exists but is **not used** by these consumers.

**For manager users on initial load:** 4 hooks × 2–3 calls = **8–12 redundant Supabase requests**
for the same manager permission data.

---

### F4 — Funnel stages/triggers loaded via bare `useEffect`, no cache ⬆ MEDIUM

**File:** `apps/main/src/hooks/useAdminLeadsData.ts:347–382`

```ts
useEffect(() => {
  if (!activeFunnelId) return;
  const load = async () => {
    const [{ data: stages }, { data: triggers }] = await Promise.all([
      supabase.from("crm_funnel_stages").select("*").eq("funnel_id", activeFunnelId)...,
      supabase.from("crm_funnel_triggers").select("*").eq("funnel_id", activeFunnelId)...,
    ]);
    setFunnelStages(...);
    setFunnelTriggers(...);
  };
  load();
}, [activeFunnelId]);
```

- No TanStack Query caching — refetches on every mount/remount
- `handleSaveFunnelSetup()` (line 1654) and `handleResetFunnelSetup()` (line 1688) contain **identical** fetch logic, duplicating the same 2 requests

**Impact:** 2 requests on every funnel switch + 2 duplicate functions.

---

### F5 — Lead details loaded via bare `useEffect`, no cache ⬆ LOW-MEDIUM

**File:** `apps/main/src/hooks/useAdminLeadsData.ts:384–449`

When a lead is selected, 2–3 requests fire via raw `supabase` calls:

1. `lead_tasks` for the selected lead
2. `lead_activities` for the selected lead
3. Optionally `agent_applications` if `agent_id` is present

Reopening the same lead re-fires all requests. No caching between selections.

---

### F6 — `fetchLeads` makes 2 sequential requests (could be 1) ⬆ LOW

**File:** `apps/main/src/entities/lead/api/leadApi.ts:10–85`

The function first fetches all leads, then sequentially fetches `lead_reads` for the same user.
These could be combined via a Postgres view or RPC to eliminate one round-trip.

---

### F7 — Redundant `refetchOnWindowFocus: false` per-query overrides ⬆ LOW (noise)

**Files:**

- `components/admin/analytics/AdminAnalytics.tsx:130`
- `entities/workspace/queries/useWorkspaceProjects.ts:44`
- `hooks/useManagerProjectIds.ts:86`
- `hooks/useAllFailedLeadsStats.ts:32`

The global query client default already sets `refetchOnWindowFocus: false`.
These per-query overrides are unnecessary and add maintenance burden.

---

## Summary Table

| ID  | Pattern                                    | Severity | Auto-safe   | Files                                                                |
| --- | ------------------------------------------ | -------- | ----------- | -------------------------------------------------------------------- |
| F1  | Double source (full leads fetch for badge) | HIGH     | manual-only | AdminDashboard.tsx                                                   |
| F2  | Duplicate data (stats overlap with leads)  | MEDIUM   | manual-only | useAllFailedLeadsStats.ts, LeadsNotification.tsx                     |
| F3  | Redundant `getManagerProjectIds` calls     | MEDIUM   | manual-only | useLeadsQuery.ts, useWorkspaceProjects.ts, useAllFailedLeadsStats.ts |
| F4  | Missing cache (funnel useEffect)           | MEDIUM   | auto        | useAdminLeadsData.ts                                                 |
| F5  | Missing cache (lead details useEffect)     | LOW-MED  | auto        | useAdminLeadsData.ts                                                 |
| F6  | Sequential requests in fetchLeads          | LOW      | manual-only | leadApi.ts                                                           |
| F7  | Redundant refetchOnWindowFocus overrides   | LOW      | auto        | 4 files                                                              |
