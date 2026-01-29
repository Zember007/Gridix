import * as r from "react";
import { useLayoutEffect as u } from "react";
var c = typeof document < "u", s = function() {
}, l = c ? u : s;
const a = {
  ...r
}, i = a.useInsertionEffect, E = i || ((e) => e());
function p(e) {
  const t = r.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return E(() => {
    t.current = e;
  }), r.useCallback(function() {
    for (var o = arguments.length, f = new Array(o), n = 0; n < o; n++)
      f[n] = arguments[n];
    return t.current == null ? void 0 : t.current(...f);
  }, []);
}
export {
  p as useEffectEvent,
  l as useModernLayoutEffect
};
//# sourceMappingURL=annotorious-react.es19.js.map
