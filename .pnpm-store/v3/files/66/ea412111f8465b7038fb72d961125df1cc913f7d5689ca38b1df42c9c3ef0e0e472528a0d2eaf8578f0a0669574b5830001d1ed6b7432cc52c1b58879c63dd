type BrowserTarget = 'es2020' | 'legacy';
/**
 * Returns `es2020` if the browser supports ES2020 features, `legacy` otherwise.
 *
 * It would be better to detect features, but there's no way to test e.g. if
 * dynamic imports are available in containing apps that may prevent `eval` via
 * their Content-Security-Policy.
 *
 * It's important that we don't mistake a legacy browser as es2020 (since that
 * may cause us to run an incompatible version), but it's okay to mistake an
 * es2020-capable browser and serve them the legacy version.
 *
 * The browser version numbers are based off of caniuse.com data of browsers
 * supporting ALL of the the following features:
 * - https://caniuse.com/es6-module-dynamic-import
 * - https://caniuse.com/mdn-javascript_operators_nullish_coalescing
 * - https://caniuse.com/mdn-javascript_operators_optional_chaining
 * - https://caniuse.com/bigint
 * - https://caniuse.com/mdn-javascript_builtins_promise_allsettled
 * - https://caniuse.com/mdn-javascript_builtins_globalthis
 * - https://caniuse.com/mdn-javascript_builtins_string_matchall
 */
export declare function detectBrowserTarget(agent: string): BrowserTarget;
export {};
