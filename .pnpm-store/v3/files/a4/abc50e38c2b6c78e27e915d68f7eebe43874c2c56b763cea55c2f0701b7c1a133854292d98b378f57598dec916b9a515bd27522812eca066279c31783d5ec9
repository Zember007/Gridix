import { inline as st, offset as rt, flip as ct, shift as lt, arrow as ft, computePosition as ut } from "./annotorious-react.es25.js";
import { createCoords as y, rectToClientRect as J, round as D, max as E, min as V, floor as A } from "./annotorious-react.es24.js";
import { getOverflowAncestors as z, isElement as v, getDocumentElement as R, getWindow as L, getFrameElement as U, getComputedStyle as b, isHTMLElement as C, isTopLayer as $, getParentNode as W, isLastTraversableNode as H, isTableElement as ht, isContainingBlock as Q, getContainingBlock as at, getNodeName as _, isOverflowElement as q, getNodeScroll as I, isWebKit as Y } from "./annotorious-react.es20.js";
function Z(t) {
  const e = b(t);
  let o = parseFloat(e.width) || 0, n = parseFloat(e.height) || 0;
  const i = C(t), r = i ? t.offsetWidth : o, s = i ? t.offsetHeight : n, c = D(o) !== r || D(n) !== s;
  return c && (o = r, n = s), {
    width: o,
    height: n,
    $: c
  };
}
function X(t) {
  return v(t) ? t : t.contextElement;
}
function F(t) {
  const e = X(t);
  if (!C(e))
    return y(1);
  const o = e.getBoundingClientRect(), {
    width: n,
    height: i,
    $: r
  } = Z(e);
  let s = (r ? D(o.width) : o.width) / n, c = (r ? D(o.height) : o.height) / i;
  return (!s || !Number.isFinite(s)) && (s = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: s,
    y: c
  };
}
const dt = /* @__PURE__ */ y(0);
function tt(t) {
  const e = L(t);
  return !Y() || !e.visualViewport ? dt : {
    x: e.visualViewport.offsetLeft,
    y: e.visualViewport.offsetTop
  };
}
function gt(t, e, o) {
  return e === void 0 && (e = !1), !o || e && o !== L(t) ? !1 : e;
}
function T(t, e, o, n) {
  e === void 0 && (e = !1), o === void 0 && (o = !1);
  const i = t.getBoundingClientRect(), r = X(t);
  let s = y(1);
  e && (n ? v(n) && (s = F(n)) : s = F(t));
  const c = gt(r, o, n) ? tt(r) : y(0);
  let f = (i.left + c.x) / s.x, l = (i.top + c.y) / s.y, u = i.width / s.x, h = i.height / s.y;
  if (r) {
    const d = L(r), a = n && v(n) ? L(n) : n;
    let w = d, p = U(w);
    for (; p && n && a !== w; ) {
      const m = F(p), g = p.getBoundingClientRect(), x = b(p), O = g.left + (p.clientLeft + parseFloat(x.paddingLeft)) * m.x, S = g.top + (p.clientTop + parseFloat(x.paddingTop)) * m.y;
      f *= m.x, l *= m.y, u *= m.x, h *= m.y, f += O, l += S, w = L(p), p = U(w);
    }
  }
  return J({
    width: u,
    height: h,
    x: f,
    y: l
  });
}
function M(t, e) {
  const o = I(t).scrollLeft;
  return e ? e.left + o : T(R(t)).left + o;
}
function et(t, e) {
  const o = t.getBoundingClientRect(), n = o.left + e.scrollLeft - M(t, o), i = o.top + e.scrollTop;
  return {
    x: n,
    y: i
  };
}
function pt(t) {
  let {
    elements: e,
    rect: o,
    offsetParent: n,
    strategy: i
  } = t;
  const r = i === "fixed", s = R(n), c = e ? $(e.floating) : !1;
  if (n === s || c && r)
    return o;
  let f = {
    scrollLeft: 0,
    scrollTop: 0
  }, l = y(1);
  const u = y(0), h = C(n);
  if ((h || !h && !r) && ((_(n) !== "body" || q(s)) && (f = I(n)), C(n))) {
    const a = T(n);
    l = F(n), u.x = a.x + n.clientLeft, u.y = a.y + n.clientTop;
  }
  const d = s && !h && !r ? et(s, f) : y(0);
  return {
    width: o.width * l.x,
    height: o.height * l.y,
    x: o.x * l.x - f.scrollLeft * l.x + u.x + d.x,
    y: o.y * l.y - f.scrollTop * l.y + u.y + d.y
  };
}
function wt(t) {
  return Array.from(t.getClientRects());
}
function mt(t) {
  const e = R(t), o = I(t), n = t.ownerDocument.body, i = E(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), r = E(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight);
  let s = -o.scrollLeft + M(t);
  const c = -o.scrollTop;
  return b(n).direction === "rtl" && (s += E(e.clientWidth, n.clientWidth) - i), {
    width: i,
    height: r,
    x: s,
    y: c
  };
}
const K = 25;
function yt(t, e) {
  const o = L(t), n = R(t), i = o.visualViewport;
  let r = n.clientWidth, s = n.clientHeight, c = 0, f = 0;
  if (i) {
    r = i.width, s = i.height;
    const u = Y();
    (!u || u && e === "fixed") && (c = i.offsetLeft, f = i.offsetTop);
  }
  const l = M(n);
  if (l <= 0) {
    const u = n.ownerDocument, h = u.body, d = getComputedStyle(h), a = u.compatMode === "CSS1Compat" && parseFloat(d.marginLeft) + parseFloat(d.marginRight) || 0, w = Math.abs(n.clientWidth - h.clientWidth - a);
    w <= K && (r -= w);
  } else l <= K && (r += l);
  return {
    width: r,
    height: s,
    x: c,
    y: f
  };
}
const xt = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function vt(t, e) {
  const o = T(t, !0, e === "fixed"), n = o.top + t.clientTop, i = o.left + t.clientLeft, r = C(t) ? F(t) : y(1), s = t.clientWidth * r.x, c = t.clientHeight * r.y, f = i * r.x, l = n * r.y;
  return {
    width: s,
    height: c,
    x: f,
    y: l
  };
}
function j(t, e, o) {
  let n;
  if (e === "viewport")
    n = yt(t, o);
  else if (e === "document")
    n = mt(R(t));
  else if (v(e))
    n = vt(e, o);
  else {
    const i = tt(t);
    n = {
      x: e.x - i.x,
      y: e.y - i.y,
      width: e.width,
      height: e.height
    };
  }
  return J(n);
}
function nt(t, e) {
  const o = W(t);
  return o === e || !v(o) || H(o) ? !1 : b(o).position === "fixed" || nt(o, e);
}
function bt(t, e) {
  const o = e.get(t);
  if (o)
    return o;
  let n = z(t, [], !1).filter((c) => v(c) && _(c) !== "body"), i = null;
  const r = b(t).position === "fixed";
  let s = r ? W(t) : t;
  for (; v(s) && !H(s); ) {
    const c = b(s), f = Q(s);
    !f && c.position === "fixed" && (i = null), (r ? !f && !i : !f && c.position === "static" && !!i && xt.has(i.position) || q(s) && !f && nt(t, s)) ? n = n.filter((u) => u !== s) : i = c, s = W(s);
  }
  return e.set(t, n), n;
}
function Rt(t) {
  let {
    element: e,
    boundary: o,
    rootBoundary: n,
    strategy: i
  } = t;
  const s = [...o === "clippingAncestors" ? $(e) ? [] : bt(e, this._c) : [].concat(o), n], c = s[0], f = s.reduce((l, u) => {
    const h = j(e, u, i);
    return l.top = E(h.top, l.top), l.right = V(h.right, l.right), l.bottom = V(h.bottom, l.bottom), l.left = E(h.left, l.left), l;
  }, j(e, c, i));
  return {
    width: f.right - f.left,
    height: f.bottom - f.top,
    x: f.left,
    y: f.top
  };
}
function Ct(t) {
  const {
    width: e,
    height: o
  } = Z(t);
  return {
    width: e,
    height: o
  };
}
function Ot(t, e, o) {
  const n = C(e), i = R(e), r = o === "fixed", s = T(t, !0, r, e);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const f = y(0);
  function l() {
    f.x = M(i);
  }
  if (n || !n && !r)
    if ((_(e) !== "body" || q(i)) && (c = I(e)), n) {
      const a = T(e, !0, r, e);
      f.x = a.x + e.clientLeft, f.y = a.y + e.clientTop;
    } else i && l();
  r && !n && i && l();
  const u = i && !n && !r ? et(i, c) : y(0), h = s.left + c.scrollLeft - f.x - u.x, d = s.top + c.scrollTop - f.y - u.y;
  return {
    x: h,
    y: d,
    width: s.width,
    height: s.height
  };
}
function N(t) {
  return b(t).position === "static";
}
function G(t, e) {
  if (!C(t) || b(t).position === "fixed")
    return null;
  if (e)
    return e(t);
  let o = t.offsetParent;
  return R(t) === o && (o = o.ownerDocument.body), o;
}
function ot(t, e) {
  const o = L(t);
  if ($(t))
    return o;
  if (!C(t)) {
    let i = W(t);
    for (; i && !H(i); ) {
      if (v(i) && !N(i))
        return i;
      i = W(i);
    }
    return o;
  }
  let n = G(t, e);
  for (; n && ht(n) && N(n); )
    n = G(n, e);
  return n && H(n) && N(n) && !Q(n) ? o : n || at(t) || o;
}
const Lt = async function(t) {
  const e = this.getOffsetParent || ot, o = this.getDimensions, n = await o(t.floating);
  return {
    reference: Ot(t.reference, await e(t.floating), t.strategy),
    floating: {
      x: 0,
      y: 0,
      width: n.width,
      height: n.height
    }
  };
};
function Tt(t) {
  return b(t).direction === "rtl";
}
const Et = {
  convertOffsetParentRelativeRectToViewportRelativeRect: pt,
  getDocumentElement: R,
  getClippingRect: Rt,
  getOffsetParent: ot,
  getElementRects: Lt,
  getClientRects: wt,
  getDimensions: Ct,
  getScale: F,
  isElement: v,
  isRTL: Tt
};
function it(t, e) {
  return t.x === e.x && t.y === e.y && t.width === e.width && t.height === e.height;
}
function Ft(t, e) {
  let o = null, n;
  const i = R(t);
  function r() {
    var c;
    clearTimeout(n), (c = o) == null || c.disconnect(), o = null;
  }
  function s(c, f) {
    c === void 0 && (c = !1), f === void 0 && (f = 1), r();
    const l = t.getBoundingClientRect(), {
      left: u,
      top: h,
      width: d,
      height: a
    } = l;
    if (c || e(), !d || !a)
      return;
    const w = A(h), p = A(i.clientWidth - (u + d)), m = A(i.clientHeight - (h + a)), g = A(u), O = {
      rootMargin: -w + "px " + -p + "px " + -m + "px " + -g + "px",
      threshold: E(0, V(1, f)) || 1
    };
    let S = !0;
    function k(P) {
      const B = P[0].intersectionRatio;
      if (B !== f) {
        if (!S)
          return s();
        B ? s(!1, B) : n = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      B === 1 && !it(l, t.getBoundingClientRect()) && s(), S = !1;
    }
    try {
      o = new IntersectionObserver(k, {
        ...O,
        // Handle <iframe>s
        root: i.ownerDocument
      });
    } catch {
      o = new IntersectionObserver(k, O);
    }
    o.observe(t);
  }
  return s(!0), r;
}
function At(t, e, o, n) {
  n === void 0 && (n = {});
  const {
    ancestorScroll: i = !0,
    ancestorResize: r = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: f = !1
  } = n, l = X(t), u = i || r ? [...l ? z(l) : [], ...z(e)] : [];
  u.forEach((g) => {
    i && g.addEventListener("scroll", o, {
      passive: !0
    }), r && g.addEventListener("resize", o);
  });
  const h = l && c ? Ft(l, o) : null;
  let d = -1, a = null;
  s && (a = new ResizeObserver((g) => {
    let [x] = g;
    x && x.target === l && a && (a.unobserve(e), cancelAnimationFrame(d), d = requestAnimationFrame(() => {
      var O;
      (O = a) == null || O.observe(e);
    })), o();
  }), l && !f && a.observe(l), a.observe(e));
  let w, p = f ? T(t) : null;
  f && m();
  function m() {
    const g = T(t);
    p && !it(p, g) && o(), p = g, w = requestAnimationFrame(m);
  }
  return o(), () => {
    var g;
    u.forEach((x) => {
      i && x.removeEventListener("scroll", o), r && x.removeEventListener("resize", o);
    }), h == null || h(), (g = a) == null || g.disconnect(), a = null, f && cancelAnimationFrame(w);
  };
}
const Dt = rt, Ht = lt, It = ct, Mt = ft, Nt = st, Vt = (t, e, o) => {
  const n = /* @__PURE__ */ new Map(), i = {
    platform: Et,
    ...o
  }, r = {
    ...i.platform,
    _c: n
  };
  return ut(t, e, {
    ...i,
    platform: r
  });
};
export {
  Mt as arrow,
  At as autoUpdate,
  Vt as computePosition,
  It as flip,
  z as getOverflowAncestors,
  Nt as inline,
  Dt as offset,
  Et as platform,
  Ht as shift
};
//# sourceMappingURL=annotorious-react.es16.js.map
