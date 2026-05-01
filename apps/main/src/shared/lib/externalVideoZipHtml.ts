/**
 * Resolves known external video URLs into embed + optional poster URLs
 * for static HTML bundled in ZIP exports (no runtime API calls).
 */

const YOUTUBE_ID_MAX_LEN = 20;

const getYoutubeVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? id.slice(0, YOUTUBE_ID_MAX_LEN) : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch" || parsed.pathname === "/watch/") {
        const id = parsed.searchParams.get("v");
        return id ? id.slice(0, YOUTUBE_ID_MAX_LEN) : null;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        (parts[0] === "embed" ||
          parts[0] === "shorts" ||
          parts[0] === "live" ||
          parts[0] === "v")
      ) {
        return parts[1] ? parts[1].slice(0, YOUTUBE_ID_MAX_LEN) : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getVimeoVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("vimeo.com")) return null;

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && /^\d+$/.test(parts[1] ?? "")) {
      return parts[1] ?? null;
    }
    if (
      parts[0] === "channels" &&
      parts[2] === "videos" &&
      /^\d+$/.test(parts[3] ?? "")
    ) {
      return parts[3] ?? null;
    }
    if (
      parts[0] === "groups" &&
      parts[2] === "videos" &&
      /^\d+$/.test(parts[3] ?? "")
    ) {
      return parts[3] ?? null;
    }
    if (/^\d+$/.test(parts[0] ?? "")) {
      return parts[0] ?? null;
    }
  } catch {
    return null;
  }
  return null;
};

const getDailymotionVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname
        .replace(/^www\./, "")
        .toLowerCase()
        .includes("dailymotion.com")
    ) {
      return null;
    }
    const m = parsed.pathname.match(/\/(?:embed\/)?video\/([a-z0-9]+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
};

const getRutubeVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.endsWith("rutube.ru")) return null;

    const m = parsed.pathname.match(/([a-f0-9]{32})/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
};

const getVkVideoOembedFromUrl = (
  url: string,
): { oid: string; id: string } | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (
      host !== "vk.com" &&
      host !== "vk.ru" &&
      host !== "vkvideo.ru" &&
      !host.endsWith(".vk.com")
    ) {
      return null;
    }

    const m = parsed.pathname.match(/\/video(-?\d+)_(\d+)/);
    const oid = m?.[1];
    const id = m?.[2];
    if (!oid || !id) return null;
    return { oid, id };
  } catch {
    return null;
  }
};

export type ExternalVideoZipEmbed = {
  embedSrc: string;
  /** Optional still image (YouTube / Dailymotion); shown above iframe for quick recognition. */
  posterSrc: string | null;
};

/**
 * Returns embed URL (+ poster when cheaply known) or null if the host is unsupported here.
 */
export function resolveExternalVideoEmbedForZip(
  url: string,
): ExternalVideoZipEmbed | null {
  const yt = getYoutubeVideoIdFromUrl(url);
  if (yt) {
    return {
      embedSrc: `https://www.youtube.com/embed/${encodeURIComponent(yt)}?modestbranding=1`,
      posterSrc: `https://img.youtube.com/vi/${encodeURIComponent(yt)}/hqdefault.jpg`,
    };
  }

  const vimeo = getVimeoVideoIdFromUrl(url);
  if (vimeo) {
    return {
      embedSrc: `https://player.vimeo.com/video/${encodeURIComponent(vimeo)}`,
      posterSrc: null,
    };
  }

  const dm = getDailymotionVideoIdFromUrl(url);
  if (dm) {
    return {
      embedSrc: `https://www.dailymotion.com/embed/video/${encodeURIComponent(dm)}`,
      posterSrc: `https://www.dailymotion.com/thumbnail/video/${encodeURIComponent(dm)}`,
    };
  }

  const rutube = getRutubeVideoIdFromUrl(url);
  if (rutube) {
    return {
      embedSrc: `https://rutube.ru/play/embed/${encodeURIComponent(rutube)}/`,
      posterSrc: null,
    };
  }

  const vk = getVkVideoOembedFromUrl(url);
  if (vk) {
    const q = new URLSearchParams({ oid: vk.oid, id: vk.id, hd: "2" });
    return {
      embedSrc: `https://vk.com/video_ext.php?${q.toString()}`,
      posterSrc: null,
    };
  }

  return null;
}
