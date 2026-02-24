# Fix Plan — `/en/admin` Network Audit

**Date:** 2026-02-24
**Approval required:** Yes — review each fix, then run `apply` with the approval token from `plan.json`.

---

## Fix 1 — Replace heavy `useLeads()` with lightweight unread count query

**Fixes:** F1
**Risk:** LOW — only changes the data source for a badge counter
**Type:** manual-only (requires new query + component change)

### Current State

`AdminDashboard.tsx:226` calls `useLeads()` which loads ALL leads with full joins
just to count unread items: `allLeadsForUnread.filter(l => !l.read_at).length`.

### Proposed Change

Create a dedicated lightweight hook `useUnreadLeadsCount()` that runs:

```sql
SELECT count(*) FROM leads l
LEFT JOIN lead_reads lr ON lr.lead_id = l.id AND lr.user_id = ?
WHERE lr.read_at IS NULL
AND l.project_id IN (?) -- scoped to user's projects
```

Or simpler — derive count from the existing realtime subscription
(`useLeadsRealtime` already listens to lead changes).

### Files to Change

1. **NEW:** `apps/main/src/hooks/useUnreadLeadsCount.ts` — lightweight count query
2. **EDIT:** `apps/main/src/components/admin/AdminDashboard.tsx` — replace `useLeads()` with new hook

### Estimated Request Reduction

**−2 Supabase calls** on every admin page load.

---

## Fix 2 — Derive `useAllFailedLeadsStats` from `useLeads` cache or combine

**Fixes:** F2
**Risk:** LOW — changes internal data derivation, no API change
**Type:** manual-only

### Proposed Change

Since `useLeads()` already fetches all leads (when active on Leads tab), derive
project stats from the same TanStack Query cache instead of a separate fetch.

If Fix 1 removes `useLeads()` from AdminDashboard, then `useAllFailedLeadsStats`
becomes the only leads fetch on the Projects tab — acceptable. But if both remain,
they should share data.

**Option A:** Make `useAllFailedLeadsStats` read from `["leads", ...]` cache when available.
**Option B:** Merge the stats computation into the `useWorkspaceProjects` queryFn as a joined query.

### Files to Change

1. `apps/main/src/hooks/useAllFailedLeadsStats.ts`

### Estimated Request Reduction

**−1 Supabase call** on projects tab load (when combined with Fix 1).

---

## Fix 3 — Cache `getManagerProjectIds` result via shared hook

**Fixes:** F3
**Risk:** LOW — `useManagerProjectIds` already exists and caches the result
**Type:** manual-only (requires refactoring hook consumers)

### Proposed Change

Replace bare `getManagerProjectIds()` calls inside `queryFn` with a pattern
that reads from the cached `useManagerProjectIds` hook result.

Pass `projectIds` as a dependency to `enabled` and include in `queryKey`,
so the downstream query only fires after manager permissions are resolved.

### Files to Change

1. `apps/main/src/entities/lead/queries/useLeadsQuery.ts`
2. `apps/main/src/entities/workspace/queries/useWorkspaceProjects.ts`
3. `apps/main/src/hooks/useAllFailedLeadsStats.ts`

### Estimated Request Reduction

For manager users: **−6 to −9 Supabase calls** on admin page load.

---

## Fix 4 — Convert funnel stages/triggers loading to `useQuery` ✅ AUTO-SAFE

**Fixes:** F4
**Risk:** LOW — replaces `useEffect` + local state with cached query
**Type:** auto-eligible

### Proposed Change

Replace the `useEffect` at lines 347–382 in `useAdminLeadsData.ts` with:

```ts
const funnelStagesQuery = useQuery({
  queryKey: ["crm_funnel_stages", activeFunnelId],
  enabled: !!activeFunnelId,
  queryFn: async () => {
    /* existing fetch logic */
  },
});

const funnelTriggersQuery = useQuery({
  queryKey: ["crm_funnel_triggers", activeFunnelId],
  enabled: !!activeFunnelId,
  queryFn: async () => {
    /* existing fetch logic */
  },
});
```

Remove duplicate `handleSaveFunnelSetup` / `handleResetFunnelSetup` fetch code —
use `queryClient.invalidateQueries({ queryKey: ["crm_funnel_stages", activeFunnelId] })` instead.

### Files to Change

1. `apps/main/src/hooks/useAdminLeadsData.ts`

### Estimated Request Reduction

**−2 requests** on funnel re-switch + eliminates duplicate save/reset fetch.

---

## Fix 5 — Convert lead detail loading to `useQuery` ✅ AUTO-SAFE

**Fixes:** F5
**Risk:** LOW — replaces `useEffect` + setState with cached query
**Type:** auto-eligible

### Proposed Change

Replace the `useEffect` at lines 384–449 with:

```ts
const leadDetailsQuery = useQuery({
  queryKey: ["lead_details", selectedLead?.id],
  enabled: !!selectedLead?.id,
  staleTime: 60_000,
  queryFn: async () => {
    const [{ data: tasks }, { data: history }] = await Promise.all([...]);
    // + partner fetch if agent_id
    return { tasks, history, partner };
  },
});
```

### Files to Change

1. `apps/main/src/hooks/useAdminLeadsData.ts`

### Estimated Request Reduction

**−2–3 requests** on reopening the same lead within staleTime.

---

## Fix 6 — Remove redundant `refetchOnWindowFocus: false` overrides ✅ AUTO-SAFE

**Fixes:** F7
**Risk:** NONE — purely removes dead config that duplicates global default
**Type:** auto-eligible

### Files to Change

1. `apps/main/src/components/admin/analytics/AdminAnalytics.tsx:130`
2. `apps/main/src/entities/workspace/queries/useWorkspaceProjects.ts:44`
3. `apps/main/src/hooks/useManagerProjectIds.ts:86`
4. `apps/main/src/hooks/useAllFailedLeadsStats.ts:32`

### Estimated Request Reduction

None (code cleanup only).

---

## Priority Order

| Priority | Fix                                      | Impact            | Effort  |
| -------- | ---------------------------------------- | ----------------- | ------- |
| 1        | Fix 1 (lightweight unread count)         | HIGH              | Medium  |
| 2        | Fix 3 (cache manager project IDs)        | HIGH for managers | Medium  |
| 3        | Fix 4 (funnel useQuery conversion)       | MEDIUM            | Low     |
| 4        | Fix 5 (lead details useQuery conversion) | LOW-MED           | Low     |
| 5        | Fix 2 (stats dedup)                      | MEDIUM            | Low     |
| 6        | Fix 6 (remove redundant overrides)       | LOW               | Trivial |

## Estimated Total Reduction

- **Developer users:** −3 to −5 Supabase calls per admin page load
- **Manager users:** −9 to −14 Supabase calls per admin page load
- **Lead drawer reopens:** −2–3 calls per same-lead reopen
- **Funnel switches:** −2 calls per cached funnel re-select
