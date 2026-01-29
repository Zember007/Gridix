import type {ConditionalKeys} from 'type-fest'
import {detectBrowserTarget} from './detect-browser-target'

interface WindowWithUsertour extends Window {
  usertour?: Usertour

  USERTOURJS_QUEUE?: [string, Deferred | null, any[]][]
  USERTOURJS_ENV_VARS?: Record<string, any>
}

export interface Usertour {
  _stubbed: boolean

  load: () => Promise<void>

  init: (token: string) => void

  identify: (
    userId: string,
    attributes?: Attributes,
    opts?: IdentifyOptions
  ) => Promise<void>

  identifyAnonymous: (
    attributes?: Attributes,
    opts?: IdentifyOptions
  ) => Promise<void>

  updateUser: (attributes: Attributes, opts?: IdentifyOptions) => Promise<void>

  group: (
    groupId: string,
    attributes?: Attributes,
    opts?: GroupOptions
  ) => Promise<void>

  updateGroup: (attributes: Attributes, opts?: GroupOptions) => Promise<void>

  track(
    name: string,
    attributes?: EventAttributes,
    opts?: TrackOptions
  ): Promise<void>

  isIdentified: () => boolean

  start: (contentId: string, opts?: StartOptions) => Promise<void>

  isStarted: (contentId: string) => boolean

  endAll: () => Promise<void>

  reset: () => void

  remount: () => void

  // eslint-disable-next-line es5/no-rest-parameters
  on(eventName: string, listener: (...args: any[]) => void): void

  // eslint-disable-next-line es5/no-rest-parameters
  off(eventName: string, listener: (...args: any[]) => void): void

  setCustomInputSelector(customInputSelector: string | null): void

  registerCustomInput(
    cssSelector: string,
    getValue?: (el: Element) => string
  ): void

  setCustomNavigate(customNavigate: ((url: string) => void) | null): void

  setUrlFilter(urlFilter: ((url: string) => string) | null): void

  setLinkUrlDecorator(linkUrlDecorator: ((url: string) => string) | null): void

  setInferenceAttributeNames(attributeNames: string[]): void

  setInferenceAttributeFilter(
    attributeName: string,
    filters: StringFilters
  ): void

  setInferenceClassNameFilter(filters: StringFilters): void

  setScrollPadding(scrollPadding: ScrollPadding | null): void

  setCustomScrollIntoView(scrollIntoView: ((el: Element) => void) | null): void

  _setTargetEnv(targetEnv: unknown): void

  setShadowDomEnabled(shadowDomEnabled: boolean): void

  setPageTrackingDisabled(pageTrackingDisabled: boolean): void

  setBaseZIndex(baseZIndex: number): void

  setSessionTimeout(hours: number): void

  setTargetMissingSeconds(seconds: number): void

  setServerEndpoint(serverEndpoint: string | null | undefined): void

  disableEvalJs(): void
}

export interface Attributes {
  [name: string]: AttributeLiteralOrList | AttributeChange
}

type AttributeLiteral = string | number | boolean | null | undefined
type AttributeLiteralOrList = AttributeLiteral | AttributeLiteral[]

interface AttributeChange {
  set?: AttributeLiteralOrList
  set_once?: AttributeLiteralOrList
  add?: string | number
  subtract?: string | number
  append?: AttributeLiteralOrList
  prepend?: AttributeLiteralOrList
  remove?: AttributeLiteralOrList
  data_type?: AttributeDataType
}

type AttributeDataType = 'string' | 'boolean' | 'number' | 'datetime' | 'list'

export type IdentifyOptions = {
  signature?: string
}

export interface GroupOptions {
  signature?: string
  membership?: Attributes
}

export interface EventAttributes {
  [name: string]: AttributeLiteral | EventAttributeChange
}

interface EventAttributeChange {
  set?: AttributeLiteral
  data_type?: AttributeDataType
}

export interface TrackOptions {
  userOnly?: boolean
}

export interface StartOptions {
  once?: boolean
  continue?: boolean
}

export interface ResourceCenterState {
  isOpen: boolean
  hasChecklist: boolean
  uncompletedChecklistTaskCount: number
  unreadAnnouncementCount: number
}

