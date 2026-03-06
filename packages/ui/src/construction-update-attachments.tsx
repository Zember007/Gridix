import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, PlayCircle, X } from "lucide-react";

type AttachmentKind = "image" | "video" | "youtube" | "document";

interface ConstructionUpdateAttachmentsProps {
  description: string;
  media?: string[];
  modalZIndex?: number;
}

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);
const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)(\?|#|$)/i.test(url);

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

const getYoutubeEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}`;
const getYoutubePreviewUrl = (videoId: string) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const getUrlAttachmentKind = (url: string): AttachmentKind => {
  if (getYoutubeVideoId(url)) return "youtube";
  if (isVideoUrl(url)) return "video";
  if (isImageUrl(url)) return "image";
  return "document";
};

const getFileNameFromUrl = (url: string) => {
  try {
    const clean = url.split("?")[0] ?? "";
    const name = clean.split("/").pop() ?? "Document";
    return decodeURIComponent(name);
  } catch {
    return "Document";
  }
};

const getDocTypeFromUrl = (url: string) => {
  const name = getFileNameFromUrl(url).toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".docx")) return "DOCX";
  if (name.endsWith(".doc")) return "DOC";
  return "DOC";
};

export const ConstructionUpdateAttachments = ({
  description,
  media = [],
  modalZIndex = 220,
}: ConstructionUpdateAttachmentsProps) => {
  const { t } = useTranslation();
  const [previewMedia, setPreviewMedia] = useState<{
    kind: "video" | "image" | "youtube";
    url: string;
  } | null>(null);

  const renderMediaAsset = (assetUrl: string, key: string) => {
    const kind = getUrlAttachmentKind(assetUrl);
    if (kind === "youtube") {
      const videoId = getYoutubeVideoId(assetUrl);
      const previewUrl = videoId ? getYoutubePreviewUrl(videoId) : null;
      const embedUrl = videoId ? getYoutubeEmbedUrl(videoId) : assetUrl;
      return (
        <button
          key={key}
          type="button"
          onClick={() => setPreviewMedia({ kind: "youtube", url: embedUrl })}
          className="group relative block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.01]"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={key}
              className="aspect-video w-full bg-black object-cover"
            />
          ) : (
            <div className="aspect-video w-full bg-black" />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-90">
            <div className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm">
              <PlayCircle size={16} />
            </div>
          </div>
        </button>
      );
    }
    if (kind === "video") {
      return (
        <button
          key={key}
          type="button"
          onClick={() => setPreviewMedia({ kind: "video", url: assetUrl })}
          className="group relative block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.01]"
        >
          <video
            src={assetUrl}
            muted
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-90">
            <div className="rounded-full bg-black/55 p-2 text-white backdrop-blur-sm">
              <PlayCircle size={16} />
            </div>
          </div>
        </button>
      );
    }

    if (kind === "image") {
      return (
        <button
          key={key}
          type="button"
          onClick={() => setPreviewMedia({ kind: "image", url: assetUrl })}
          className="group relative block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.01]"
        >
          <img
            src={assetUrl}
            alt={key}
            className="aspect-video w-full object-cover"
          />
        </button>
      );
    }

    return (
      <button
        key={key}
        type="button"
        onClick={() => window.open(assetUrl, "_blank", "noopener,noreferrer")}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <FileText size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800">
            {getFileNameFromUrl(assetUrl)}
          </div>
          <div className="text-[11px] text-slate-500">
            {t("drawer.construction.openDocument")}
          </div>
        </div>
        <div className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
          {getDocTypeFromUrl(assetUrl)}
        </div>
      </button>
    );
  };

  return (
    <>
      <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-600">
        {description}
      </p>
      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((assetUrl, i) =>
            renderMediaAsset(assetUrl, `update-media-${i}`),
          )}
        </div>
      )}

      {previewMedia && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
          style={{ zIndex: modalZIndex }}
          onClick={() => setPreviewMedia(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
          >
            <X size={20} />
          </button>
          <div
            className="max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {previewMedia.kind === "youtube" ? (
              <iframe
                src={previewMedia.url}
                title="YouTube video preview"
                className="aspect-video w-full rounded-xl bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : previewMedia.kind === "video" ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-h-[90vh] w-full rounded-xl bg-black"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt={t("drawer.construction.attachmentAlt")}
                className="max-h-[90vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
