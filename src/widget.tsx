import { createRoot } from 'react-dom/client';
import { EmbedLanguageProvider } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, Language } from '@/lib/language-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';
import '@/index.css';
import {
  FloatingProjectButton,
  FloatingProjectButtonProps,
} from '@/components/widget/FloatingProjectButton';


// Используется только для версионирования style.css
declare const __WIDGET_VERSION__: string;

type InitOptions = {
  // Основные параметры
  projectId?: string | undefined; // slug или UUID проекта
  lang?: string | undefined; // ru | en | ka | ar
  showFullProject?: boolean | undefined; // показывать полный проект в виджете

  // Настройки парящей кнопки
  showFloatingButton?: boolean; // показывать/скрывать кнопку
  floatingButtonSide?: 'left' | 'right'; // сторона кнопки
  floatingButtonBottomOffset?: number; // отступ от низа (px)
  floatingButtonSideOffset?: number; // отступ от боковой стороны (px)
};

const DEFAULT_CONTAINER_ID = 'gridix-widget-root';

function buildInitOptions(options: InitOptions = {}): InitOptions {
  const url = new URL(window.location.href);
  const qp = url.searchParams;

  const showFloatingButtonParam = qp.get('showFloatingButton');
  const floatingButtonSideParam = qp.get('floatingButtonSide');
  const floatingButtonBottomOffsetParam = qp.get('floatingButtonBottomOffset');
  const floatingButtonSideOffsetParam = qp.get('floatingButtonSideOffset');
   const showFullProjectParam = qp.get('showFullProject');

  const parsedFloatingBottom = floatingButtonBottomOffsetParam
    ? parseInt(floatingButtonBottomOffsetParam, 10)
    : undefined;
  const parsedFloatingSide = floatingButtonSideOffsetParam
    ? parseInt(floatingButtonSideOffsetParam, 10)
    : undefined;

  return {
    projectId: options.projectId ?? qp.get('projectId') ?? undefined,
    lang: options.lang ?? qp.get('lang') ?? undefined,
    showFullProject:
      options.showFullProject ??
      (showFullProjectParam ? showFullProjectParam !== 'false' : true),
    showFloatingButton:
      options.showFloatingButton ??
      (showFloatingButtonParam ? showFloatingButtonParam !== 'false' : true),
    floatingButtonSide:
      options.floatingButtonSide ??
      (floatingButtonSideParam === 'left' ? 'left' : 'right'),
    floatingButtonBottomOffset:
      options.floatingButtonBottomOffset ?? parsedFloatingBottom ?? 40,
    floatingButtonSideOffset:
      options.floatingButtonSideOffset ?? parsedFloatingSide ?? 32,
  };
}

function ensureContainer(): HTMLElement {
  let el = document.getElementById(DEFAULT_CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = DEFAULT_CONTAINER_ID;
    document.body.appendChild(el);
  }
  el.style.boxSizing = 'border-box';
  return el;
}

function createShadowRoot(container: HTMLElement): ShadowRoot {
  return container.shadowRoot ?? container.attachShadow({ mode: 'open' });
}

function ensureStylesInShadow(shadowRoot: ShadowRoot): Promise<void> {
  return new Promise((resolve) => {
    const existing = shadowRoot.getElementById('gridix-widget-style');
    if (existing) {
      resolve();
      return;
    }

    const widgetVersion =
      typeof __WIDGET_VERSION__ !== 'undefined'
        ? __WIDGET_VERSION__
        : Date.now().toString();

    let cssHref = '';

    // Пытаемся найти скрипт widget.js и построить путь к style.css
    const scripts = Array.from(
      document.getElementsByTagName('script')
    ) as HTMLScriptElement[];
    const widgetScript = scripts
      .reverse()
      .find((s) => s.src && /widget\.js(\?.*)?$/.test(s.src));
    if (widgetScript && widgetScript.src) {
      cssHref = widgetScript.src.replace(
        /widget\.js(\?.*)?$/,
        `style.css?v=${widgetVersion}`
      );
    }

    // Фоллбек: ищем любой скрипт с "widget" в пути
    if (!cssHref) {
      const scriptsFallback = Array.from(
        document.getElementsByTagName('script')
      ) as HTMLScriptElement[];
      const widgetScriptFallback = scriptsFallback
        .reverse()
        .find((s) => s.src && /widget/.test(s.src));
      if (widgetScriptFallback && widgetScriptFallback.src) {
        const scriptUrl = new URL(widgetScriptFallback.src);
        const basePath = scriptUrl.pathname.substring(
          0,
          scriptUrl.pathname.lastIndexOf('/')
        );
        cssHref = `${scriptUrl.origin}${basePath}/style.css?v=${widgetVersion}`;
      }
    }

    if (!cssHref) {
      console.warn(
        'GridixWidget: Could not determine CSS path. Widget may not render correctly.'
      );
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = 'gridix-widget-style';
    link.rel = 'stylesheet';
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
  rootMargin: string = '100px'
): void {
  if (!('IntersectionObserver' in window)) {
    console.warn(
      'GridixWidget: IntersectionObserver not supported, loading immediately'
    );
    void initFn();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          console.log('GridixWidget: Widget entered viewport, loading...');
          void initFn();
        }
      });
    },
    {
      rootMargin,
      threshold: 0.01,
    }
  );

  observer.observe(container);
  console.log(
    'GridixWidget: Lazy loading enabled, waiting for widget to enter viewport'
  );
}

