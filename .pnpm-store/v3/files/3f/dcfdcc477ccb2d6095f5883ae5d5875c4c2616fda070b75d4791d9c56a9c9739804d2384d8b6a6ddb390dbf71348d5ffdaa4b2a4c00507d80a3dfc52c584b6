const m = Math.min, p = Math.max, j = Math.round, C = Math.floor, L = (t) => ({
  x: t,
  y: t
}), h = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, x = {
  start: "end",
  end: "start"
};
function E(t, e, n) {
  return p(t, m(e, n));
}
function R(t, e) {
  return typeof t == "function" ? t(e) : t;
}
function a(t) {
  return t.split("-")[0];
}
function g(t) {
  return t.split("-")[1];
}
function b(t) {
  return t === "x" ? "y" : "x";
}
function d(t) {
  return t === "y" ? "height" : "width";
}
const A = /* @__PURE__ */ new Set(["top", "bottom"]);
function P(t) {
  return A.has(a(t)) ? "y" : "x";
}
function y(t) {
  return b(P(t));
}
function T(t, e, n) {
  n === void 0 && (n = !1);
  const r = g(t), i = y(t), o = d(i);
  let c = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return e.reference[o] > e.floating[o] && (c = f(c)), [c, f(c)];
}
function k(t) {
  const e = f(t);
  return [s(t), e, s(e)];
}
function s(t) {
  return t.replace(/start|end/g, (e) => x[e]);
}
const u = ["left", "right"], l = ["right", "left"], M = ["top", "bottom"], O = ["bottom", "top"];
function S(t, e, n) {
  switch (t) {
    case "top":
    case "bottom":
      return n ? e ? l : u : e ? u : l;
    case "left":
    case "right":
      return e ? M : O;
    default:
      return [];
  }
}
function q(t, e, n, r) {
  const i = g(t);
  let o = S(a(t), n === "start", r);
  return i && (o = o.map((c) => c + "-" + i), e && (o = o.concat(o.map(s)))), o;
}
function f(t) {
  return t.replace(/left|right|bottom|top/g, (e) => h[e]);
}
function w(t) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...t
  };
}
function z(t) {
  return typeof t != "number" ? w(t) : {
    top: t,
    right: t,
    bottom: t,
    left: t
  };
}
function B(t) {
  const {
    x: e,
    y: n,
    width: r,
    height: i
  } = t;
  return {
    width: r,
    height: i,
    top: n,
    left: e,
    right: e + r,
    bottom: n + i,
    x: e,
    y: n
  };
}
export {
  E as clamp,
  L as createCoords,
  R as evaluate,
  w as expandPaddingObject,
  C as floor,
  g as getAlignment,
  y as getAlignmentAxis,
  T as getAlignmentSides,
  d as getAxisLength,
  k as getExpandedPlacements,
  s as getOppositeAlignmentPlacement,
  b as getOppositeAxis,
  q as getOppositeAxisPlacements,
  f as getOppositePlacement,
  z as getPaddingObject,
  a as getSide,
  P as getSideAxis,
  p as max,
  m as min,
  B as rectToClientRect,
  j as round
};
//# sourceMappingURL=annotorious-react.es24.js.map
