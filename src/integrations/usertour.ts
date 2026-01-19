type UsertourClient = {
  init: (token: string) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void> | void;
  start: (contentId: string, options?: { once?: boolean; continue?: boolean }) => Promise<void> | void;
  reset: () => void;
  endAll: () => Promise<void> | void;
  setBaseZIndex: (zIndex: number) => void;
  on?: (eventName: string, listener: (...args: any[]) => void) => void;
  off?: (eventName: string, listener: (...args: any[]) => void) => void;
};

type IdentifyPayload = {
  userId: string;
  email?: string | null;
  name?: string | null;
  signedUpAt?: string | null;
  companyName?: string | null;
  phone?: string | null;
  accountType?: string | null;
};

type TourLifecycleCallbacks = {
  /**
   * Called only when the flow/content is completed (user reached the end).
   */
  onCompleted?: () => void | Promise<void>;
  /**
   * Called when the flow/content is dismissed/closed (not completed).
   */
  onDismissed?: () => void | Promise<void>;
};

let initialized = false;
let lastIdentifiedUserId: string | null = null;

let usertourClient: UsertourClient | null = null;
let usertourImportPromise: Promise<UsertourClient> | null = null;

let uiBlocked = false;
const uiBlockedListeners = new Set<() => void>();

function setUiBlocked(next: boolean) {
  if (uiBlocked === next) return;
  uiBlocked = next;
  uiBlockedListeners.forEach((cb) => cb());
}

async function nextAnimationFrame(): Promise<void> {
  if (typeof window === 'undefined') return;
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

let activeContentId: string | null = null;
let activeDetach: (() => void) | null = null;

export function getUsertourUiBlocked(): boolean {
  return uiBlocked;
}

export function subscribeUsertourUiBlocked(cb: () => void): () => void {
  uiBlockedListeners.add(cb);
  return () => uiBlockedListeners.delete(cb);
}

function getUsertourToken(): string | undefined {
  const token = import.meta.env.VITE_USERTOUR_TOKEN;
  return typeof token === 'string' && token.trim().length > 0
    ? token.trim()
    : undefined;
}

function getAdminOnboardingContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_ADMIN_ONBOARDING_CONTENT_ID;
  return typeof contentId === 'string' && contentId.trim().length > 0
    ? contentId.trim()
    : undefined;
}

function getProjectCreationContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_PROJECT_CREATION_CONTENT_ID;
  return typeof contentId === 'string' && contentId.trim().length > 0
    ? contentId.trim()
    : undefined;
}

function getProjectEditorContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_PROJECT_EDITOR_CONTENT_ID;
  return typeof contentId === 'string' && contentId.trim().length > 0
    ? contentId.trim()
    : undefined;
}

function getPartnersContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_PARTNERS_CONTENT_ID;
  return typeof contentId === 'string' && contentId.trim().length > 0
    ? contentId.trim()
    : undefined;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isDevTourMode(): boolean {
  if (!isBrowser()) return false;
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('dev_tour');

    if (qp === 'true' || qp === '1') return true;
  } catch {
    // ignore
  }
  


  const env = import.meta.env.VITE_USERTOUR_DEV_TOUR;

  return env === 'true' || env === '1';
}

async function loadUsertourClient(): Promise<UsertourClient> {
  if (!isBrowser()) {
    throw new Error('Usertour can only be loaded in the browser');
  }

  if (usertourClient) return usertourClient;
  if (usertourImportPromise) return usertourImportPromise;

  usertourImportPromise = import('usertour.js').then((mod) => {
    const client = ((mod as unknown as { default?: UsertourClient }).default ??
      (mod as unknown as UsertourClient)) as UsertourClient;
    usertourClient = client;  
    return client;
  });

  return usertourImportPromise;
}

async function getPreparedUsertourClient(): Promise<UsertourClient | null> {
  if (!isBrowser()) return null;

  const client = await loadUsertourClient();
  if (!initialized) {
    const token = getUsertourToken();
    if (!token) return client;
    client.init(token);
    client.setBaseZIndex(2000000);
    initialized = true;
  }
  return client;
}

async function withUiBlocked<T>(fn: () => Promise<T>): Promise<T> {
  setUiBlocked(true);
  try {
    return await fn();
  } finally {
    setUiBlocked(false);
  }
}

/**
 * Deprecated: left for backward compatibility. We no longer eagerly load the SDK on app start.
 */
export function initUsertour(): void {
  // no-op
}

async function identifyImpl(client: UsertourClient, payload: IdentifyPayload): Promise<void> {
  const userId = payload.userId;
  if (!userId) return;

  if (lastIdentifiedUserId === userId) return;

  await client.identify(userId, {
    email: payload.email ?? undefined,
    name: payload.name ?? undefined,
    signed_up_at: payload.signedUpAt ?? undefined,
  });

  lastIdentifiedUserId = userId;
}

/**
 * Identify user (fire-and-forget)
 */
export async function identifyUsertourUser(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;
  console.log('identifyUsertourUser');
  const client = await getPreparedUsertourClient();
  if (!client) return;
  await identifyImpl(client, payload);
}

