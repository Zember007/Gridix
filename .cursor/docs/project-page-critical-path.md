### Project page critical path map (`/:lang/project/:slug?floor=...`)

#### Entry + composition

- **Route**: `apps/main/src/app/router/PublicRoutes.tsx` → `ProjectWidgetPage`
- **Page**: `apps/main/src/pages/ProjectWidgetPage.tsx`
  - Renders `ProjectApartmentSelector` (optionally with Bitrix topbar lazy-loaded)
- **Main container**: `apps/main/src/components/project-selector/ProjectApartmentSelector.tsx`
  - Orchestrates:
    - initial project data fetch (`useProjectSelectorInitial`)
    - view mode + floor URL state (`useUrlState`)
    - heavy views (list/chess/facade/floor-plan) behind lazy chunks

#### Hooks + data dependencies

- **Initial data**: `apps/main/src/components/project-selector/hooks/useProjectSelectorInitial.ts`
  - **Supabase edge function**: `supabase.functions.invoke("project-selector")`
    - Summary attempt: `{ action: "load-summary", projectId }` (fallback to `load-initial`)
    - Full load (idle): `{ action: "load-initial", projectId }`
  - **Non-critical effect**: `incrementViewCount(projectId)` moved to idle (no longer in the critical render path)
- **Facade data** (only when `viewMode === "facade"`):
  - `apps/main/src/components/project-selector/hooks/useFacadeData.ts` → `loadSelectorFacade`
- **Floor polygons** (only when `viewMode === "floor-plan"` and floor selected):
  - `apps/main/src/components/project-selector/hooks/useFloorPolygons.ts` → `loadSelectorFloorPolygons`
- **Floor plan image + settings** (only inside floor plan view):
  - `apps/main/src/components/visualization/FloorPlanView.tsx` → `loadSelectorFloorPlan`

#### Network / side-effects that were on the critical path

- **Translations**: `apps/main/src/shared/lib/i18n.ts`
  - Before: on startup loaded _all_ `locales/<lang>/*.json`
  - Now: loads a **small allowlist** for `/project/*` routes, and loads the rest on-demand when route changes.
- **View tracking / counters**: `useProjectCRUD().incrementViewCount`
  - Now scheduled on idle (fire-and-forget relative to LCP).

#### LCP candidate (what typically becomes the LCP element here)

Most commonly it’s either:

- **Project header title / above-the-fold header block**: `apps/main/src/components/project-selector/ProjectHeader.tsx`, or
- **Main content placeholder / skeleton** while apartments are loading: `apps/main/src/components/project-selector/views/LoaderView.tsx`

The page’s baseline trace you referenced shows **Render Delay dominating**, so the main leverage is:

- reduce synchronous JS executed before the first meaningful UI
- avoid bundling heavy visualization libs into the initial chunk
- reduce eager data fetching to a “summary first” model
