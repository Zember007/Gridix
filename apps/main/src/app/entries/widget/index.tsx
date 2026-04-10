import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { LANGUAGE_CONFIG } from "@gridix/utils/lib";
import { createAppQueryClient } from "@gridix/utils/api";
import i18n from "@/shared/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectApartmentSelector } from "@/components";
import "@/index.css";
import {
  FloatingProjectButton,
  FloatingProjectButtonProps,
} from "@/components/widget/FloatingProjectButton";

const widgetQueryClient = createAppQueryClient();

// Используется только для версионирования style.css
declare const __WIDGET_VERSION__: string;

/** Стартовый экран встроенного виджета (после загрузки проекта). */
export type WidgetStartView = "genplan" | "objects" | "list";

type InitOptions = {
  // Основные параметры
  projectId?: string | undefined; // slug или UUID проекта
  lang?: string | undefined; // ru | en | ka | ar
  showFullProject?: boolean | undefined; // показывать полный проект в виджете

  /**
   * Стартовый режим для проекта с генпланом: генплан (по умолчанию), список объектов/подпроектов или список квартир.
   * Для обычного проекта без генплана влияет только выбор вкладки (фасад / шахматка / список).
   */
  widgetStartView?: WidgetStartView | undefined;
  /**
   * Показать только выбранное здание (slug подпроекта). Полный хаб проекта не загружается.
   * Навигация на генплан из этого режима недоступна, если не открыть полный виджет проекта отдельно.
   */
  subProjectSlug?: string | undefined;

  // Настройки парящей кнопки
  showFloatingButton?: boolean; // показывать/скрывать кнопку
  floatingButtonSide?: "left" | "right"; // сторона кнопки
  floatingButtonBottomOffset?: number; // отступ от низа (px)
  floatingButtonSideOffset?: number; // отступ от боковой стороны (px)
};

const DEFAULT_CONTAINER_ID = "gridix-widget-root";

/** Путь + query для MemoryRouter: генплан по умолчанию, либо только подпроект. */
function buildWidgetInitialPath(opts: {
  subProjectSlug?: string | undefined;
  widgetStartView?: WidgetStartView | undefined;
}): string {
  const sp = new URLSearchParams();
  if (opts.widgetStartView === "objects") {
    sp.set("view", "chess");
  } else if (opts.widgetStartView === "list") {
    sp.set("view", "list");
  }
  const q = sp.toString();
  const suffix = q ? `?${q}` : "";
  const slug = opts.subProjectSlug?.trim();
  if (slug) {
    return `/p/${encodeURIComponent(slug)}${suffix}`;
  }
  return `/${suffix}`;
}

function getWidgetScriptSrc(): string | null {
  // Best case: during script execution, currentScript points to the widget script.
  const current = document.currentScript;
  if (current && current instanceof HTMLScriptElement && current.src) {
    return current.src;
  }

  const scripts = Array.from(
    document.getElementsByTagName("script"),
  ) as HTMLScriptElement[];

  // Prefer the known embed URL shape from admin panel: /widget/index.js
  const exact = scripts
    .slice()
    .reverse()
    .find((s) => s.src && /\/widget\/index\.js(\?.*)?$/.test(s.src));
  if (exact?.src) return exact.src;

  // Next best: any script served from a /widget/ folder and ending in .js
  const widgetFolder = scripts
    .slice()
    .reverse()
    .find((s) => s.src && /\/widget\/.+\.js(\?.*)?$/.test(s.src));
  if (widgetFolder?.src) return widgetFolder.src;

  // If the file name or path includes "gridix", prefer that over generic "widget" scripts.
  const gridix = scripts
    .slice()
    .reverse()
    .find((s) => s.src && /gridix/i.test(s.src) && /\.js(\?.*)?$/.test(s.src));
  if (gridix?.src) return gridix.src;

  // Last resort: old heuristic (can match 3rd-party widgets).
  const anyWidget = scripts
    .slice()
    .reverse()
    .find((s) => s.src && /widget/i.test(s.src) && /\.js(\?.*)?$/.test(s.src));
  return anyWidget?.src ?? null;
}

const WIDGET_SCRIPT_SRC =
  typeof document !== "undefined" ? getWidgetScriptSrc() : null;

