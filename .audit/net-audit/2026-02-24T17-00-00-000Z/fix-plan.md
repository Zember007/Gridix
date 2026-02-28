# Fix Plan — `/en/admin?page=leads`

**Audit:** 2026-02-24T17:00:00Z
**Approval required before apply.**

---

## Fix 1 — Parallelize `fetchLeads` requests (N1)

**Risk:** LOW
**Type:** auto-safe (request parallelization, no logic change)
**File:** `apps/main/src/entities/lead/api/leadApi.ts`

### Change

Replace sequential fetch pattern:

```
① leads query → wait → ② lead_reads query (filtered by lead IDs)
```

With parallel fetch:

```
Promise.all([① leads query, ② ALL lead_reads for user]) → join client-side
```

The `lead_reads` query no longer needs `IN (leadIds)` filter because we fetch all reads for the user and join by a `Map` lookup. For typical users (≤5000 reads), the extra data is negligible compared to saving a full round-trip.

### Expected Impact

- Eliminates 1 sequential round-trip (~100–300 ms saved)
- No change in data correctness

---

## Fix 2 — Parallelize `useUnreadLeadsCount` requests (N2)

**Risk:** LOW
**Type:** auto-safe (request parallelization, no logic change)
**File:** `apps/main/src/hooks/useUnreadLeadsCount.ts`

### Change

Same pattern as Fix 1: run leads.id fetch and lead_reads fetch in parallel via `Promise.all`.

### Expected Impact

- Eliminates 1 sequential round-trip (~50–150 ms saved)
- No change in data correctness

---

## Fix 3 — Merge duplicate funnel stages queries (N3)

**Risk:** LOW
**Type:** auto-safe (query merge, no logic change)
**File:** `apps/main/src/hooks/useAdminLeadsData.ts`

### Change

1. Expand `allFunnelStagesQuery` to select `id, funnel_id, name, color, order_index` (was: `id, funnel_id`)
2. Derive active funnel stages from `allFunnelStagesQuery.data` via `useMemo` filter
3. Remove separate `funnelStagesQuery`
4. Update `invalidateFunnelQueries` to invalidate the merged query key

### Expected Impact

- Eliminates 1 Supabase REST request per funnel switch + initial load
- Slightly more data in the all-stages query (name, color, order_index), negligible overhead
- No change in data correctness

---

## Summary

| Fix   | File                   | Requests Saved   | Latency Saved |
| ----- | ---------------------- | ---------------- | ------------- |
| Fix 1 | leadApi.ts             | 0 (parallelized) | ~100–300 ms   |
| Fix 2 | useUnreadLeadsCount.ts | 0 (parallelized) | ~50–150 ms    |
| Fix 3 | useAdminLeadsData.ts   | 1 eliminated     | ~50–100 ms    |

**Total estimated improvement:** 1 fewer request, ~200–550 ms faster initial load on leads page.
