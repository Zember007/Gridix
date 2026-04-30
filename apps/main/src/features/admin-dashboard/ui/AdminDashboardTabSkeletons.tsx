/* eslint-disable react-refresh/only-export-components -- tab skeleton helpers; only `getAdminSuspenseFallback` is imported outside HMR-critical paths */

import type { ReactNode } from "react";
import { Skeleton } from "@gridix/ui";

/** Suspense fallbacks keyed by admin `page=` tab — mirrors target layout shells. */

function LeadsTabSuspenseSkeleton() {
  return (
    <div className="h-full bg-[var(--admin-background-secondary)] px-3 py-3 sm:px-6 sm:py-4 lg:py-6">
      <div className="mb-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
        <div className="grid grid-cols-[40px_1.4fr_1fr_1fr_120px] gap-3 border-b border-[var(--admin-border)] px-4 py-3 max-lg:grid-cols-[40px_1fr_120px]">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 max-lg:hidden" />
          <Skeleton className="h-4 w-24 max-lg:hidden" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[40px_1.4fr_1fr_1fr_120px] gap-3 border-b border-[var(--admin-border)] px-4 py-4 last:border-b-0 max-lg:grid-cols-[40px_1fr_120px]"
          >
            <Skeleton className="h-4 w-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-24 max-lg:hidden" />
            <Skeleton className="h-4 w-28 max-lg:hidden" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionTabSuspenseSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-16">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-48 w-full rounded-xl border border-slate-200" />
      </section>
    </div>
  );
}

function PartnersTabSuspenseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-7 w-2/3 max-w-md" />
        <Skeleton className="mb-2 h-4 w-full max-w-xl" />
        <Skeleton className="mb-6 h-4 w-4/5 max-w-lg" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}

function AgentNetworkTabSuspenseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 max-md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 last:border-0"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full max-md:hidden" />
            <Skeleton className="h-4 w-8 max-md:hidden" />
            <Skeleton className="h-4 w-12 max-md:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsTabSuspenseSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center">
          <Skeleton className="h-10 max-w-xl flex-1 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-slate-50 px-6 py-4 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetsTabSuspenseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="min-h-[200px] w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
      </div>
    </div>
  );
}

function AnalyticsTabSuspenseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" aria-hidden />
        <Skeleton className="h-4 max-w-xl" aria-hidden />
        <Skeleton className="h-11 w-full max-w-xl" aria-hidden />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
      <Skeleton className="h-[430px] rounded-xl" />
    </div>
  );
}

function IntegrationsTabSuspenseSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-card shadow-md"
        >
          <Skeleton className="h-2 w-full rounded-none" />
          <div className="space-y-3 p-6">
            <div className="flex items-start justify-between">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTabSuspenseSkeleton() {
  return (
    <div className="flex min-h-[320px] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      <div className="flex-1 space-y-6 pt-2">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-4 h-4 w-64 max-w-full" />
        <div className="grid max-w-xl gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChangelogTabSuspenseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-slate-100 p-4"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full max-w-lg" />
        </div>
      ))}
    </div>
  );
}

function DefaultAdminTabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function getAdminSuspenseFallback(activeTab: string): ReactNode {
  switch (activeTab) {
    case "leads":
      return <LeadsTabSuspenseSkeleton />;
    case "subscription":
      return <SubscriptionTabSuspenseSkeleton />;
    case "partners":
      return <PartnersTabSuspenseSkeleton />;
    case "agent_network":
      return <AgentNetworkTabSuspenseSkeleton />;
    case "contacts":
      return <ContactsTabSuspenseSkeleton />;
    case "widgets":
      return <WidgetsTabSuspenseSkeleton />;
    case "analytics":
      return <AnalyticsTabSuspenseSkeleton />;
    case "integrations":
      return <IntegrationsTabSuspenseSkeleton />;
    case "settings":
      return <SettingsTabSuspenseSkeleton />;
    case "changelog":
      return <ChangelogTabSuspenseSkeleton />;
    default:
      return <DefaultAdminTabSkeleton />;
  }
}