interface ScrollPadding {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

type StringFilter = ((className: string) => boolean) | RegExp

type StringFilters = StringFilter | StringFilter[]

interface Deferred {
  resolve: () => void
  reject: (e: any) => void
}

var w: WindowWithUsertour = typeof window === 'undefined' ? ({} as any) : window
var usertour = w.usertour

if (!usertour) {
  var urlPrefix = 'https://js.usertour.io/'

  // Initialize as an empty object (methods will be stubbed below)
  var loadPromise: Promise<void> | null = null
  usertour = w.usertour = {
    _stubbed: true,
    // Helper to inject the proper Usertour.js script/module into the document
    load: function (): Promise<void> {
      // Make sure we only load Usertour.js once
      if (!loadPromise) {
        loadPromise = new Promise(function (resolve, reject) {
          var script = document.createElement('script')
          script.async = true
          // Detect if the browser supports es2020
          var envVars = w.USERTOURJS_ENV_VARS || {}
          var browserTarget =
            envVars.USERTOURJS_BROWSER_TARGET ||
            detectBrowserTarget(navigator.userAgent)
          if (browserTarget === 'es2020') {
            script.type = 'module'
            script.src =
              envVars.USERTOURJS_ES2020_URL || urlPrefix + 'es2020/usertour.js'
          } else {
            script.src =
              envVars.USERTOURJS_LEGACY_URL ||
              urlPrefix + 'legacy/usertour.iife.js'
          }
          script.onload = function () {
            resolve()
          }
          script.onerror = function () {
            document.head.removeChild(script)
            loadPromise = null
            var e = new Error('Could not load Usertour.js')
            console.warn(e.message)
            reject(e)
          }
          document.head.appendChild(script)
        })
      }
      return loadPromise
    }
  } as Usertour

  // Initialize the queue, which will be flushed by Usertour.js when it loads
  var q = (w.USERTOURJS_QUEUE = w.USERTOURJS_QUEUE || [])

  /**
   * Helper to stub void-returning methods that should be queued
   */
  var stubVoid = function (
    // eslint-disable-next-line es5/no-rest-parameters
    method: ConditionalKeys<Usertour, (...args: any[]) => void>
  ) {
    // @ts-ignore
    usertour![method] = function () {
      var args = Array.prototype.slice.call(arguments)
      usertour!.load()
      q.push([method, null, args])
    } as any
  }

  // Helper to stub promise-returning methods that should be queued
  var stubPromise = function (
    // eslint-disable-next-line es5/no-rest-parameters
    method: ConditionalKeys<Usertour, (...args: any[]) => Promise<void>>
  ) {
    // @ts-ignore
    usertour![method] = function () {
      var args = Array.prototype.slice.call(arguments)
      usertour!.load()
      var deferred: Deferred
      var promise = new Promise<void>(function (resolve, reject) {
        deferred = {resolve: resolve, reject: reject}
      })
      q.push([method, deferred!, args])
      return promise
    } as any
  }

  // Helper to stub methods that MUST return a value synchronously, and
  // therefore must support using a default callback until Usertour.js is
  // loaded.
  var stubDefault = function (
    method: ConditionalKeys<Usertour, (...args: any[]) => any>,
    returnValue: any
  ) {
    // @ts-ignore
    usertour![method] = function () {
      return returnValue
    }
  }

  // Methods that return void and should be queued
  stubVoid('init')
  stubVoid('off')
  stubVoid('on')
  stubVoid('reset')
  stubVoid('setBaseZIndex')
  stubVoid('setSessionTimeout')
  stubVoid('setTargetMissingSeconds')
  stubVoid('setCustomInputSelector')
  stubVoid('setCustomNavigate')
  stubVoid('setCustomScrollIntoView')
  stubVoid('setInferenceAttributeFilter')
  stubVoid('setInferenceAttributeNames')
  stubVoid('setInferenceClassNameFilter')
  stubVoid('setScrollPadding')
  stubVoid('setServerEndpoint')
  stubVoid('setShadowDomEnabled')
  stubVoid('setPageTrackingDisabled')
  stubVoid('setUrlFilter')
  stubVoid('setLinkUrlDecorator')

  // Methods that return promises and should be queued
  stubPromise('endAll')
  stubPromise('group')
  stubPromise('identify')
  stubPromise('identifyAnonymous')
  stubPromise('start')
  stubPromise('track')
  stubPromise('updateGroup')
  stubPromise('updateUser')

  // Methods that synchronously return and can be stubbed with default return
  // values and are not queued
  stubDefault('isIdentified', false)
  stubDefault('isStarted',  false)
}

export default usertour!
