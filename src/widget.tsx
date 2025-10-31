import { createRoot } from 'react-dom/client';
import { EmbedLanguageProvider } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, Language } from '@/lib/language-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';
import EmbedProjectsPage from '@/pages/EmbedProjectsPage';
import { createContext } from 'react';
import '@/index.css';

// Type declaration for build-time injected version
declare const __WIDGET_VERSION__: string;

// Global window extensions for widget
declare global {
  interface Window {
    __GRIDIX_WIDGET_STYLES__?: string;
    __GRIDIX_WIDGET_VERSION__?: string;
  }
}

// Context to provide Shadow Root container for portals (internal use only)
const ShadowRootContext = createContext<HTMLElement | null>(null);

type InitOptions = {
  projectId?: string; // slug or UUID
  userId?: string; // to render gallery of user's public projects
  lang?: string; // ru | en | ka | ar
  containerId?: string; // custom container id if needed
  theme?: 'light' | 'dark' | 'auto';
  width?: string; // e.g. '100%'
  height?: string; // e.g. '700px'
  cssUrl?: string; // optional explicit URL to style.css
  inlineStyles?: string; // optional inline CSS styles as string
  compactMode?: boolean; // enable compact layout for smaller containers
  showHeader?: boolean; // show/hide header section
  showFilters?: boolean; // show/hide filters section
  forceReload?: boolean; // force reload of cached resources
  cacheBust?: string; // custom cache busting parameter
  delay?: number; // delay in milliseconds before loading (e.g. 1000 for 1 second)
  lazy?: boolean; // lazy load when widget enters viewport (uses Intersection Observer)
  loadOnInteraction?: boolean; // load widget only after user interaction (scroll, click, touch)
  intersectionRootMargin?: string; // margin for Intersection Observer (e.g. '100px' or '50%')
};

const DEFAULT_CONTAINER_ID = 'gridix-widget-root';

function ensureContainer(containerId?: string, forceReload?: boolean): HTMLElement {
  const id = containerId || DEFAULT_CONTAINER_ID;
  let el = document.getElementById(id);

  // Force reload: clear existing container and shadow DOM
  if (el && forceReload) {
    // Clear any existing shadow root
    if (el.shadowRoot) {
      el.shadowRoot.innerHTML = '';
    }
    // Clear container content
    el.innerHTML = '';
    console.log('GridixWidget: Cleared existing container for force reload');
  }

  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

function applyContainerStyles(el: HTMLElement, opts?: InitOptions) {
  if (opts?.width) el.style.width = opts.width;
  /* if (opts?.height) el.style.height = opts.height; */
  el.style.boxSizing = 'border-box';
}

function createShadowRoot(container: HTMLElement): ShadowRoot {
  // Check if shadow root already exists
  if (container.shadowRoot) {
    return container.shadowRoot;
  }
  // Create shadow DOM for style isolation
  return container.attachShadow({ mode: 'open' });
}

function ensureStylesInShadow(shadowRoot: ShadowRoot, options: InitOptions): Promise<void> {
  return new Promise((resolve) => {
    // Check if styles already loaded in shadow root
    const existing = shadowRoot.getElementById('gridix-widget-style');
    if (existing) {
      // Force reload if cache busting is requested
      if (options.forceReload) {
        existing.remove();
      } else {
        resolve();
        return;
      }
    }

    // If inline styles provided, use them directly
    if (options.inlineStyles) {
      const style = document.createElement('style');
      style.id = 'gridix-widget-style';
      style.textContent = options.inlineStyles;
      shadowRoot.appendChild(style);
      console.log('GridixWidget: Inline styles applied');
      resolve();
      return;
    }

    // Get widget version for cache busting
    const buildVersion = typeof __WIDGET_VERSION__ !== 'undefined' ? __WIDGET_VERSION__ : Date.now().toString();
    const runtimeVersion = typeof window !== 'undefined' && window.__GRIDIX_WIDGET_VERSION__ ? window.__GRIDIX_WIDGET_VERSION__ : null;
    const customCacheBust = options.cacheBust || options.forceReload ? Date.now().toString() : null;
    const widgetVersion = customCacheBust || runtimeVersion || buildVersion;

    // Prefer explicit cssUrl if provided
    let cssHref = options.cssUrl || '';

    if (!cssHref) {
      // Try to derive from the script tag that loaded widget.js
      const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
      const widgetScript = scripts.reverse().find(s => s.src && /widget\.js(\?.*)?$/.test(s.src));
      if (widgetScript && widgetScript.src) {
        cssHref = widgetScript.src.replace(/widget\.js(\?.*)?$/, `style.css?v=${widgetVersion}`);
      }
    }

    // Fallback: look for existing style.css in the same directory as widget.js
    if (!cssHref) {
      const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
      const widgetScript = scripts.reverse().find(s => s.src && /widget/.test(s.src));
      if (widgetScript && widgetScript.src) {
        const scriptUrl = new URL(widgetScript.src);
        const basePath = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
        cssHref = `${scriptUrl.origin}${basePath}/style.css?v=${widgetVersion}`;
      }
    }

    // Add version to cssHref if not already present
    if (cssHref && !cssHref.includes('?v=')) {
      cssHref += `?v=${widgetVersion}`;
    }

    if (!cssHref) {
      console.warn('GridixWidget: Could not determine CSS path. Widget may not render correctly.');
      resolve();
      return;
    }

    console.log('GridixWidget: Loading CSS from:', cssHref);

    const link = document.createElement('link');
    link.id = 'gridix-widget-style';
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.onload = () => {
      console.log('GridixWidget: CSS loaded successfully');
      resolve();
    };
    link.onerror = (err) => {
      console.error('GridixWidget: Failed to load CSS from:', cssHref, err);
      resolve();
    };
    shadowRoot.appendChild(link);
  });
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lazy load using Intersection Observer
function lazyLoadWithObserver(
  container: HTMLElement,
  initFn: () => Promise<void>,
  rootMargin: string = '100px'
): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load immediately if IntersectionObserver is not supported
    console.warn('GridixWidget: IntersectionObserver not supported, loading immediately');
    initFn();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          console.log('GridixWidget: Widget entered viewport, loading...');
          initFn();
        }
      });
    },
    {
      rootMargin,
      threshold: 0.01, // Trigger when at least 1% of the element is visible
    }
  );

  observer.observe(container);
  console.log('GridixWidget: Lazy loading enabled, waiting for widget to enter viewport');
}