function WidgetApp(props: { projectId?: string | undefined; lang?: string | undefined }) {
  const { projectId, lang } = props;

  const initialLang: Language | undefined =
    lang && (lang in LANGUAGE_CONFIG) ? (lang as Language) : undefined;

  if (!projectId) return null;

  const content = (
    <ProjectApartmentSelector
      projectId={projectId}
      isWidget={true}
      showFullProjectInWidget={true}
    />
  );

  const languageProviderProps =
    initialLang !== undefined ? { initialLanguage: initialLang } : {};

  return (
    <EmbedLanguageProvider {...languageProviderProps}>
      <div className="h-full bg-background text-foreground">
        {content}
      </div>
    </EmbedLanguageProvider>
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

    let buttonMount =
      shadowRoot.getElementById('gridix-floating-button-root');
    if (!buttonMount) {
      buttonMount = document.createElement('div');
      buttonMount.id = 'gridix-floating-button-root';
      shadowRoot.appendChild(buttonMount);
    }



    const root = createRoot(buttonMount);
    const initialLang: Language | undefined =
      opts.lang && opts.lang in LANGUAGE_CONFIG
        ? (opts.lang as Language)
        : undefined;
    const languageProviderProps =
      initialLang !== undefined ? { initialLanguage: initialLang } : {};

    root.render(
      <AuthProvider>
        <EmbedLanguageProvider {...languageProviderProps}>
          <FloatingProjectButton
            projectId={opts.projectId as string}
            side={
              opts.floatingButtonSide as FloatingProjectButtonProps['side']
            }
            bottomOffset={opts.floatingButtonBottomOffset}
            sideOffset={opts.floatingButtonSideOffset}
          />
        </EmbedLanguageProvider>
      </AuthProvider>
    );
  } catch (err) {
    console.error('GridixWidget floating button init error:', err);
  }
}

// Полная инициализация виджета проекта
async function initInternal(opts: InitOptions) {
  try {
    // Если явно указано не показывать полный проект, просто выходим.
    // Парящая кнопка уже инициализируется отдельно в init().
    if (opts.showFullProject === false) {
      return;
    }

    const container = ensureContainer();
    const shadowRoot = createShadowRoot(container);
    await ensureStylesInShadow(shadowRoot);

    let mountPoint = shadowRoot.getElementById('gridix-mount-point');
    if (!mountPoint) {
      mountPoint = document.createElement('div');
      mountPoint.id = 'gridix-mount-point';
      mountPoint.style.height = '100%';
      mountPoint.style.width = '100%';
      mountPoint.style.display = 'contents';
      shadowRoot.appendChild(mountPoint);
    }

    let portalContainer = shadowRoot.getElementById('gridix-portal-container');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'gridix-portal-container';
      portalContainer.style.position = 'relative';
      portalContainer.style.zIndex = '9999';
      shadowRoot.appendChild(portalContainer);
    }

    const root = createRoot(mountPoint);
    root.render(
      <AuthProvider>
        <WidgetApp projectId={opts.projectId} lang={opts.lang} />
      </AuthProvider>
    );
  } catch (err) {
    console.error('GridixWidget init error:', err);
  }
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

if (typeof window !== 'undefined') {
  window.GridixWidget = GridixWidgetAPI;
}

export default GridixWidgetAPI;


