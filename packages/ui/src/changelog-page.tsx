import React, { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Briefcase,
  Building2,
  Calendar,
  Filter,
  ShieldAlert,
  User,
} from "lucide-react";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";
import { Loader } from "./loader";
import { LanguageToggle } from "./language-toggle";
import { Spinner } from "./Spinner";

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
    bg: string;
    text: string;
    icon: React.ElementType;
  }
> = {
  developer: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: Building2,
  },
  agency: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Briefcase,
  },
  agent: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    icon: User,
  },
  admin: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: ShieldAlert,
  },
  partner: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: Briefcase,
  },
  superadmin: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    icon: ShieldAlert,
  },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const { t } = useLanguage();
  const roleConfig = ZONE_BADGE_CONFIG[role as keyof typeof ZONE_BADGE_CONFIG];
  if (!roleConfig) return null;

  const Icon = roleConfig.icon as React.ElementType;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${roleConfig.bg} ${roleConfig.text}`}
    >
      <Icon size={10} /> {t(`changelog.roles.${role}`) || role}
    </span>
  );
};

function formatDate(dateIso: string, language: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getEntryDescription(entry: ChangelogEntry, language: string): string {
  if (language === "ru") {
    return (
      entry.summary_ru ||
      entry.summary_en ||
      entry.what_done ||
      entry.context ||
      "Описание изменений не указано."
    );
  }
  return (
    entry.summary_en ||
    entry.summary_ru ||
    entry.what_done ||
    entry.context ||
    "No description provided."
  );
}

function getEntryTitle(entry: ChangelogEntry, language: string): string {
  if (language === "ru") {
    return entry.title_ru || entry.title_en || entry.title;
  }
  return entry.title_en || entry.title_ru || entry.title;
}

export function ChangelogPage({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const { t, language } = useLanguage();
  const [zoneFilter, setZoneFilter] = useState<"all" | CodeZone>("all");
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const zoneTabs: Array<{ id: "all" | CodeZone; label: string }> = useMemo(
    () => [
      { id: "all", label: t("changelog.roles.all") || "Все" },
      {
        id: "developer",
        label: t("changelog.roles.developer") || "Застройщик",
      },
      { id: "agent", label: t("changelog.roles.agent") || "Агент" },
      { id: "partner", label: t("changelog.roles.partner") || "Партнер" },
      {
        id: "superadmin",
        label: t("changelog.roles.superadmin") || "Superadmin",
      },
    ],
    [t],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchEntries = async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await changelogClient
        .from("changelog_pull_requests")
        .select(
          "id, github_pr_id, title, title_ru, title_en, summary_ru, summary_en, author, merged_at, context, what_done, how_to_verify, risks, code_zones, media",
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

  if (isLoading) {
    if (standalone) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center">
          <Loader color="#000000" size="lg" className="mx-auto" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#F8FAFC]">
      <div className="border-b border-slate-200 bg-white px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo/gridix_black_logo.svg"
              alt="Gridix"
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t("changelog.title") || "Changelog"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {t("changelog.subtitle") || "Platform updates history"}
              </p>
            </div>
          </div>
          {standalone && <LanguageToggle />}
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
            {(
              t("changelog.shownRecords") || "Showing records: {{count}}"
            ).replace("{{count}}", String(filteredEntries.length))}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar relative flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6 pb-20">
          {loadError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {t("changelog.errorLoading") || "Failed to load changelog."} (
              {loadError})
            </div>
          )}

          {filteredEntries.length === 0 && !loadError && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Filter size={32} />
              </div>
              <h3 className="mb-2 font-bold text-slate-900">
                {t("changelog.emptyZone") || "No records"}
              </h3>
              <button
                onClick={() => setZoneFilter("all")}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {t("changelog.showAll") || "Show all"}
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
                  #{entry.github_pr_id} {getEntryTitle(entry, language)}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />{" "}
                    {formatDate(entry.merged_at, language)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                  {getEntryDescription(entry, language)}
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
                          {t("changelog.openAttachment") || "Open attachment"}
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

export default ChangelogPage;