// Load on user interaction
function loadOnInteraction(initFn: () => Promise<void>): void {
  let loaded = false;
  const loadOnce = () => {
    if (loaded) return;
    loaded = true;
    console.log('GridixWidget: User interaction detected, loading widget...');
    initFn();
  };

  // Listen for various user interactions
  const events = ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'];
  events.forEach((event) => {
    document.addEventListener(event, loadOnce, { once: true, passive: true });
  });

  console.log('GridixWidget: Waiting for user interaction to load widget...');
}

function WidgetApp(props: InitOptions & { portalContainer: HTMLElement }) {
  const {
    projectId,
    userId,
    compactMode = false,
    showHeader = true,
    showFilters = true,
    lang,
    height,
    theme = 'light',
    portalContainer
  } = props;

  const initialLang: Language | undefined =
    lang && (lang in LANGUAGE_CONFIG) ? (lang as Language) : undefined;

  const content = projectId
    ? <ProjectApartmentSelector projectId={projectId} isWidget={true} />
    : userId ? (
      <EmbedProjectsPage
        UserId={userId}
        isWidget={true}
        compactMode={compactMode}
        showHeader={showHeader}
        showFilters={showFilters}
        {...(height ? { maxHeight: height } : {})}
      />
    ) : null;

  const languageProviderProps = initialLang !== undefined
    ? { initialLanguage: initialLang }
    : {};

  return (
    <ShadowRootContext.Provider value={portalContainer}>
      <EmbedLanguageProvider {...languageProviderProps}>
        <div className={`h-full bg-background text-foreground ${theme === 'dark' ? 'dark' : ''}`}>
          {content}
        </div>
      </EmbedLanguageProvider>
    </ShadowRootContext.Provider>
  );
}

