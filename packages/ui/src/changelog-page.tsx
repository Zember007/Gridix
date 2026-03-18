import React, { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Briefcase,
  Building2,
  Calendar,
  Filter,
  Loader2,
  LockKeyhole,
  Link2,
  ShieldAlert,
  User,
  Zap,
} from "lucide-react";
import { supabase } from "@gridix/utils/api";
import { CATEGORY_LABELS, UPDATES_CONTENT } from "./changelog-content";

type CodeZone = "agent" | "developer" | "partner" | "superadmin";

interface ChangelogEntry {
  id: string;
  github_pr_id: number;
  title: string;
  title_ru: string | null;
  title_en: string | null;
  summary_ru: string | null;
  summary_en: string | null;
  author: string | null;
  merged_at: string;
  task_link: string | null;
  context: string | null;
  what_done: string | null;
  how_to_verify: string | null;
  risks: string | null;
  code_zones: CodeZone[] | null;
  media: ChangelogMedia[] | null;
}

interface ChangelogMedia {
  source_url: string;
  public_url: string;
  storage_path: string;
  content_type: string;
  media_kind: "image" | "video" | "file" | "link";
}

type ChangelogClient = {
  from: (table: "changelog_pull_requests") => {
    select: (columns: string) => {
      order: (
        column: "merged_at",
        options: { ascending: boolean },
      ) => {
        limit: (count: number) => Promise<{
          data: ChangelogEntry[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

const changelogClient = supabase as unknown as ChangelogClient;

const ZONE_BADGE_CONFIG: Record<
  CodeZone | "agency" | "admin",
  {
    label: string;
    bg: string;
    text: string;
    icon: React.ElementType;
  }
> = {
  developer: {
    label: "Застройщик",
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Building2,
  },
  agency: {
    label: "Агентство",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Briefcase,
  },
  agent: {
    label: "Агент",
    bg: "bg-teal-100",
    text: "text-teal-700",
    icon: User,
  },
  admin: {
    label: "Admin",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: ShieldAlert,
  },
  partner: {
    label: "Партнер",
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: Briefcase,
  },
  superadmin: {
    label: "Superadmin",
    bg: "bg-rose-100",
    text: "text-rose-700",
    icon: ShieldAlert,
  },
};

const zoneTabs: Array<{ id: "all" | CodeZone; label: string }> = [
  { id: "all", label: "Все" },
  { id: "developer", label: "Застройщик" },
  { id: "agent", label: "Агент" },
  { id: "partner", label: "Партнер" },
  { id: "superadmin", label: "Superadmin" },
];

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleConfig = ZONE_BADGE_CONFIG[role as keyof typeof ZONE_BADGE_CONFIG];
  if (!roleConfig) return null;

  const Icon = roleConfig.icon as React.ElementType;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${roleConfig.bg} ${roleConfig.text}`}
    >
      <Icon size={10} /> {roleConfig.label}
    </span>
  );
};

function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getEntryDescription(entry: ChangelogEntry): string {
  return (
    entry.summary_ru ??
    entry.what_done ??
    entry.context ??
    "Описание изменений не указано."
  );
}

function getEntryTitle(entry: ChangelogEntry): string {
  return entry.title_ru ?? entry.title;
}

export function ChangelogPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<"all" | CodeZone>("all");
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEntries = async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await changelogClient
        .from("changelog_pull_requests")
        .select(
          "id, github_pr_id, title, title_ru, title_en, summary_ru, summary_en, author, merged_at, task_link, context, what_done, how_to_verify, risks, code_zones, media",
        )
        .order("merged_at", { ascending: false })
        .limit(200);

      if (!isMounted) return;

      if (error) {
        setLoadError(error.message);
        setEntries([]);
        setIsLoading(false);
        return;
      }

      const normalized = (data ?? []).map((entry) => ({
        ...entry,
        code_zones: Array.isArray(entry.code_zones)
          ? entry.code_zones.filter(
              (zone): zone is CodeZone =>
                zone === "agent" ||
                zone === "developer" ||
                zone === "partner" ||
                zone === "superadmin",
            )
          : [],
        media: Array.isArray(entry.media)
          ? entry.media.filter(
              (item): item is ChangelogMedia =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.public_url === "string" &&
                typeof item.media_kind === "string",
            )
          : [],
      }));

      setEntries(normalized);
      setIsLoading(false);
    };

    void fetchEntries();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasRemoteData = entries.length > 0;

  const filteredEntries = useMemo(() => {
    if (zoneFilter === "all") return entries;
    return entries.filter((entry) =>
      (entry.code_zones ?? []).includes(zoneFilter),
    );
  }, [entries, zoneFilter]);

  const getCountForZone = (zone: "all" | CodeZone): number => {
    if (zone === "all") return entries.length;
    return entries.filter((entry) => (entry.code_zones ?? []).includes(zone))
      .length;
  };

  const filteredTimeline = useMemo(() => {
    return UPDATES_CONTENT.map((release) => {
      const matchingFeatures = release.features.filter((feature) => {
        if (roleFilter === "all") return true;
        if (feature.availableFor) {
          return feature.availableFor.includes(
            roleFilter as "developer" | "agency" | "agent" | "admin",
          );
        }
        return release.roles.includes(
          roleFilter as "developer" | "agency" | "agent" | "admin",
        );
      });

      return { ...release, features: matchingFeatures };
    }).filter((release) => release.features.length > 0);
  }, [roleFilter]);

  const getCountForRole = (filterRole: string) => {
    if (filterRole === "all") return UPDATES_CONTENT.length;

    return UPDATES_CONTENT.filter((release) => {
      const hasMatchingFeature = release.features.some((feature) => {
        if (feature.availableFor) {
          return feature.availableFor.includes(
            filterRole as "developer" | "agency" | "agent" | "admin",
          );
        }
        return release.roles.includes(
          filterRole as "developer" | "agency" | "agent" | "admin",
        );
      });
      return hasMatchingFeature;
    }).length;
  };

  const tabs = [
    { id: "all", label: "Все" },
    { id: "developer", label: "Застройщик" },
    { id: "agency", label: "Агентство" },
    { id: "agent", label: "Агент" },
    { id: "admin", label: "Admin" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <Loader2 className="animate-spin text-slate-500" size={16} />
          Загружаем changelog...
        </div>
      </div>
    );
  }

  if (hasRemoteData) {
    return (
      <div className="flex h-full min-h-screen flex-col bg-[#F8FAFC]">
        <div className="border-b border-slate-200 bg-white px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Новые функции
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                История обновлений и улучшений платформы
              </p>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-20 flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:flex-row md:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
            <div className="no-scrollbar flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 md:w-auto">
              {zoneTabs.map((tab) => {
                const count = getCountForZone(tab.id);
                if (count === 0 && tab.id !== "all") return null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setZoneFilter(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                      zoneFilter === tab.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        zoneFilter === tab.id
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="hidden text-xs font-medium text-slate-400 md:block">
              Показано записей: {filteredEntries.length}
            </div>
          </div>
        </div>

        <div className="custom-scrollbar relative flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6 pb-20">
            {filteredEntries.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <Filter size={32} />
                </div>
                <h3 className="mb-2 font-bold text-slate-900">
                  Нет записей для зоны
                </h3>
                <button
                  onClick={() => setZoneFilter("all")}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Показать все обновления
                </button>
              </div>
            )}

            {filteredEntries.map((entry) => (
              <article
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-slate-50/30 p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {(entry.code_zones ?? []).map((zone) => (
                      <RoleBadge key={`${entry.id}-${zone}`} role={zone} />
                    ))}
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-900">
                    #{entry.github_pr_id} {getEntryTitle(entry)}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 uppercase">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} /> {formatDate(entry.merged_at)}
                    </span>
                    {entry.task_link && (
                      <a
                        href={entry.task_link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Link2 size={13} /> Задача
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {getEntryDescription(entry)}
                  </p>
                  {(entry.media ?? []).length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(entry.media ?? []).slice(0, 6).map((item, index) => {
                        if (item.media_kind === "image") {
                          return (
                            <a
                              key={`${entry.id}-img-${index}`}
                              href={item.public_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="block overflow-hidden rounded-lg border border-slate-200"
                            >
                              <img
                                src={item.public_url}
                                alt={`media-${entry.github_pr_id}-${index + 1}`}
                                className="h-44 w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          );
                        }

                        if (item.media_kind === "video") {
                          return (
                            <div
                              key={`${entry.id}-video-${index}`}
                              className="overflow-hidden rounded-lg border border-slate-200 bg-black"
                            >
                              <video
                                controls
                                preload="metadata"
                                className="h-44 w-full object-cover"
                              >
                                <source
                                  src={item.public_url}
                                  type={item.content_type}
                                />
                              </video>
                            </div>
                          );
                        }

                        return (
                          <a
                            key={`${entry.id}-link-${index}`}
                            href={item.public_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink size={14} />
                            Открыть вложение
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#F8FAFC]">
      <div className="border-b border-slate-200 bg-white px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Новые функции</h1>
            <p className="mt-1 text-sm text-slate-500">
              История обновлений и улучшений платформы
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:flex-row md:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="no-scrollbar flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 md:w-auto">
            {tabs.map((tab) => {
              const count = getCountForRole(tab.id);
              if (count === 0 && tab.id !== "all") return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    roleFilter === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      roleFilter === tab.id
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden text-xs font-medium text-slate-400 md:block">
            Показано релизов: {filteredTimeline.length}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar relative flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8 pb-20">
          {loadError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Не удалось загрузить данные из Supabase ({loadError}). Показан
              статичный changelog.
            </div>
          )}
          {filteredTimeline.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Filter size={32} />
              </div>
              <h3 className="mb-2 font-bold text-slate-900">
                Нет обновлений для этой роли
              </h3>
              <button
                onClick={() => setRoleFilter("all")}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Показать все обновления
              </button>
            </div>
          )}

          {filteredTimeline.map((release, idx) => (
            <div
              key={release.id}
              className="animate-in fade-in slide-in-from-bottom-4 relative pl-0 duration-500 md:pl-8"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center">
                <div className="absolute top-1/2 -left-[41px] z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full border-4 border-slate-50 bg-slate-200 md:block"></div>
                <div className="absolute top-8 -left-[35px] -z-10 hidden h-full w-px bg-slate-200 md:block"></div>

                <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-600">
                  v{release.version}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  <Calendar size={14} /> {release.date}
                </div>
                <div className="h-px w-full flex-1 bg-slate-100 md:w-auto"></div>
              </div>

              <div className="mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-50 bg-slate-50/30 p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {Array.from(
                      new Set(
                        release.features.flatMap(
                          (feature) => feature.availableFor || release.roles,
                        ),
                      ),
                    ).map((role) => (
                      <RoleBadge key={role as string} role={role as string} />
                    ))}
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-900">
                    {release.title}
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                    {release.description}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {release.features.map((feature, featureIdx) => {
                    const featureRoles = feature.availableFor || release.roles;
                    const FeatureIcon = feature.icon as
                      | React.ElementType
                      | undefined;

                    return (
                      <div
                        key={featureIdx}
                        className="group flex flex-col gap-6 p-6 transition-colors hover:bg-slate-50 md:flex-row"
                      >
                        <div className="shrink-0 pt-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-transform group-hover:scale-110">
                            {FeatureIcon ? (
                              <FeatureIcon
                                size={20}
                                className="text-slate-700"
                              />
                            ) : (
                              <Zap size={20} />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                              {CATEGORY_LABELS[feature.category]}
                            </span>
                          </div>
                          <h3 className="mb-2 text-base font-bold text-slate-900">
                            {feature.title}
                          </h3>
                          <p className="mb-4 text-sm leading-relaxed text-slate-600">
                            {feature.description}
                          </p>

                          {feature.demo && (
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-slate-200 p-1.5 text-slate-400">
                                  <LockKeyhole size={16} />
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium tracking-wide text-slate-500 uppercase">
                                    Авторизуйтесь для доступа к демо
                                  </span>
                                </div>
                              </div>

                              <div className="px-2 text-[10px] text-slate-400 italic">
                                Требуется:{" "}
                                {featureRoles
                                  .map((role) => role.toUpperCase())
                                  .join(" или ")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChangelogPage;
