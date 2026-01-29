import { inline as I, offset as J, flip as K, shift as N, arrow as L, computePosition as Q } from "./annotorious-react.es16.js";
import { autoUpdate as ce, platform as ae } from "./annotorious-react.es16.js";
import * as o from "react";
import { useLayoutEffect as T } from "react";
import * as X from "react-dom";
var Y = typeof document < "u", Z = function() {
}, R = Y ? T : Z;
function h(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, s;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (r = n; r-- !== 0; )
        if (!h(e[r], t[r]))
          return !1;
      return !0;
    }
    if (s = Object.keys(e), n = s.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, s[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const p = s[r];
      if (!(p === "_owner" && e.$$typeof) && !h(e[p], t[p]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function q(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function A(e, t) {
  const n = q(e);
  return Math.round(t * n) / n;
}
function k(e) {
  const t = o.useRef(e);
  return R(() => {
    t.current = e;
  }), t;
}
function ne(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: s,
    elements: {
      reference: p,
      floating: B
    } = {},
    transform: D = !0,
    whileElementsMounted: E,
    open: x
  } = e, [i, C] = o.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [M, U] = o.useState(r);
  h(M, r) || U(r);
  const [V, W] = o.useState(null), [z, G] = o.useState(null), O = o.useCallback((f) => {
    f !== a.current && (a.current = f, W(f));
  }, []), _ = o.useCallback((f) => {
    f !== d.current && (d.current = f, G(f));
  }, []), u = p || V, l = B || z, a = o.useRef(null), d = o.useRef(null), y = o.useRef(i), H = E != null, P = k(E), S = k(s), v = k(x), g = o.useCallback(() => {
    if (!a.current || !d.current)
      return;
    const f = {
      placement: t,
      strategy: n,
      middleware: M
    };
    S.current && (f.platform = S.current), Q(a.current, d.current, f).then((w) => {
      const m = {
        ...w,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: v.current !== !1
      };
      $.current && !h(y.current, m) && (y.current = m, X.flushSync(() => {
        C(m);
      }));
    });
  }, [M, t, n, S, v]);
  R(() => {
    x === !1 && y.current.isPositioned && (y.current.isPositioned = !1, C((f) => ({
      ...f,
      isPositioned: !1
    })));
  }, [x]);
  const $ = o.useRef(!1);
  R(() => ($.current = !0, () => {
    $.current = !1;
  }), []), R(() => {
    if (u && (a.current = u), l && (d.current = l), u && l) {
      if (P.current)
        return P.current(u, l, g);
      g();
    }
  }, [u, l, g, P, H]);
  const F = o.useMemo(() => ({
    reference: a,
    floating: d,
    setReference: O,
    setFloating: _
  }), [O, _]), c = o.useMemo(() => ({
    reference: u,
    floating: l
  }), [u, l]), j = o.useMemo(() => {
    const f = {
      position: n,
      left: 0,
      top: 0
    };
    if (!c.floating)
      return f;
    const w = A(c.floating, i.x), m = A(c.floating, i.y);
    return D ? {
      ...f,
      transform: "translate(" + w + "px, " + m + "px)",
      ...q(c.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: w,
      top: m
    };
  }, [n, D, c.floating, i.x, i.y]);
  return o.useMemo(() => ({
    ...i,
    update: g,
    refs: F,
    elements: c,
    floatingStyles: j
  }), [i, g, F, c, j]);
}
const b = (e) => {
  function t(n) {
    return {}.hasOwnProperty.call(n, "current");
  }
  return {
    name: "arrow",
    options: e,
    fn(n) {
      const {
        element: r,
        padding: s
      } = typeof e == "function" ? e(n) : e;
      return r && t(r) ? r.current != null ? L({
        element: r.current,
        padding: s
      }).fn(n) : {} : r ? L({
        element: r,
        padding: s
      }).fn(n) : {};
    }
  };
}, re = (e, t) => ({
  ...J(e),
  options: [e, t]
}), oe = (e, t) => ({
  ...N(e),
  options: [e, t]
}), fe = (e, t) => ({
  ...K(e),
  options: [e, t]
}), se = (e, t) => ({
  ...I(e),
  options: [e, t]
}), ie = (e, t) => ({
  ...b(e),
  options: [e, t]
});
export {
  ie as arrow,
  ce as autoUpdate,
  Q as computePosition,
  fe as flip,
  se as inline,
  re as offset,
  ae as platform,
  oe as shift,
  ne as useFloating
};
//# sourceMappingURL=annotorious-react.es17.js.map