// Internal initialization function (contains the actual logic)
async function initInternal(options: InitOptions = {}) {
  try {
    // Check if cache should be cleared due to version change
    const needsCacheClear = shouldClearCache();
    if (needsCacheClear) {
      console.log('GridixWidget: Cache will be cleared due to version/data changes');
    }

    // For development/testing: always clear cache if no explicit forceReload is set
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const shouldForceReload = isDevelopment && !options.forceReload;

    // Allow URL params to override or provide defaults if not passed explicitly
    const url = new URL(window.location.href);
    const qp = url.searchParams;

    // Parse delay from URL params if needed
    const delayParam = qp.get('delay');
    const parsedDelay = delayParam ? parseInt(delayParam, 10) : undefined;
    const validDelay = parsedDelay !== undefined && !isNaN(parsedDelay) && parsedDelay > 0 ? parsedDelay : undefined;

    const opts: InitOptions = {
      projectId: options.projectId ?? qp.get('projectId') ?? undefined,
      userId: options.userId ?? qp.get('userId') ?? undefined,
      lang: options.lang ?? qp.get('lang') ?? undefined,
      containerId: options.containerId ?? undefined,
      theme: options.theme ?? (qp.get('theme') as 'light' | 'dark' | 'auto') ?? 'light',
      width: options.width ?? qp.get('width') ?? '100%',
      height: options.height ?? qp.get('height') ?? '600px',
      cssUrl: options.cssUrl ?? qp.get('cssUrl') ?? undefined,
      inlineStyles: options.inlineStyles ?? undefined,
      compactMode: options.compactMode ?? (qp.get('compactMode') === 'true'),
      showHeader: options.showHeader ?? (qp.get('showHeader') !== 'false'),
      showFilters: options.showFilters ?? (qp.get('showFilters') !== 'false'),
      forceReload: options.forceReload ?? ((qp.get('forceReload') === 'true') || needsCacheClear || shouldForceReload),
      cacheBust: options.cacheBust ?? qp.get('cacheBust') ?? undefined,
      delay: options.delay ?? validDelay,
      lazy: options.lazy ?? (qp.get('lazy') === 'true'),
      loadOnInteraction: options.loadOnInteraction ?? (qp.get('loadOnInteraction') === 'true'),
      intersectionRootMargin: options.intersectionRootMargin ?? qp.get('intersectionRootMargin') ?? '100px',
    } as InitOptions;

    // Create container and shadow DOM
    const container = ensureContainer(opts.containerId, opts.forceReload);
    applyContainerStyles(container, opts);

    const shadowRoot = createShadowRoot(container);

    // Ensure CSS is loaded into shadow DOM before rendering
    await ensureStylesInShadow(shadowRoot, opts);

    // Create a mount point inside shadow DOM
    let mountPoint = shadowRoot.getElementById('gridix-mount-point');
    if (!mountPoint) {
      mountPoint = document.createElement('div');
      mountPoint.id = 'gridix-mount-point';
      mountPoint.style.height = '100%';
      mountPoint.style.width = '100%';
      mountPoint.style.display = 'contents'; // Allow styles to flow through

      // Apply CSS variables to the mount point for better Shadow DOM support
      // This ensures Tailwind CSS variables work inside Shadow DOM
      mountPoint.className = opts.theme === 'dark' ? 'dark' : '';

      shadowRoot.appendChild(mountPoint);
    } else {
      // Update theme class if remounting
      mountPoint.className = opts.theme === 'dark' ? 'dark' : '';
    }

    // Create portal container for modals inside shadow DOM
    let portalContainer = shadowRoot.getElementById('gridix-portal-container');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'gridix-portal-container';
      portalContainer.style.position = 'relative';
      portalContainer.style.zIndex = '9999';
      shadowRoot.appendChild(portalContainer);
    }

    // Render React app into shadow DOM
    const root = createRoot(mountPoint);
    root.render(
      <AuthProvider>
        <WidgetApp {...opts} portalContainer={portalContainer} />
      </AuthProvider>
    );
  } catch (err) {
    console.error('GridixWidget init error:', err);
  }
}

