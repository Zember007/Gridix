import usertour from 'usertour.js';

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

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Init once
 */
export function initUsertour(): void {
  if (!isBrowser()) return;
  if (initialized) return;

  const token = getUsertourToken();
  if (!token) return;

  usertour.init(token);
  initialized = true;
}

/**
 * Identify user (fire-and-forget)
 */
export async function identifyUsertourUser(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const userId = payload.userId;
  if (!userId) return;


  if (lastIdentifiedUserId === userId) return;

  await usertour.identify(userId, {
    email: payload.email ?? undefined,
    name: payload.name ?? undefined,
    signed_up_at: payload.signedUpAt ?? undefined,
  });

  lastIdentifiedUserId = userId;
}

/**
 * Start admin onboarding
 */
export async function startAdminOnboardingTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return;

  const contentId = getAdminOnboardingContentId();
  if (!contentId) return;


  usertour.start(contentId, {
    continue: true
  });
}

/**
 * Reset on logout
 */
export function resetUsertour(): void {
  if (!isBrowser()) return;

  try {
    usertour.reset();
  } finally {
    initialized = false;
    lastIdentifiedUserId = null;
  }
}