function buildInitOptions(options: InitOptions = {}): InitOptions {
  const url = new URL(window.location.href);
  const qp = url.searchParams;

  const showFloatingButtonParam = qp.get("showFloatingButton");
  const floatingButtonSideParam = qp.get("floatingButtonSide");
  const floatingButtonBottomOffsetParam = qp.get("floatingButtonBottomOffset");
  const floatingButtonSideOffsetParam = qp.get("floatingButtonSideOffset");
  const showFullProjectParam = qp.get("showFullProject");
  // Не читаем subProjectSlug / widgetStartView из URL страницы-хоста: чужие query
  // (например ?subProjectSlug=default) ломали маршрут /p/... и скрывали генплан.

  const parsedFloatingBottom = floatingButtonBottomOffsetParam
    ? parseInt(floatingButtonBottomOffsetParam, 10)
    : undefined;
  const parsedFloatingSide = floatingButtonSideOffsetParam
    ? parseInt(floatingButtonSideOffsetParam, 10)
    : undefined;

  return {
    projectId: options.projectId ?? qp.get("projectId") ?? undefined,
    lang: options.lang ?? qp.get("lang") ?? undefined,
    showFullProject:
      options.showFullProject ??
      (showFullProjectParam ? showFullProjectParam !== "false" : true),
    widgetStartView: options.widgetStartView,
    subProjectSlug: options.subProjectSlug,
    showFloatingButton:
      options.showFloatingButton ??
      (showFloatingButtonParam ? showFloatingButtonParam !== "false" : true),
    floatingButtonSide:
      options.floatingButtonSide ??
      (floatingButtonSideParam === "left" ? "left" : "right"),
    floatingButtonBottomOffset:
      options.floatingButtonBottomOffset ?? parsedFloatingBottom ?? 40,
    floatingButtonSideOffset:
      options.floatingButtonSideOffset ?? parsedFloatingSide ?? 32,
  };
}

function ensureContainer(): HTMLElement {
  let el = document.getElementById(DEFAULT_CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = DEFAULT_CONTAINER_ID;
    document.body.appendChild(el);
  }
  el.style.boxSizing = "border-box";
  return el;
}

function createShadowRoot(container: HTMLElement): ShadowRoot {
  return container.shadowRoot ?? container.attachShadow({ mode: "open" });
}

function ensureStylesInShadow(shadowRoot: ShadowRoot): Promise<void> {
  return new Promise((resolve) => {
    const existing = shadowRoot.getElementById("gridix-widget-style");
    if (existing) {
      resolve();
      return;
    }

    const widgetVersion =
      typeof __WIDGET_VERSION__ !== "undefined"
        ? __WIDGET_VERSION__
        : Date.now().toString();

    let cssHref = "";

    // Prefer the widget script URL we detected at load time (robust against other 3rd-party "*widget*.js").
    if (WIDGET_SCRIPT_SRC) {
      const scriptUrl = new URL(WIDGET_SCRIPT_SRC);
      const basePath = scriptUrl.pathname.substring(
        0,
        scriptUrl.pathname.lastIndexOf("/"),
      );
      cssHref = `${scriptUrl.origin}${basePath}/style.css?v=${widgetVersion}`;
    }

    if (!cssHref) {
      console.warn(
        "GridixWidget: Could not determine CSS path. Widget may not render correctly.",
      );
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.id = "gridix-widget-style";
    link.rel = "stylesheet";
    link.href = cssHref;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    shadowRoot.appendChild(link);
  });
}

// Лениво подгружаем проект, когда контейнер попадает в зону видимости
function lazyLoadWithObserver(
  container: HTMLElement,
  initFn: () => Promise<void>,
  rootMargin: string = "100px",
): void {
  if (!("IntersectionObserver" in window)) {
    console.warn(
      "GridixWidget: IntersectionObserver not supported, loading immediately",
    );
    void initFn();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void initFn();
        }
      });
    },
    {
      rootMargin,
      threshold: 0.01,
    },
  );

  observer.observe(container);
}

function WidgetEmbeddedSubProject(props: { projectId: string }) {
  const { projectId } = props;
  const { subSlug } = useParams<{ subSlug: string }>();
  if (!subSlug) return null;
  return (
    <ProjectApartmentSelector
      projectId={projectId}
      subProjectSlug={subSlug}
      isWidget={true}
    />
  );
}

