type UsertourClient = {
  init: (token: string) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void> | void;
  start: (contentId: string, options?: { continue?: boolean }) => void;
  reset: () => void;
  endAll: () => void;
  setBaseZIndex: (zIndex: number) => void;
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

async function prepareUsertour(opts: { blockUi: boolean }): Promise<UsertourClient | null> {
  if (!isBrowser()) return null;

  if (opts.blockUi) setUiBlocked(true);
  try {
    const client = await loadUsertourClient();
    if (!initialized) {
      const token = getUsertourToken();
      if (!token) return client;
      client.init(token);
      client.setBaseZIndex(2000000);
      initialized = true;
    }
    return client;
  } finally {
    if (opts.blockUi) setUiBlocked(false);
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
  const client = await prepareUsertour({ blockUi: false });
  if (!client) return;
  await identifyImpl(client, payload);
}

export async function endAllFlows(): Promise<void> {
  if (!isBrowser()) return;
  const client = await prepareUsertour({ blockUi: false });
  if (!client) return;
  client.endAll();
}

/**
 * Start admin onboarding
 */
export async function startAdminOnboardingTour(payload: IdentifyPayload): Promise<void> {

  if (!isBrowser()) return;

  const contentId = getAdminOnboardingContentId();
  if (!contentId) return;


  const client = await prepareUsertour({ blockUi: true });
  if (!client) return;
  await identifyImpl(client, payload);
  client.start(contentId);
}

export async function startProjectCreationTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getProjectCreationContentId();
  if (!contentId) return;

  const client = await prepareUsertour({ blockUi: true });
  if (!client) return;
  await identifyImpl(client, payload);
  client.start(contentId);
}

export async function startProjectEditorTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getProjectEditorContentId();
  if (!contentId) return;

  const client = await prepareUsertour({ blockUi: true });
  if (!client) return;
  await identifyImpl(client, payload);
  client.start(contentId);
}

export async function startPartnersTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getPartnersContentId();
  if (!contentId) return;

  const client = await prepareUsertour({ blockUi: true });
  if (!client) return;
  await identifyImpl(client, payload);
  client.start(contentId);
}


export function resetUsertour(): void {
  if (!isBrowser()) return;

  try {
    usertourClient?.reset?.();
  } finally {
    initialized = false;
    lastIdentifiedUserId = null;
    setUiBlocked(false);
  }
}
