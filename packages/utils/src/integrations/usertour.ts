import i18n from "i18next"

type UsertourClient = {
  init: (token: string) => void
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void> | void
  start: (contentId: string, options?: { once?: boolean; continue?: boolean }) => Promise<void> | void
  reset: () => void
  endAll: () => Promise<void> | void
  setBaseZIndex: (zIndex: number) => void
  on: (eventName: string, listener: (...args: unknown[]) => void) => void
  off: (eventName: string, listener: (...args: unknown[]) => void) => void
  track: (eventName: string, properties?: Record<string, unknown>, option?: Record<string, unknown>) => void
}

export type IdentifyPayload = {
  userId: string
  email?: string | null
  name?: string | null
  signedUpAt?: string | null
  companyName?: string | null
  phone?: string | null
  accountType?: string | null
}

let initialized = false

let usertourClient: UsertourClient | null = null
let usertourImportPromise: Promise<UsertourClient> | null = null

let uiBlocked = false
const uiBlockedListeners = new Set<() => void>()

function setUiBlocked(next: boolean) {
  if (uiBlocked === next) return
  uiBlocked = next
  uiBlockedListeners.forEach((cb) => cb())
}

async function nextAnimationFrame(): Promise<void> {
  if (typeof window === "undefined") return
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
}

export function getUsertourUiBlocked(): boolean {
  return uiBlocked
}

export function subscribeUsertourUiBlocked(cb: () => void): () => void {
  uiBlockedListeners.add(cb)
  return () => uiBlockedListeners.delete(cb)
}

function getUsertourToken(): string | undefined {
  const token = import.meta.env.VITE_USERTOUR_TOKEN
  return typeof token === "string" && token.trim().length > 0 ? token.trim() : undefined
}

type UsertourContentIds = {
  adminOnboarding: string
  projectCreation: string
  projectEditor: string
}

const USERTOUR_CONTENT_IDS: { ru: UsertourContentIds; nonRu: UsertourContentIds } = {
  ru: {
    adminOnboarding: "cmkcdaumb02t8a6t6f333mcva",
    projectCreation: "cmkdvb55y047exqpewbq40e7n",
    projectEditor: "cmkdzv67404dpxqpe9nubbaq0",
  },
  nonRu: {
    adminOnboarding: "cmkqppnk50f13a6t6nbbmxw75",
    projectCreation: "cmkqt5rdq0f43a6t6wxxiz7dd",
    projectEditor: "cmkqpp8yb0f06a6t6jjub9jyq",
  },
}

function isRussianLanguage(): boolean {
  const lng = (i18n.resolvedLanguage ?? i18n.language ?? "").toLowerCase()
  return lng === "ru" || lng.startsWith("ru-")
}

function getAdminOnboardingContentId(): string | undefined {
  return isRussianLanguage()
    ? USERTOUR_CONTENT_IDS.ru.adminOnboarding
    : USERTOUR_CONTENT_IDS.nonRu.adminOnboarding
}

function getProjectCreationContentId(): string | undefined {
  return isRussianLanguage()
    ? USERTOUR_CONTENT_IDS.ru.projectCreation
    : USERTOUR_CONTENT_IDS.nonRu.projectCreation
}

function getProjectEditorContentId(): string | undefined {
  return isRussianLanguage()
    ? USERTOUR_CONTENT_IDS.ru.projectEditor
    : USERTOUR_CONTENT_IDS.nonRu.projectEditor
}

function getPartnersContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_PARTNERS_CONTENT_ID
  return typeof contentId === "string" && contentId.trim().length > 0 ? contentId.trim() : undefined
}

function getAdminChecklistContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID
  return typeof contentId === "string" && contentId.trim().length > 0 ? contentId.trim() : undefined
}

