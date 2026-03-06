import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  ConstructionUpdateAttachments,
  resolveConstructionUpdateLocale,
  type SharedProject,
} from "@gridix/ui";
import {
  FileText,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Loader2,
  PlayCircle,
  Plus,
  X,
} from "lucide-react";
import {
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/shared/lib/language-utils";
import { useConstructionAttachments } from "./hooks/useConstructionAttachments";
import { useConstructionUpdates } from "./hooks/useConstructionUpdates";

interface DeveloperConstructionTabProps {
  project: SharedProject;
  language: string;
  userId?: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  reloadProject: (projectId: string) => Promise<void>;
}

const parseLinksFromText = (rawText: string) => {
  return rawText
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/[)\].,;!?]+$/, ""))
    .map((token) => {
      if (/^https?:\/\//i.test(token)) return token;
      if (/^(www\.)?(youtube\.com|youtu\.be)\//i.test(token)) {
        return `https://${token}`;
      }
      return null;
    })
    .filter((token): token is string => Boolean(token));
};

const getYoutubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? id.slice(0, 20) : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? id.slice(0, 20) : null;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live")
      ) {
        return parts[1] ? parts[1].slice(0, 20) : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getLinkDisplayFallback = (url: string) => {
  try {
    const parsed = new URL(url);
    if (getYoutubeVideoId(url)) return "YouTube video";
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
};

const normalizeLanguageCode = (rawLanguage: string): Language => {
  const normalized = rawLanguage.toLowerCase().replace("_", "-").split("-")[0];
  if (normalized && SUPPORTED_LANGUAGES.includes(normalized as Language)) {
    return normalized as Language;
  }
  return "en";
};

const getLocalizedLanguageName = (
  languageCode: Language,
  uiLanguage: Language,
): string => {
  try {
    const display = new Intl.DisplayNames([uiLanguage], { type: "language" });
    const localized = display.of(languageCode);
    if (typeof localized === "string" && localized.trim().length > 0) {
      return localized;
    }
  } catch {
    // Ignore and fall back to static language names.
  }

  return LANGUAGE_CONFIG[languageCode].name;
};

const fetchYoutubeTitle = async (link: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    if (typeof data.title === "string" && data.title.trim().length > 0) {
      return data.title.trim();
    }
  } catch {
    return null;
  }

  return null;
};

export const DeveloperConstructionTab = ({
  project,
  language,
  userId,
  t,
  reloadProject,
}: DeveloperConstructionTabProps) => {
  const currentLanguage = normalizeLanguageCode(language);
  const isMountedRef = useRef(true);
  const pendingLinkRequestsRef = useRef<Set<string>>(new Set());
  const [selectedContentLanguage, setSelectedContentLanguage] =
    useState<Language>(currentLanguage);
  const [linkPreviewMap, setLinkPreviewMap] = useState<
    Record<string, { title?: string; thumbnailUrl?: string; loading: boolean }>
  >({});
  const [newMediaLinks, setNewMediaLinks] = useState<string[]>([]);
  const [localizedTitles, setLocalizedTitles] = useState<
    Record<string, string>
  >({});
  const [localizedDescriptions, setLocalizedDescriptions] = useState<
    Record<string, string>
  >({});
  const {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newDate,
    setNewDate,
    isPublishing,
    addUpdate,
    deleteUpdate,
  } = useConstructionUpdates({
    projectId: project.id,
    userId,
    t,
    reloadProject,
  });

  useEffect(() => {
    setSelectedContentLanguage(currentLanguage);
  }, [currentLanguage]);
  const {
    files: newFiles,
    isDropActive,
    draggedFileIndex,
    fileInputRef,
    selectedFilePreviews,
    clearFiles,
    removeFile,
    onSelectFiles,
    onDropFiles,
    onDropzoneDragOver,
    onDropzoneDragEnter,
    onDropzoneDragLeave,
    onItemDragStart,
    onItemDragEnd,
    onItemDragOver,
    getFileAttachmentKind,
    formatFileSize,
  } = useConstructionAttachments({ disabled: isPublishing });
  const addLinksFromText = useCallback(
    (rawText: string) => {
      if (isPublishing) return 0;
      const foundLinks = parseLinksFromText(rawText);
      if (foundLinks.length === 0) return 0;
      setNewMediaLinks((prev) => Array.from(new Set([...prev, ...foundLinks])));
      return foundLinks.length;
    },
    [isPublishing],
  );

  const removeMediaLink = (idx: number) => {
    setNewMediaLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearMediaLinks = () => setNewMediaLinks([]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      const missing = newMediaLinks.filter(
        (link) => !pendingLinkRequestsRef.current.has(link),
      );
      if (missing.length === 0) return;

      missing.forEach((link) => pendingLinkRequestsRef.current.add(link));

      setLinkPreviewMap((prev) => {
        const next = { ...prev };
        missing.forEach((link) => {
          const videoId = getYoutubeVideoId(link);
          next[link] = {
            loading: Boolean(videoId),
            thumbnailUrl: videoId
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : undefined,
          };
        });
        return next;
      });

      await Promise.all(
        missing.map(async (link) => {
          const videoId = getYoutubeVideoId(link);
          if (!videoId) {
            if (!isMountedRef.current) return;
            setLinkPreviewMap((prev) => ({
              ...prev,
              [link]: { ...prev[link], loading: false },
            }));
            return;
          }

          try {
            const title = await fetchYoutubeTitle(link);
            if (!isMountedRef.current) return;
            setLinkPreviewMap((prev) => ({
              ...prev,
              [link]: {
                ...prev[link],
                title: title ?? prev[link]?.title,
                loading: false,
              },
            }));
          } catch {
            if (!isMountedRef.current) return;
            setLinkPreviewMap((prev) => ({
              ...prev,
              [link]: { ...prev[link], loading: false },
            }));
          }
        }),
      );
    };

    void loadMetadata();
  }, [newMediaLinks]);

  const onAttachmentDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    const uriList = e.dataTransfer.getData("text/uri-list");
    const plainText = e.dataTransfer.getData("text/plain");
    addLinksFromText(`${uriList}\n${plainText}`);
    onDropFiles(e);
  };

  const onAttachmentPaste = (e: ReactClipboardEvent<HTMLDivElement>) => {
    const plainText = e.clipboardData.getData("text/plain");
    const added = addLinksFromText(plainText);
    if (added > 0) {
      e.preventDefault();
    }
  };

  const onDescriptionPaste = (e: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const plainText = e.clipboardData.getData("text/plain");
    const tokens = plainText
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const parsedLinks = parseLinksFromText(plainText);
    const isLinkOnlyPaste =
      parsedLinks.length > 0 && parsedLinks.length === tokens.length;
    if (!isLinkOnlyPaste) return;

    const added = addLinksFromText(plainText);
    if (added > 0) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if (isPublishing) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) {
        return;
      }

      const plainText = e.clipboardData?.getData("text/plain") ?? "";
      const added = addLinksFromText(plainText);
      if (added > 0) {
        e.preventDefault();
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, [isPublishing, addLinksFromText]);

  const updates = useMemo(
    () => project.constructionProgress ?? [],
    [project.constructionProgress],
  );
  const isCurrentLanguageSelected = selectedContentLanguage === currentLanguage;
  const draftTitle = isCurrentLanguageSelected
    ? newTitle
    : (localizedTitles[selectedContentLanguage] ?? "");
  const draftDescription = isCurrentLanguageSelected
    ? newDesc
    : (localizedDescriptions[selectedContentLanguage] ?? "");

  const updateDraftTitle = (value: string) => {
    if (isCurrentLanguageSelected) {
      setNewTitle(value);
      return;
    }
    setLocalizedTitles((prev) => ({
      ...prev,
      [selectedContentLanguage]: value,
    }));
  };

  const updateDraftDescription = (value: string) => {
    if (isCurrentLanguageSelected) {
      setNewDesc(value);
      return;
    }
    setLocalizedDescriptions((prev) => ({
      ...prev,
      [selectedContentLanguage]: value,
    }));
  };

  const getLanguageBadgeState = (lang: Language) => {
    if (lang === currentLanguage) {
      return Boolean(newTitle.trim() && newDesc.trim());
    }
    return Boolean(
      localizedTitles[lang]?.trim() && localizedDescriptions[lang]?.trim(),
    );
  };
  const localizedUpdates = useMemo(
    () =>
      updates.map((update) => ({
        update,
        localized: resolveConstructionUpdateLocale(update, currentLanguage),
      })),
    [updates, currentLanguage],
  );

  return (
    <div className="p-6">
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          {t("projectList.construction.addNews")}
        </h4>
        <div className="space-y-3">
          <input
            type="date"
            lang={language}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded border p-2 text-sm"
          />
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => updateDraftTitle(e.target.value)}
            placeholder={t("projectList.construction.titlePlaceholder", {
              language: LANGUAGE_CONFIG[selectedContentLanguage].name,
            })}
            className="w-full rounded border p-2 text-sm"
          />
          <textarea
            value={draftDescription}
            onChange={(e) => updateDraftDescription(e.target.value)}
            onPaste={onDescriptionPaste}
            placeholder={t("projectList.construction.descriptionPlaceholder", {
              language: LANGUAGE_CONFIG[selectedContentLanguage].name,
            })}
            className="h-32 w-full resize-none rounded border p-2 text-sm"
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold text-slate-600">
              {t("projectList.construction.languageSection")}
            </div>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((langCode) => {
                const isSelected = selectedContentLanguage === langCode;
                const hasContent = getLanguageBadgeState(langCode);
                return (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => setSelectedContentLanguage(langCode)}
                    className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    <span>
                      {getLocalizedLanguageName(langCode, currentLanguage)}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        hasContent ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block cursor-pointer">
              <div
                className={`flex items-center rounded-xl border border-dashed bg-gradient-to-br from-slate-50 to-white px-3 py-3 transition-all hover:shadow-sm ${
                  isDropActive
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-slate-300 hover:border-blue-300"
                }`}
                onDragOver={onDropzoneDragOver}
                onDragEnter={onDropzoneDragEnter}
                onDragLeave={onDropzoneDragLeave}
                onDrop={onAttachmentDrop}
                onPaste={onAttachmentPaste}
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-2 text-slate-500 ring-1 ring-slate-200">
                    <FileText size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      {isPublishing
                        ? t("projectList.media.uploading")
                        : t("projectList.media.attachFiles")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t("projectList.media.attachFilesHint")}
                    </div>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                disabled={isPublishing}
                onChange={(e) => onSelectFiles(e.target.files)}
              />
            </label>
            {(newFiles.length > 0 || newMediaLinks.length > 0) && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                {newFiles.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">
                      {t("projectList.media.selectedFilesCount", {
                        count: newFiles.length,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="rounded px-2 py-1 font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      {t("projectList.media.clearSelected")}
                    </button>
                  </div>
                )}
                {newFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    draggable={!isPublishing}
                    onDragStart={() => onItemDragStart(idx)}
                    onDragEnd={onItemDragEnd}
                    onDragOver={(e) => onItemDragOver(e, idx)}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                      draggedFileIndex === idx
                        ? "border-blue-300 bg-blue-50/70"
                        : "border-slate-200 bg-slate-50/80"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        className="cursor-grab text-slate-400 active:cursor-grabbing"
                        title={t("projectList.media.dragToReorder")}
                        tabIndex={-1}
                      >
                        <GripVertical size={15} />
                      </button>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-200">
                        {selectedFilePreviews[idx]?.kind === "video" &&
                        selectedFilePreviews[idx]?.previewUrl ? (
                          <video
                            src={selectedFilePreviews[idx]?.previewUrl}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : selectedFilePreviews[idx]?.kind === "image" &&
                          selectedFilePreviews[idx]?.previewUrl ? (
                          <img
                            src={selectedFilePreviews[idx]?.previewUrl}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                            <FileText size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        {getFileAttachmentKind(file) === "video" ? (
                          <PlayCircle
                            size={13}
                            className="shrink-0 text-slate-500"
                          />
                        ) : getFileAttachmentKind(file) === "image" ? (
                          <ImageIcon
                            size={13}
                            className="shrink-0 text-slate-500"
                          />
                        ) : (
                          <FileText
                            size={13}
                            className="shrink-0 text-slate-500"
                          />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title={t("projectList.construction.delete")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {newMediaLinks.length > 0 && (
                  <div className="mt-1 space-y-1.5 border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold">
                        {t("projectList.media.selectedLinksCount", {
                          count: newMediaLinks.length,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={clearMediaLinks}
                        className="rounded px-2 py-1 font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        {t("projectList.media.clearSelected")}
                      </button>
                    </div>
                    {newMediaLinks.map((link, idx) => (
                      <div
                        key={`${link}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-200">
                            {linkPreviewMap[link]?.thumbnailUrl ? (
                              <img
                                src={linkPreviewMap[link].thumbnailUrl}
                                alt={
                                  linkPreviewMap[link]?.title ?? "Video preview"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                                <Link2 size={14} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              {linkPreviewMap[link]?.loading ? (
                                <Loader2
                                  size={12}
                                  className="shrink-0 animate-spin"
                                />
                              ) : (
                                <PlayCircle
                                  size={12}
                                  className="shrink-0 text-slate-500"
                                />
                              )}
                              <span className="truncate">
                                {linkPreviewMap[link]?.title ??
                                  getLinkDisplayFallback(link)}
                              </span>
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {link}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaLink(idx)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title={t("projectList.construction.delete")}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              const published = await addUpdate({
                files: newFiles,
                links: newMediaLinks,
                currentLanguage,
                titleTranslations: localizedTitles,
                descriptionTranslations: localizedDescriptions,
                clearFiles,
                clearLinks: clearMediaLinks,
              });

              if (published) {
                setLocalizedTitles({});
                setLocalizedDescriptions({});
                setSelectedContentLanguage(currentLanguage);
              }
            }}
            disabled={isPublishing}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {isPublishing
              ? t("projectList.media.uploading")
              : t("projectList.construction.publish")}
          </button>
        </div>
      </div>

      <div className="relative space-y-8 border-l border-slate-200 pl-4">
        {updates.length === 0 && (
          <div className="pl-4 text-sm italic text-slate-400">
            {t("projectList.construction.noUpdates")}
          </div>
        )}
        {localizedUpdates.map(({ update: u, localized }) => {
          return (
            <div key={u.id} className="relative pl-6">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-4">
                <div className="grow">
                  <div className="mb-1 text-xs font-bold text-slate-400">
                    {new Date(u.date).toLocaleDateString()}
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">
                    {localized.title}
                  </h4>
                  <ConstructionUpdateAttachments
                    description={localized.description}
                    media={u.images ?? []}
                    modalZIndex={120}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void deleteUpdate(u.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title={t("projectList.construction.delete")}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
