import { jsxs as x, jsx as C } from "react/jsx-runtime";
import { useState as E, useRef as A, useEffect as D } from "react";
import { useFloating as O, FloatingArrow as L } from "./annotorious-react.es14.js";
import { useAnnotator as S, useSelection as U } from "./annotorious-react.es2.js";
import { toClientRects as F } from "./annotorious-react.es15.js";
import { autoUpdate as M } from "./annotorious-react.es16.js";
import { inline as P, offset as b, flip as j, shift as k, arrow as z } from "./annotorious-react.es17.js";
import g from "./annotorious-react.es18.js";
const H = (i, t) => {
  const n = t.querySelector("img"), { left: a, top: d } = n.getBoundingClientRect(), s = n.offsetWidth / n.naturalWidth, c = n.offsetHeight / n.naturalHeight, { minX: o, minY: l, maxX: p, maxY: u } = i.bounds;
  return new DOMRect(
    a + s * o,
    d + c * l,
    s * (p - o),
    c * (u - l)
  );
}, Q = (i) => {
  var m, f;
  const t = S(), [n, a] = E(!1), d = A(null), { selected: s, event: c } = U(), o = (m = s[0]) == null ? void 0 : m.annotation, l = (f = s[0]) == null ? void 0 : f.editable, { refs: p, floatingStyles: u, context: w, update: I } = O({
    open: n,
    onOpenChange: a,
    middleware: [
      P(),
      b(10),
      j({ crossAxis: !0 }),
      k({
        crossAxis: !0,
        padding: { right: 5, left: 5, top: 10, bottom: 10 }
      }),
      z({
        element: d,
        padding: 5
      })
    ],
    whileElementsMounted: M
  });
  D(() => {
    if (s.length === 0)
      a(!1);
    else {
      const e = () => {
        const r = H(o.target.selector.geometry, t.element);
        p.setReference({
          getBoundingClientRect: () => r,
          getClientRects: () => F(r)
        });
      };
      return window.addEventListener("scroll", e, !0), window.addEventListener("resize", e), e(), a(!0), () => {
        window.removeEventListener("scroll", e, !0), window.removeEventListener("resize", e);
      };
    }
  }, [t, i.popup, s]);
  const h = (e) => {
    const r = e.id || g();
    t.state.store.addBody({
      ...e,
      id: r,
      annotation: o.id,
      created: e.created || /* @__PURE__ */ new Date(),
      creator: t.getUser()
    });
  }, y = (e) => {
    t.state.store.deleteBody({ id: e, annotation: o.id });
  }, v = (e, r) => {
    const B = r.id || g(), R = {
      updated: /* @__PURE__ */ new Date(),
      updatedBy: t.getUser(),
      ...r,
      id: B,
      annotation: o.id
    };
    t.state.store.updateBody(e, R);
  };
  return n && o ? /* @__PURE__ */ x(
    "div",
    {
      className: "a9s-popup a9s-image-popup",
      ref: p.setFloating,
      style: u,
      children: [
        i.arrow && /* @__PURE__ */ C(
          L,
          {
            ref: d,
            context: w,
            ...i.arrowProps || {}
          }
        ),
        i.popup({
          annotation: o,
          editable: l,
          event: c,
          onCreateBody: h,
          onDeleteBody: y,
          onUpdateBody: v
        })
      ]
    }
  ) : null;
};
export {
  Q as ImageAnnotationPopup
};
//# sourceMappingURL=annotorious-react.es4.js.map