function getProjectChecklistContentId(): string | undefined {
  const contentId = import.meta.env.VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID
  return typeof contentId === "string" && contentId.trim().length > 0 ? contentId.trim() : undefined
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export function isDevTourMode(): boolean {
  if (!isBrowser()) return false
  try {
    const url = new URL(window.location.href)
    const qp = url.searchParams.get("dev_tour")

    if (qp === "true" || qp === "1") return true
  } catch {
    // ignore
  }

  const env = import.meta.env.VITE_USERTOUR_DEV_TOUR

  return env === "true" || env === "1"
}

async function loadUsertourClient(): Promise<UsertourClient> {
  if (!isBrowser()) {
    throw new Error("Usertour can only be loaded in the browser")
  }

  if (usertourClient) return usertourClient
  if (usertourImportPromise) return usertourImportPromise

  usertourImportPromise = import("usertour.js").then((mod) => {
    const client = ((mod as unknown as { default?: UsertourClient }).default ??
      (mod as unknown as UsertourClient)) as UsertourClient
    usertourClient = client
    return client
  })

  return usertourImportPromise
}

async function getPreparedUsertourClient(): Promise<UsertourClient | null> {
  if (!isBrowser()) return null

  const client = await loadUsertourClient()
  if (!initialized) {
    const token = getUsertourToken()
    if (!token) return client

    client.init(token)
    client.setBaseZIndex(2000000)
    initialized = true
  }
  return client
}

async function withUiBlocked<T>(fn: () => Promise<T>): Promise<T> {
  setUiBlocked(true)
  try {
    return await fn()
  } finally {
    setUiBlocked(false)
  }
}

/**
 * Deprecated: left for backward compatibility. We no longer eagerly load the SDK on app start.
 */
export function initUsertour(): void {
  // no-op
}

async function identifyImpl(client: UsertourClient, payload: IdentifyPayload): Promise<void> {
  const userId = payload.userId
  if (!userId) return

  await client.identify(userId, {
    email: payload.email ?? undefined,
    name: payload.name ?? undefined,
    signed_up_at: payload.signedUpAt ?? undefined,
  })
}

async function getAuthedUserId(): Promise<string | null> {
  if (!isBrowser()) return null
  try {
    const { supabase } = await import("../api/supabase")
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Identify user (fire-and-forget)
 */
export async function identifyUsertourUser(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return
  const client = await getPreparedUsertourClient()
  if (!client) return
  await identifyImpl(client, payload)
}

export async function trackUsertourEvent(params: {
  eventName: string
  properties?: Record<string, unknown>
  identify?: IdentifyPayload
  /**
   * If provided, we will only emit this event once per browser (localStorage).
   * This prevents spamming Usertour from effects and repeated renders.
   */
  onceKey?: string
}): Promise<void> {
  if (!isBrowser()) return

  const { eventName, properties, identify, onceKey } = params
  if (!eventName) return

  const storageKey = onceKey ? `usertour_once:${onceKey}` : null
  if (storageKey && safeLocalStorageGet(storageKey) === "1") return

  try {
    const client = await getPreparedUsertourClient()
    if (!client) return

    const userId = identify?.userId ?? (await getAuthedUserId())
    if (userId) {
      await client.identify(userId, {
        [eventName]: true,
        [`${eventName}_at`]: new Date().toISOString(),
      })
      if (identify?.userId) {
        await identifyImpl(client, identify)
      }
    }

    client.track?.(eventName, properties ?? {}, {})

    if (storageKey) safeLocalStorageSet(storageKey, "1")
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Failed to track usertour event:", eventName, e)
  }
}

export async function endAllFlows(): Promise<void> {
  if (!isBrowser()) return
  const client = await getPreparedUsertourClient()
  if (!client) return
  await client.endAll?.()
}

export async function startAdminOnboardingTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getAdminOnboardingContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return

    await identifyImpl(client, payload)
    await client.start(contentId, { continue: true, once: true })
    await nextAnimationFrame()
  })
}

export async function startProjectCreationTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getProjectCreationContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return
    await identifyImpl(client, payload)
    await client.start(contentId, { once: true })
    await nextAnimationFrame()
  })
}

export async function startProjectEditorTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getProjectEditorContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return
    await identifyImpl(client, payload)
    await client.start(contentId, { once: true })
    await nextAnimationFrame()
  })
}

export async function startPartnersTour(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getPartnersContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return
    await identifyImpl(client, payload)
    await client.start(contentId, { once: true })
    await nextAnimationFrame()
  })
}

export async function startAdminChecklist(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getAdminChecklistContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return
    await identifyImpl(client, payload)
    await client.start(contentId, { once: true, continue: true })
    await nextAnimationFrame()
  })
}

export async function startProjectChecklist(payload: IdentifyPayload): Promise<void> {
  if (!isBrowser()) return

  const contentId = getProjectChecklistContentId()
  if (!contentId) return

  await withUiBlocked(async () => {
    const client = await getPreparedUsertourClient()
    if (!client) return
    await identifyImpl(client, payload)
    await client.start(contentId, { once: true, continue: true })
    await nextAnimationFrame()
  })
}

export function resetUsertour(): void {
  if (!isBrowser()) return

  try {
    usertourClient?.reset?.()
  } finally {
    initialized = false
    setUiBlocked(false)
  }
}

