import { createRoot } from 'react-dom/client';
import { EmbedLanguageProvider } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, Language } from '@/lib/language-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';
import EmbedProjectsPage from '@/pages/EmbedProjectsPage';
import { createContext, useContext } from 'react';
import '@/index.css';

// Type declaration for build-time injected version
declare const __WIDGET_VERSION__: string;

// Context to provide Shadow Root container for portals
const ShadowRootContext = createContext<HTMLElement | null>(null);

export const useShadowRoot = () => useContext(ShadowRootContext);

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
};

const DEFAULT_CONTAINER_ID = 'gridix-widget-root';

function ensureContainer(containerId?: string): HTMLElement {
  const id = containerId || DEFAULT_CONTAINER_ID;
  let el = document.getElementById(id);
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
      resolve();
      return;
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
    const widgetVersion = typeof __WIDGET_VERSION__ !== 'undefined' ? __WIDGET_VERSION__ : Date.now().toString();

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
    : <EmbedProjectsPage 
        UserId={userId}
        isWidget={true}
        compactMode={compactMode}
        showHeader={showHeader}
        showFilters={showFilters}
        maxHeight={height}
      />;

  return (
    <ShadowRootContext.Provider value={portalContainer}>
      <EmbedLanguageProvider initialLanguage={initialLang}>
        <div className={`h-full bg-background text-foreground ${theme === 'dark' ? 'dark' : ''}`}>
          {content}
        </div>
      </EmbedLanguageProvider>
    </ShadowRootContext.Provider>
  );
}

async function init(options: InitOptions = {}) {
  try {
    // Allow URL params to override or provide defaults if not passed explicitly
    const url = new URL(window.location.href);
    const qp = url.searchParams;

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
    };

    // Create container and shadow DOM
    const container = ensureContainer(opts.containerId);
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

// Expose global API
declare global {
  interface Window {
    GridixWidget: {
      init: typeof init;
    };
  }
}

// Ensure window object exists (for SSR compatibility)
if (typeof window !== 'undefined') {
  window.GridixWidget = { init };
}

// Export for module usage
export { init };
export default { init };