// Public initialization function with lazy loading support
async function init(options: InitOptions = {}) {
  // Allow URL params to provide lazy loading options if not passed explicitly
  const url = new URL(window.location.href);
  const qp = url.searchParams;

  // Parse options from URL params if not provided
  const delayParam = qp.get('delay');
  const parsedDelay = delayParam ? parseInt(delayParam, 10) : undefined;
  const validDelay = parsedDelay !== undefined && !isNaN(parsedDelay) && parsedDelay > 0 ? parsedDelay : undefined;

  // const delayValue = options.delay ?? validDelay;
  //  const lazyValue = options.lazy ?? (qp.get('lazy') === 'true');
  //  const loadOnInteractionValue = options.loadOnInteraction ?? (qp.get('loadOnInteraction') === 'true');
  
  const delayValue = 500;
  const lazyValue = true;
  const loadOnInteractionValue = false;

  const intersectionRootMargin = options.intersectionRootMargin ?? qp.get('intersectionRootMargin') ?? '100px';

  if (loadOnInteractionValue) {
    loadOnInteraction(() => initInternal(options));
    return;
  }

  // If lazy loading is enabled, use Intersection Observer
  if (lazyValue) {
    // Create container first to observe it
    const containerId = options.containerId || DEFAULT_CONTAINER_ID;
    const container = ensureContainer(containerId, false);
    applyContainerStyles(container, options);

    lazyLoadWithObserver(
      container,
      () => initInternal(options),
      intersectionRootMargin
    );
    return;
  }

  // If delay is specified, wait before loading
  if (delayValue !== undefined && delayValue > 0) {
    console.log(`GridixWidget: Delaying load by ${delayValue}ms...`);
    await delay(delayValue);
  }

  // Load immediately if no lazy loading options are set
  await initInternal(options);
}

// Global cache clearing function
function clearWidgetCache(containerId?: string) {
  const id = containerId || DEFAULT_CONTAINER_ID;
  const el = document.getElementById(id);
  if (el) {
    // Clear shadow DOM
    if (el.shadowRoot) {
      el.shadowRoot.innerHTML = '';
    }
    // Clear container
    el.innerHTML = '';
    console.log('GridixWidget: Cache cleared for container', id);
  }

  // Clear all widget-related localStorage entries
  try {
    localStorage.removeItem('gridix-widget-version');
    localStorage.removeItem('gridix-widget-last-check');
    localStorage.removeItem('gridix-widget-load-count');
    console.log('GridixWidget: All localStorage cache entries cleared');
  } catch (error) {
    console.warn('GridixWidget: Error clearing localStorage:', error);
  }
}

// Check if cache needs to be cleared based on version change
function shouldClearCache(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const currentVersion = typeof __WIDGET_VERSION__ !== 'undefined' ? __WIDGET_VERSION__ : null;
    const runtimeVersion = window.__GRIDIX_WIDGET_VERSION__;
    const storedVersion = localStorage.getItem('gridix-widget-version');

    // Determine the effective version to use
    const effectiveVersion = runtimeVersion || currentVersion;

    // If no stored version, this is first load
    if (!storedVersion) {
      if (effectiveVersion) {
        localStorage.setItem('gridix-widget-version', effectiveVersion);
        console.log('GridixWidget: First load, version stored:', effectiveVersion);
      }
      return false;
    }

    // If versions don't match, clear cache
    if (effectiveVersion && storedVersion !== effectiveVersion) {
      localStorage.setItem('gridix-widget-version', effectiveVersion);
      console.log('GridixWidget: Version mismatch detected:', storedVersion, '->', effectiveVersion);
      return true;
    }

    // Check for data freshness - clear cache if data is stale
    const lastDataCheck = localStorage.getItem('gridix-widget-last-check');
    const now = Date.now();
    const DATA_FRESHNESS_CHECK = 30 * 1000; // 30 seconds for more frequent updates

    if (!lastDataCheck || (now - parseInt(lastDataCheck)) > DATA_FRESHNESS_CHECK) {
      localStorage.setItem('gridix-widget-last-check', now.toString());
      console.log('GridixWidget: Data freshness check - clearing cache');
      return true;
    }

    // Force cache clear on every 5th load to ensure fresh data
    const loadCount = parseInt(localStorage.getItem('gridix-widget-load-count') || '0') + 1;
    localStorage.setItem('gridix-widget-load-count', loadCount.toString());

    if (loadCount % 5 === 0) {
      console.log('GridixWidget: Periodic cache clear (every 5 loads)');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('GridixWidget: Error checking version, assuming cache should be cleared:', error);
    return true;
  }
}

// Expose global API
declare global {
  interface Window {
    GridixWidget: {
      init: typeof init;
      clearCache: typeof clearWidgetCache;
    };
  }
}

// Create widget API object
const GridixWidgetAPI = { init, clearCache: clearWidgetCache };

// Ensure window object exists (for SSR compatibility)
if (typeof window !== 'undefined') {
  window.GridixWidget = GridixWidgetAPI;
}

// Export only default for IIFE format
export default GridixWidgetAPI;


