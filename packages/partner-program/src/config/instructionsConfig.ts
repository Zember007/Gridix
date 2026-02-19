/**
 * Глобальный конфиг инструкций партнёрской программы.
 * Ресурсы (видео, PDF) хранятся в пакете: packages/partner-program/public/instructions/
 * Main app раздаёт их по /instructions/ через Vite-плагин; partners app может грузить с main (instructionsBaseUrl).
 */

import type { VideoChapter } from "../ui/VideoModalPlayer";

export type MaterialItem = {
  titleKey: string;
  languages: Array<"RU" | "EN">;
  files: Record<"RU" | "EN", string>;
};

export type VideoItem = {
  id: string;
  titleKey: string;
  src: string;
  chapters?: VideoChapter[];
};

export type FaqItem = {
  questionKey: string;
  answerKey: string;
};

const MATERIALS: MaterialItem[] = [
  {
    titleKey: "instructionsMaterial1",
    languages: ["RU", "EN"],
    files: {
      RU: "/instructions/pdf/GRIDIX-RU.pdf",
      EN: "/instructions/pdf/GRIDIX-EN.pdf",
    },
  },
];

const VIDEOS: VideoItem[] = [
  {
    id: "explore_service",
    titleKey: "instructionsVideo3",
    src: "/instructions/videos/Explore_service_.mp4",
    chapters: [],
  },
  {
    id: "create_project",
    titleKey: "instructionsVideo1",
    src: "/instructions/videos/Create_project_.mp4",
    chapters: [],
  },
  {
    id: "edit_project",
    titleKey: "instructionsVideo2",
    src: "/instructions/videos/Edit_project_gridix_.mp4",
    chapters: [],
  },
  {
    id: "explore_crm",
    titleKey: "instructionsVideo5",
    src: "/instructions/videos/Gridix_explore_crm.mp4",
    chapters: [],
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    questionKey: "instructionsFaq1Question",
    answerKey: "instructionsFaq1Answer",
  },
  {
    questionKey: "instructionsFaq2Question",
    answerKey: "instructionsFaq2Answer",
  },
  {
    questionKey: "instructionsFaq3Question",
    answerKey: "instructionsFaq3Answer",
  },
  {
    questionKey: "instructionsFaq4Question",
    answerKey: "instructionsFaq4Answer",
  },
  {
    questionKey: "instructionsFaq5Question",
    answerKey: "instructionsFaq5Answer",
  },
];

const TARGET_AUDIENCE_KEYS = [
  "instructionsAudience1",
  "instructionsAudience2",
  "instructionsAudience3",
  "instructionsAudience4",
  "instructionsAudience5",
];

export const DEFAULT_INSTRUCTIONS_CONFIG = {
  MATERIALS,
  VIDEOS,
  FAQ_ITEMS,
  TARGET_AUDIENCE_KEYS,
};

/** Собирает URL ресурса: baseUrl (без trailing slash) + path (начинается с /) */
export function instructionsAssetUrl(
  baseUrl: string | undefined,
  path: string,
): string {
  if (!baseUrl) return path;
  const base = baseUrl.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
