import { evaluate as Y, rectToClientRect as $, getPaddingObject as H, getSide as M, getSideAxis as j, getOppositePlacement as Q, getExpandedPlacements as U, getOppositeAxisPlacements as Z, getAlignmentSides as tt, clamp as _, min as X, max as z, getAlignment as I, getOppositeAxis as et, getAlignmentAxis as q, getAxisLength as G } from "./annotorious-react.es24.js";
function W(o, c, l) {
  let {
    reference: e,
    floating: s
  } = o;
  const t = j(c), a = q(c), r = G(a), d = M(c), g = t === "y", u = e.x + e.width / 2 - s.width / 2, n = e.y + e.height / 2 - s.height / 2, m = e[r] / 2 - s[r] / 2;
  let i;
  switch (d) {
    case "top":
      i = {
        x: u,
        y: e.y - s.height
      };
      break;
    case "bottom":
      i = {
        x: u,
        y: e.y + e.height
      };
      break;
    case "right":
      i = {
        x: e.x + e.width,
        y: n
      };
      break;
    case "left":
      i = {
        x: e.x - s.width,
        y: n
      };
      break;
    default:
      i = {
        x: e.x,
        y: e.y
      };
  }
  switch (I(c)) {
    case "start":
      i[a] -= m * (l && g ? -1 : 1);
      break;
    case "end":
      i[a] += m * (l && g ? -1 : 1);
      break;
  }
  return i;
}
const ct = async (o, c, l) => {
  const {
    placement: e = "bottom",
    strategy: s = "absolute",
    middleware: t = [],
    platform: a
  } = l, r = t.filter(Boolean), d = await (a.isRTL == null ? void 0 : a.isRTL(c));
  let g = await a.getElementRects({
    reference: o,
    floating: c,
    strategy: s
  }), {
    x: u,
    y: n
  } = W(g, e, d), m = e, i = {}, f = 0;
  for (let h = 0; h < r.length; h++) {
    const {
      name: x,
      fn: v
    } = r[h], {
      x: p,
      y: A,
      data: R,
      reset: w
    } = await v({
      x: u,
      y: n,
      initialPlacement: e,
      placement: m,
      strategy: s,
      middlewareData: i,
      rects: g,
      platform: a,
      elements: {
        reference: o,
        floating: c
      }
    });
    u = p ?? u, n = A ?? n, i = {
      ...i,
      [x]: {
        ...i[x],
        ...R
      }
    }, w && f <= 50 && (f++, typeof w == "object" && (w.placement && (m = w.placement), w.rects && (g = w.rects === !0 ? await a.getElementRects({
      reference: o,
      floating: c,
      strategy: s
    }) : w.rects), {
      x: u,
      y: n
    } = W(g, m, d)), h = -1);
  }
  return {
    x: u,
    y: n,
    placement: m,
    strategy: s,
    middlewareData: i
  };
};
async function J(o, c) {
  var l;
  c === void 0 && (c = {});
  const {
    x: e,
    y: s,
    platform: t,
    rects: a,
    elements: r,
    strategy: d
  } = o, {
    boundary: g = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: n = "floating",
    altBoundary: m = !1,
    padding: i = 0
  } = Y(c, o), f = H(i), x = r[m ? n === "floating" ? "reference" : "floating" : n], v = $(await t.getClippingRect({
    element: (l = await (t.isElement == null ? void 0 : t.isElement(x))) == null || l ? x : x.contextElement || await (t.getDocumentElement == null ? void 0 : t.getDocumentElement(r.floating)),
    boundary: g,
    rootBoundary: u,
    strategy: d
  })), p = n === "floating" ? {
    x: e,
    y: s,
    width: a.floating.width,
    height: a.floating.height
  } : a.reference, A = await (t.getOffsetParent == null ? void 0 : t.getOffsetParent(r.floating)), R = await (t.isElement == null ? void 0 : t.isElement(A)) ? await (t.getScale == null ? void 0 : t.getScale(A)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, w = $(t.convertOffsetParentRelativeRectToViewportRelativeRect ? await t.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: r,
    rect: p,
    offsetParent: A,
    strategy: d
  }) : p);
  return {
    top: (v.top - w.top + f.top) / R.y,
    bottom: (w.bottom - v.bottom + f.bottom) / R.y,
    left: (v.left - w.left + f.left) / R.x,
    right: (w.right - v.right + f.right) / R.x
  };
}
const lt = (o) => ({
  name: "arrow",
  options: o,
  async fn(c) {
    const {
      x: l,
      y: e,
      placement: s,
      rects: t,
      platform: a,
      elements: r,
      middlewareData: d
    } = c, {
      element: g,
      padding: u = 0
    } = Y(o, c) || {};
    if (g == null)
      return {};
    const n = H(u), m = {
      x: l,
      y: e
    }, i = q(s), f = G(i), h = await a.getDimensions(g), x = i === "y", v = x ? "top" : "left", p = x ? "bottom" : "right", A = x ? "clientHeight" : "clientWidth", R = t.reference[f] + t.reference[i] - m[i] - t.floating[f], w = m[i] - t.reference[i], S = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(g));
    let D = S ? S[A] : 0;
    (!D || !await (a.isElement == null ? void 0 : a.isElement(S))) && (D = r.floating[A] || t.floating[f]);
    const F = R / 2 - w / 2, T = D / 2 - h[f] / 2 - 1, y = X(n[v], T), L = X(n[p], T), E = y, B = D - h[f] - L, b = D / 2 - h[f] / 2 + F, k = _(E, b, B), C = !d.arrow && I(s) != null && b !== k && t.reference[f] / 2 - (b < E ? y : L) - h[f] / 2 < 0, P = C ? b < E ? b - E : b - B : 0;
    return {
      [i]: m[i] + P,
      data: {
        [i]: k,
        centerOffset: b - k - P,
        ...C && {
          alignmentOffset: P
        }
      },
      reset: C
    };
  }
}), at = function(o) {
  return o === void 0 && (o = {}), {
    name: "flip",
    options: o,
    async fn(c) {
      var l, e;
      const {
        placement: s,
        middlewareData: t,
        rects: a,
        initialPlacement: r,
        platform: d,
        elements: g
      } = c, {
        mainAxis: u = !0,
        crossAxis: n = !0,
        fallbackPlacements: m,
        fallbackStrategy: i = "bestFit",
        fallbackAxisSideDirection: f = "none",
        flipAlignment: h = !0,
        ...x
      } = Y(o, c);
      if ((l = t.arrow) != null && l.alignmentOffset)
        return {};
      const v = M(s), p = j(r), A = M(r) === r, R = await (d.isRTL == null ? void 0 : d.isRTL(g.floating)), w = m || (A || !h ? [Q(r)] : U(r)), S = f !== "none";
      !m && S && w.push(...Z(r, h, f, R));
      const D = [r, ...w], F = await J(c, x), T = [];
      let y = ((e = t.flip) == null ? void 0 : e.overflows) || [];
      if (u && T.push(F[v]), n) {
        const b = tt(s, a, R);
        T.push(F[b[0]], F[b[1]]);
      }
      if (y = [...y, {
        placement: s,
        overflows: T
      }], !T.every((b) => b <= 0)) {
        var L, E;
        const b = (((L = t.flip) == null ? void 0 : L.index) || 0) + 1, k = D[b];
        if (k && (!(n === "alignment" ? p !== j(k) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        y.every((O) => j(O.placement) === p ? O.overflows[0] > 0 : !0)))
          return {
            data: {
              index: b,
              overflows: y
            },
            reset: {
              placement: k
            }
          };
        let C = (E = y.filter((P) => P.overflows[0] <= 0).sort((P, O) => P.overflows[1] - O.overflows[1])[0]) == null ? void 0 : E.placement;
        if (!C)
          switch (i) {
            case "bestFit": {
              var B;
              const P = (B = y.filter((O) => {
                if (S) {
                  const V = j(O.placement);
                  return V === p || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  V === "y";
                }
                return !0;
              }).map((O) => [O.placement, O.overflows.filter((V) => V > 0).reduce((V, N) => V + N, 0)]).sort((O, V) => O[1] - V[1])[0]) == null ? void 0 : B[0];
              P && (C = P);
              break;
            }
            case "initialPlacement":
              C = r;
              break;
          }
        if (s !== C)
          return {
            reset: {
              placement: C
            }
          };
      }
      return {};
    }
  };
};
function K(o) {
  const c = X(...o.map((t) => t.left)), l = X(...o.map((t) => t.top)), e = z(...o.map((t) => t.right)), s = z(...o.map((t) => t.bottom));
  return {
    x: c,
    y: l,
    width: e - c,
    height: s - l
  };
}
function nt(o) {
  const c = o.slice().sort((s, t) => s.y - t.y), l = [];
  let e = null;
  for (let s = 0; s < c.length; s++) {
    const t = c[s];
    !e || t.y - e.y > e.height / 2 ? l.push([t]) : l[l.length - 1].push(t), e = t;
  }
  return l.map((s) => $(K(s)));
}
const rt = function(o) {
  return o === void 0 && (o = {}), {
    name: "inline",
    options: o,
    async fn(c) {
      const {
        placement: l,
        elements: e,
        rects: s,
        platform: t,
        strategy: a
      } = c, {
        padding: r = 2,
        x: d,
        y: g
      } = Y(o, c), u = Array.from(await (t.getClientRects == null ? void 0 : t.getClientRects(e.reference)) || []), n = nt(u), m = $(K(u)), i = H(r);
      function f() {
        if (n.length === 2 && n[0].left > n[1].right && d != null && g != null)
          return n.find((x) => d > x.left - i.left && d < x.right + i.right && g > x.top - i.top && g < x.bottom + i.bottom) || m;
        if (n.length >= 2) {
          if (j(l) === "y") {
            const y = n[0], L = n[n.length - 1], E = M(l) === "top", B = y.top, b = L.bottom, k = E ? y.left : L.left, C = E ? y.right : L.right, P = C - k, O = b - B;
            return {
              top: B,
              bottom: b,
              left: k,
              right: C,
              width: P,
              height: O,
              x: k,
              y: B
            };
          }
          const x = M(l) === "left", v = z(...n.map((y) => y.right)), p = X(...n.map((y) => y.left)), A = n.filter((y) => x ? y.left === p : y.right === v), R = A[0].top, w = A[A.length - 1].bottom, S = p, D = v, F = D - S, T = w - R;
          return {
            top: R,
            bottom: w,
            left: S,
            right: D,
            width: F,
            height: T,
            x: S,
            y: R
          };
        }
        return m;
      }
      const h = await t.getElementRects({
        reference: {
          getBoundingClientRect: f
        },
        floating: e.floating,
        strategy: a
      });
      return s.reference.x !== h.reference.x || s.reference.y !== h.reference.y || s.reference.width !== h.reference.width || s.reference.height !== h.reference.height ? {
        reset: {
          rects: h
        }
      } : {};
    }
  };
}, it = /* @__PURE__ */ new Set(["left", "top"]);
async function ot(o, c) {
  const {
    placement: l,
    platform: e,
    elements: s
  } = o, t = await (e.isRTL == null ? void 0 : e.isRTL(s.floating)), a = M(l), r = I(l), d = j(l) === "y", g = it.has(a) ? -1 : 1, u = t && d ? -1 : 1, n = Y(c, o);
  let {
    mainAxis: m,
    crossAxis: i,
    alignmentAxis: f
  } = typeof n == "number" ? {
    mainAxis: n,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: n.mainAxis || 0,
    crossAxis: n.crossAxis || 0,
    alignmentAxis: n.alignmentAxis
  };
  return r && typeof f == "number" && (i = r === "end" ? f * -1 : f), d ? {
    x: i * u,
    y: m * g
  } : {
    x: m * g,
    y: i * u
  };
}
const ft = function(o) {
  return o === void 0 && (o = 0), {
    name: "offset",
    options: o,
    async fn(c) {
      var l, e;
      const {
        x: s,
        y: t,
        placement: a,
        middlewareData: r
      } = c, d = await ot(c, o);
      return a === ((l = r.offset) == null ? void 0 : l.placement) && (e = r.arrow) != null && e.alignmentOffset ? {} : {
        x: s + d.x,
        y: t + d.y,
        data: {
          ...d,
          placement: a
        }
      };
    }
  };
}, mt = function(o) {
  return o === void 0 && (o = {}), {
    name: "shift",
    options: o,
    async fn(c) {
      const {
        x: l,
        y: e,
        placement: s
      } = c, {
        mainAxis: t = !0,
        crossAxis: a = !1,
        limiter: r = {
          fn: (x) => {
            let {
              x: v,
              y: p
            } = x;
            return {
              x: v,
              y: p
            };
          }
        },
        ...d
      } = Y(o, c), g = {
        x: l,
        y: e
      }, u = await J(c, d), n = j(M(s)), m = et(n);
      let i = g[m], f = g[n];
      if (t) {
        const x = m === "y" ? "top" : "left", v = m === "y" ? "bottom" : "right", p = i + u[x], A = i - u[v];
        i = _(p, i, A);
      }
      if (a) {
        const x = n === "y" ? "top" : "left", v = n === "y" ? "bottom" : "right", p = f + u[x], A = f - u[v];
        f = _(p, f, A);
      }
      const h = r.fn({
        ...c,
        [m]: i,
        [n]: f
      });
      return {
        ...h,
        data: {
          x: h.x - l,
          y: h.y - e,
          enabled: {
            [m]: t,
            [n]: a
          }
        }
      };
    }
  };
};
export {
  lt as arrow,
  ct as computePosition,
  J as detectOverflow,
  at as flip,
  rt as inline,
  ft as offset,
  $ as rectToClientRect,
  mt as shift
};
//# sourceMappingURL=annotorious-react.es25.js.map