export async function endAllFlows(): Promise<void> {
  if (!isBrowser()) return;
  const client = await getPreparedUsertourClient();
  if (!client) return;
  await client.endAll?.();
}

function matchesActiveContentId(contentId: string, args: any[]): boolean {
  if (!args.length) return activeContentId === contentId;

  for (const arg of args) {
    if (arg === contentId) return true;
    if (typeof arg === 'string' && arg === contentId) return true;
    if (arg && typeof arg === 'object') {
      const maybe =
        // common naming guesses
        (arg as any).contentId ??
        (arg as any).content_id ??
        (arg as any).flowId ??
        (arg as any).flow_id ??
        (arg as any).id ??
        (arg as any).content?.id ??
        (arg as any).flow?.id;
      if (typeof maybe === 'string' && maybe === contentId) return true;
    }
  }
  return false;
}

function attachLifecycleListeners(
  client: UsertourClient,
  contentId: string,
  callbacks: TourLifecycleCallbacks,
): () => void {
  const on = client.on?.bind(client);
  const off = client.off?.bind(client);
  if (!on || !off) return () => {};

  let settled = false;
  const settle = async (kind: 'completed' | 'dismissed') => {
    if (settled) return;
    settled = true;
    try {
      if (kind === 'completed') await callbacks.onCompleted?.();
      else await callbacks.onDismissed?.();
    } catch (e) {
      console.warn(`Usertour ${kind} callback failed:`, e);
    } finally {
      cleanup();
    }
  };

  // The loader package doesn't document actual event names; we support a small
  // set of likely names (colon and dot variants).
  const completedEvents = [
    'flow:completed',
    'flow.completed',
    'content:completed',
    'content.completed',
    'tour:completed',
    'tour.completed',
  ];
  const dismissedEvents = [
    'flow:dismissed',
    'flow.dismissed',
    'content:dismissed',
    'content.dismissed',
    'tour:dismissed',
    'tour.dismissed',
    'flow:closed',
    'flow.closed',
    'content:closed',
    'content.closed',
    'tour:closed',
    'tour.closed',
  ];

  const listeners: Array<{ event: string; fn: (...args: any[]) => void }> = [];

  for (const event of completedEvents) {
    const fn = (...args: any[]) => {
      if (!matchesActiveContentId(contentId, args)) return;
      void settle('completed');
    };
    on(event, fn);
    listeners.push({ event, fn });
  }

  for (const event of dismissedEvents) {
    const fn = (...args: any[]) => {
      if (!matchesActiveContentId(contentId, args)) return;
      void settle('dismissed');
    };
    on(event, fn);
    listeners.push({ event, fn });
  }

  const cleanup = () => {
    for (const { event, fn } of listeners) {
      off(event, fn);
    }
  };

  return cleanup;
}

/**
 * Start admin onboarding
 */
export async function startAdminOnboardingTour(
  payload: IdentifyPayload & TourLifecycleCallbacks,
): Promise<void> {

  if (!isBrowser()) return;

  const contentId = getAdminOnboardingContentId();
  if (!contentId) return;

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient();
    if (!client) return;

    activeContentId = contentId;
    activeDetach?.();
    activeDetach = null;
    const detach = attachLifecycleListeners(client, contentId, payload);
    activeDetach = detach;

    try {
      await identifyImpl(client, payload);
      await client.start(contentId, { once: true, continue: true });
      // Ensure our overlay doesn't disappear before the tour UI has a chance to paint.
      await nextAnimationFrame();
    } catch (e) {
      // If the SDK failed to start, remove listeners to avoid leaks.
      detach();
      if (activeDetach === detach) activeDetach = null;
      throw e;
    }
  });
}

export async function startProjectCreationTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getProjectCreationContentId();
  if (!contentId) return;

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient();
    if (!client) return;
    activeContentId = contentId;
    activeDetach?.();
    activeDetach = null;
    await identifyImpl(client, payload);
    await client.start(contentId, { once: true, continue: true });
    await nextAnimationFrame();
  });
}

export async function startProjectEditorTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getProjectEditorContentId();
  if (!contentId) return;

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient();
    if (!client) return;
    activeContentId = contentId;
    activeDetach?.();
    activeDetach = null;
    await identifyImpl(client, payload);
    await client.start(contentId, { once: true, continue: true });
    await nextAnimationFrame();
  });
}

export async function startPartnersTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getPartnersContentId();
  if (!contentId) return;

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient();
    if (!client) return;
    activeContentId = contentId;
    activeDetach?.();
    activeDetach = null;
    await identifyImpl(client, payload);
    await client.start(contentId, { once: true, continue: true });
    await nextAnimationFrame();
  });
}


export function resetUsertour(): void {
  if (!isBrowser()) return;

  try {
    usertourClient?.reset?.();
  } finally {
    initialized = false;
    lastIdentifiedUserId = null;
    activeContentId = null;
    activeDetach?.();
    activeDetach = null;
    setUiBlocked(false);
  }
}
