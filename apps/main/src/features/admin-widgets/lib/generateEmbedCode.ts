import { Language } from "@gridix/utils/lib";

/**
 * Режим главного экрана виджета.
 * С генпланом: genplan / objects / …
 * Без генплана: facade / chess / … (те же URL, что фасад и шахматка в селекторе)
 */
export type WidgetContentMode =
  | "genplan"
  | "objects"
  | "facade"
  | "chess"
  | "list"
  | "building";

type GenerateEmbedCodeParams = {
  origin: string;
  defaultLanguage: Language;
  showFullProject: boolean;
  showFloatingButton: boolean;
  floatingButtonSide: "left" | "right";
  floatingButtonBottomOffset: number;
  floatingButtonSideOffset: number;
  selectedProject: string;
  selectedProjectEmbedIdentifier: string;
  widgetContentMode: WidgetContentMode;
  /** Slug подпроекта при `widgetContentMode === "building"` */
  widgetSubProjectSlug: string;
};

export const generateEmbedCode = ({
  origin,
  defaultLanguage,
  showFullProject,
  showFloatingButton,
  floatingButtonSide,
  floatingButtonBottomOffset,
  floatingButtonSideOffset,
  selectedProject,
  selectedProjectEmbedIdentifier,
  widgetContentMode,
  widgetSubProjectSlug,
}: GenerateEmbedCodeParams) => {
  const scriptUrl = `${origin}/widget/index.js`;

  const params: Record<string, string | number | boolean> = {
    lang: defaultLanguage,
    showFullProject,
    showFloatingButton,
    floatingButtonSide,
    floatingButtonBottomOffset,
    floatingButtonSideOffset,
  };
  if (selectedProject !== "all" && selectedProjectEmbedIdentifier) {
    params.projectId = selectedProjectEmbedIdentifier;
  }

  const slug = widgetSubProjectSlug.trim();
  if (widgetContentMode === "building" && slug.length > 0) {
    params.subProjectSlug = slug;
  } else if (widgetContentMode === "objects" || widgetContentMode === "chess") {
    params.widgetStartView = "objects";
  } else if (widgetContentMode === "list") {
    params.widgetStartView = "list";
  }

  const attrs = Object.entries(params)
    .map(([k, v]) => {
      if (typeof v === "string") {
        return `${k}: "${v}"`;
      }
      return `${k}: ${v}`;
    })
    .join(", ");

  return `<div id="gridix-widget-root" style="min-height: 100vh; width: 100%; position: relative; z-index: 1000;"></div>
<script src="${scriptUrl}"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.GridixWidget && window.GridixWidget.init({ ${attrs} });
  });
</script>`;
};