function WidgetProjectRoutes(props: {
  projectId: string;
  initialPath: string;
}) {
  const { projectId, initialPath } = props;
  return (
    <div className="h-full bg-background text-foreground">
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/"
            element={
              <ProjectApartmentSelector projectId={projectId} isWidget={true} />
            }
          />
          <Route
            path="/p/:subSlug"
            element={<WidgetEmbeddedSubProject projectId={projectId} />}
          />
        </Routes>
      </MemoryRouter>
    </div>
  );
}

// Быстрая инициализация только парящей кнопки
async function initFloatingButton(opts: InitOptions) {
  try {
    if (!opts.projectId || opts.showFloatingButton === false) {
      return;
    }

    const container = ensureContainer();
    const shadowRoot = createShadowRoot(container);
    await ensureStylesInShadow(shadowRoot);

    let buttonMount = shadowRoot.getElementById("gridix-floating-button-root");
    if (!buttonMount) {
      buttonMount = document.createElement("div");
      buttonMount.id = "gridix-floating-button-root";
      shadowRoot.appendChild(buttonMount);
    }

    // Устанавливаем язык в i18n, если он указан
    if (opts.lang && opts.lang in LANGUAGE_CONFIG) {
      await i18n.changeLanguage(opts.lang);
    }

    const root = createRoot(buttonMount);

    root.render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={widgetQueryClient}>
          <MemoryRouter>
            <AuthProvider>
              <FloatingProjectButton
                projectId={opts.projectId as string}
                side={
                  opts.floatingButtonSide as FloatingProjectButtonProps["side"]
                }
                bottomOffset={opts.floatingButtonBottomOffset}
                sideOffset={opts.floatingButtonSideOffset}
              />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    );
  } catch (err) {
    console.error("GridixWidget floating button init error:", err);
  }
}

// Полная инициализация виджета проекта
async function initInternal(opts: InitOptions) {
  // Если явно указано не показывать полный проект, просто выходим.
  // Парящая кнопка уже инициализируется отдельно в init().
  if (opts.showFullProject === false) {
    return;
  }

  const container = ensureContainer();
  const shadowRoot = createShadowRoot(container);
  await ensureStylesInShadow(shadowRoot);

  let mountPoint = shadowRoot.getElementById("gridix-mount-point");
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "gridix-mount-point";
    mountPoint.style.height = "100%";
    mountPoint.style.width = "100%";
    mountPoint.style.display = "contents";
    shadowRoot.appendChild(mountPoint);
  }

  let portalContainer = shadowRoot.getElementById("gridix-portal-container");
  if (!portalContainer) {
    portalContainer = document.createElement("div");
    portalContainer.id = "gridix-portal-container";
    portalContainer.style.position = "relative";
    portalContainer.style.zIndex = "9999";
    shadowRoot.appendChild(portalContainer);
  }

  // Устанавливаем язык в i18n, если он указан
  if (opts.lang && opts.lang in LANGUAGE_CONFIG) {
    await i18n.changeLanguage(opts.lang);
  }

  const root = createRoot(mountPoint);
  root.render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={widgetQueryClient}>
        <AuthProvider>
          <WidgetProjectRoutes
            projectId={opts.projectId as string}
            initialPath={buildWidgetInitialPath({
              subProjectSlug: opts.subProjectSlug,
              widgetStartView: opts.widgetStartView,
            })}
          />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

// Публичный метод: инициализация виджета
async function init(options: InitOptions = {}) {
  const resolved = buildInitOptions(options);

  // Парящая кнопка всегда появляется сразу
  void initFloatingButton(resolved);

  // Сам проект подгружается лениво при попадании контейнера в зону видимости
  const container = ensureContainer();
  lazyLoadWithObserver(container, () => initInternal(resolved));
}

// Глобальный API
declare global {
  interface Window {
    GridixWidget: {
      init: typeof init;
    };
  }
}

const GridixWidgetAPI = { init };

if (typeof window !== "undefined") {
  window.GridixWidget = GridixWidgetAPI;
}

export default GridixWidgetAPI;
