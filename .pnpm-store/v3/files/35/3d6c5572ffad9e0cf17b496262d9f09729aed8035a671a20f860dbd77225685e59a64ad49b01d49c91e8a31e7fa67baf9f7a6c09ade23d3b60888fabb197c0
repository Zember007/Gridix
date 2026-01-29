import * as r from "react";
import { useModernLayoutEffect as O, useEffectEvent as X } from "./annotorious-react.es19.js";
import { jsxs as Y, jsx as P } from "react/jsx-runtime";
import { isElement as I, getComputedStyle as q } from "./annotorious-react.es20.js";
import { getOverflowAncestors as pe } from "./annotorious-react.es20.js";
import "react-dom";
import { useFloating as Q } from "./annotorious-react.es17.js";
import { arrow as he, flip as xe, inline as ve, offset as Ce, shift as we } from "./annotorious-react.es17.js";
const Z = {
  ...r
};
let V = !1, z = 0;
const W = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + z++
);
function G() {
  const [t, o] = r.useState(() => V ? W() : void 0);
  return O(() => {
    t == null && o(W());
  }, []), r.useEffect(() => {
    V = !0;
  }, []), t;
}
const J = Z.useId, $ = J || G;
let M;
process.env.NODE_ENV !== "production" && (M = /* @__PURE__ */ new Set());
function K() {
  for (var t, o = arguments.length, l = new Array(o), e = 0; e < o; e++)
    l[e] = arguments[e];
  const s = "Floating UI: " + l.join(" ");
  if (!((t = M) != null && t.has(s))) {
    var c;
    (c = M) == null || c.add(s), console.warn(s);
  }
}
function _() {
  for (var t, o = arguments.length, l = new Array(o), e = 0; e < o; e++)
    l[e] = arguments[e];
  const s = "Floating UI: " + l.join(" ");
  if (!((t = M) != null && t.has(s))) {
    var c;
    (c = M) == null || c.add(s), console.error(s);
  }
}
const ue = /* @__PURE__ */ r.forwardRef(function(o, l) {
  const {
    context: {
      placement: e,
      elements: {
        floating: s
      },
      middlewareData: {
        arrow: c,
        shift: u
      }
    },
    width: f = 14,
    height: a = 7,
    tipRadius: F = 0,
    strokeWidth: d = 0,
    staticOffset: g,
    stroke: R,
    d: n,
    style: {
      transform: p,
      ...h
    } = {},
    ...x
  } = o;
  process.env.NODE_ENV !== "production" && (l || K("The `ref` prop is required for `FloatingArrow`."));
  const v = $(), [E, i] = r.useState(!1);
  if (O(() => {
    if (!s) return;
    q(s).direction === "rtl" && i(!0);
  }, [s]), !s)
    return null;
  const [m, D] = e.split("-"), N = m === "top" || m === "bottom";
  let S = g;
  (N && u != null && u.x || !N && u != null && u.y) && (S = null);
  const C = d * 2, b = C / 2, T = f / 2 * (F / -8 + 1), y = a / 2 * F / 4, w = !!n, k = S && D === "end" ? "bottom" : "top";
  let A = S && D === "end" ? "right" : "left";
  S && E && (A = D === "end" ? "left" : "right");
  const B = (c == null ? void 0 : c.x) != null ? S || c.x : "", U = (c == null ? void 0 : c.y) != null ? S || c.y : "", L = n || "M0,0" + (" H" + f) + (" L" + (f - T) + "," + (a - y)) + (" Q" + f / 2 + "," + a + " " + T + "," + (a - y)) + " Z", H = {
    top: w ? "rotate(180deg)" : "",
    left: w ? "rotate(90deg)" : "rotate(-90deg)",
    bottom: w ? "" : "rotate(180deg)",
    right: w ? "rotate(-90deg)" : "rotate(90deg)"
  }[m];
  return /* @__PURE__ */ Y("svg", {
    ...x,
    "aria-hidden": !0,
    ref: l,
    width: w ? f : f + C,
    height: f,
    viewBox: "0 0 " + f + " " + (a > f ? a : f),
    style: {
      position: "absolute",
      pointerEvents: "none",
      [A]: B,
      [k]: U,
      [m]: N || w ? "100%" : "calc(100% - " + C / 2 + "px)",
      transform: [H, p].filter((j) => !!j).join(" "),
      ...h
    },
    children: [C > 0 && /* @__PURE__ */ P("path", {
      clipPath: "url(#" + v + ")",
      fill: "none",
      stroke: R,
      strokeWidth: C + (n ? 0 : 1),
      d: L
    }), /* @__PURE__ */ P("path", {
      stroke: C && !n ? x.fill : "none",
      d: L
    }), /* @__PURE__ */ P("clipPath", {
      id: v,
      children: /* @__PURE__ */ P("rect", {
        x: -b,
        y: b * (w ? -1 : 1),
        width: f + C,
        height: f
      })
    })]
  });
});
function ee() {
  const t = /* @__PURE__ */ new Map();
  return {
    emit(o, l) {
      var e;
      (e = t.get(o)) == null || e.forEach((s) => s(l));
    },
    on(o, l) {
      t.has(o) || t.set(o, /* @__PURE__ */ new Set()), t.get(o).add(l);
    },
    off(o, l) {
      var e;
      (e = t.get(o)) == null || e.delete(l);
    }
  };
}
const te = /* @__PURE__ */ r.createContext(null), ne = /* @__PURE__ */ r.createContext(null), oe = () => {
  var t;
  return ((t = r.useContext(te)) == null ? void 0 : t.id) || null;
}, re = () => r.useContext(ne);
function se(t) {
  const {
    open: o = !1,
    onOpenChange: l,
    elements: e
  } = t, s = $(), c = r.useRef({}), [u] = r.useState(() => ee()), f = oe() != null;
  if (process.env.NODE_ENV !== "production") {
    const n = e.reference;
    n && !I(n) && _("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [a, F] = r.useState(e.reference), d = X((n, p, h) => {
    c.current.openEvent = n ? p : void 0, u.emit("openchange", {
      open: n,
      event: p,
      reason: h,
      nested: f
    }), l == null || l(n, p, h);
  }), g = r.useMemo(() => ({
    setPositionReference: F
  }), []), R = r.useMemo(() => ({
    reference: a || e.reference || null,
    floating: e.floating || null,
    domReference: e.reference
  }), [a, e.reference, e.floating]);
  return r.useMemo(() => ({
    dataRef: c,
    open: o,
    onOpenChange: d,
    elements: R,
    events: u,
    floatingId: s,
    refs: g
  }), [o, d, R, u, s, g]);
}
function de(t) {
  t === void 0 && (t = {});
  const {
    nodeId: o
  } = t, l = se({
    ...t,
    elements: {
      reference: null,
      floating: null,
      ...t.elements
    }
  }), e = t.rootContext || l, s = e.elements, [c, u] = r.useState(null), [f, a] = r.useState(null), d = (s == null ? void 0 : s.domReference) || c, g = r.useRef(null), R = re();
  O(() => {
    d && (g.current = d);
  }, [d]);
  const n = Q({
    ...t,
    elements: {
      ...s,
      ...f && {
        reference: f
      }
    }
  }), p = r.useCallback((i) => {
    const m = I(i) ? {
      getBoundingClientRect: () => i.getBoundingClientRect(),
      getClientRects: () => i.getClientRects(),
      contextElement: i
    } : i;
    a(m), n.refs.setReference(m);
  }, [n.refs]), h = r.useCallback((i) => {
    (I(i) || i === null) && (g.current = i, u(i)), (I(n.refs.reference.current) || n.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    i !== null && !I(i)) && n.refs.setReference(i);
  }, [n.refs]), x = r.useMemo(() => ({
    ...n.refs,
    setReference: h,
    setPositionReference: p,
    domReference: g
  }), [n.refs, h, p]), v = r.useMemo(() => ({
    ...n.elements,
    domReference: d
  }), [n.elements, d]), E = r.useMemo(() => ({
    ...n,
    ...e,
    refs: x,
    elements: v,
    nodeId: o
  }), [n, x, v, o, e]);
  return O(() => {
    e.dataRef.current.floatingContext = E;
    const i = R == null ? void 0 : R.nodesRef.current.find((m) => m.id === o);
    i && (i.context = E);
  }), r.useMemo(() => ({
    ...n,
    context: E,
    refs: x,
    elements: v
  }), [n, x, v, E]);
}
export {
  ue as FloatingArrow,
  he as arrow,
  xe as flip,
  pe as getOverflowAncestors,
  ve as inline,
  Ce as offset,
  we as shift,
  de as useFloating,
  oe as useFloatingParentNodeId,
  se as useFloatingRootContext,
  re as useFloatingTree,
  $ as useId
};
//# sourceMappingURL=annotorious-react.es14.js.map
