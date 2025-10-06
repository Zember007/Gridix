import React from 'react';
import { createRoot } from 'react-dom/client';
import { EmbedLanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';
import EmbedProjectsPage from '@/pages/EmbedProjectsPage';
import '@/index.css';

type InitOptions = {
  projectId?: string; // slug or UUID
  userId?: string; // to render gallery of user's public projects
  lang?: string; // ru | en | ka | ar
  containerId?: string; // custom container id if needed
  theme?: 'light' | 'dark' | 'auto';
  width?: string; // e.g. '100%'
  height?: string; // e.g. '700px'
  cssUrl?: string; // optional explicit URL to style.css
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
  el.style.display = 'block';
}

/**
 * Creates a Shadow DOM for complete style isolation
 */
function createShadowRoot(hostElement: HTMLElement): { shadowRoot: ShadowRoot; mountPoint: HTMLElement } {
  // Attach shadow DOM in "open" mode for accessibility
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });
  
  // Create mount point inside shadow DOM
  const mountPoint = document.createElement('div');
  mountPoint.id = 'gridix-widget-mount';
  mountPoint.style.width = '100%';
  mountPoint.style.height = '100%';
  mountPoint.style.display = 'block';
  
  shadowRoot.appendChild(mountPoint);
  
  return { shadowRoot, mountPoint };
}

/**
 * Loads styles into the Shadow DOM for complete isolation
 */
function loadStylesIntoShadow(shadowRoot: ShadowRoot, options: InitOptions): Promise<void> {
  return new Promise((resolve) => {
    // Prefer explicit cssUrl if provided
    let cssHref = options.cssUrl || '';

    if (!cssHref) {
      // Try to derive from the script tag that loaded widget.js
      const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
      const widgetScript = scripts.reverse().find(s => s.src && /widget\.js(\?.*)?$/.test(s.src));
      if (widgetScript && widgetScript.src) {
        cssHref = widgetScript.src.replace(/widget\.js(\?.*)?$/, 'style.css$1');
      }
    }

    if (!cssHref) {
      console.warn('[GridixWidget] Could not resolve CSS URL. Widget may not display correctly.');
      resolve();
      return;
    }

    // Create style link inside shadow DOM
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.onload = () => {
      console.log('[GridixWidget] Styles loaded successfully');
      resolve();
    };
    link.onerror = (err) => {
      console.error('[GridixWidget] Failed to load styles:', err);
      resolve(); // continue even if CSS fails to load
    };
    
    // Prepend to shadow root so styles load first
    shadowRoot.prepend(link);
  });
}

function WidgetApp(props: InitOptions) {
  const { 
    projectId, 
    userId, 
    compactMode = false, 
    showHeader = true, 
    showFilters = true,
    height 
  } = props;

  const content = projectId
    ? <ProjectApartmentSelector projectId={projectId} />
    : <EmbedProjectsPage 
        UserId={userId}
        isWidget={true}
        compactMode={compactMode}
        showHeader={showHeader}
        showFilters={showFilters}
        maxHeight={height}
      />;

  return (
    <EmbedLanguageProvider>
      <div className="h-full bg-background">
        {content}
      </div>
    </EmbedLanguageProvider>
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
      compactMode: options.compactMode ?? (qp.get('compactMode') === 'true'),
      showHeader: options.showHeader ?? (qp.get('showHeader') !== 'false'),
      showFilters: options.showFilters ?? (qp.get('showFilters') !== 'false'),
    };

    // Get or create host container
    const hostContainer = ensureContainer(opts.containerId);
    applyContainerStyles(hostContainer, opts);

    // Create Shadow DOM for style isolation
    const { shadowRoot, mountPoint } = createShadowRoot(hostContainer);

    // Load styles into Shadow DOM
    await loadStylesIntoShadow(shadowRoot, opts);

    // Render React app inside Shadow DOM
    const root = createRoot(mountPoint);
    root.render(
      <AuthProvider>
        <WidgetApp {...opts} />
      </AuthProvider>
    );

    console.log('[GridixWidget] Initialized successfully with Shadow DOM isolation');
  } catch (err) {
    console.error('[GridixWidget] Init error:', err);
  }
}

// Expose global API
// @ts-expect-error - Adding to global window object
window.GridixWidget = { init };

export {};


