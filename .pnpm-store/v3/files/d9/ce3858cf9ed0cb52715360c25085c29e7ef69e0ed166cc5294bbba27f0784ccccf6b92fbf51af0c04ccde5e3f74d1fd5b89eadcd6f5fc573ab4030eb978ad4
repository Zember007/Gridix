import { jsx as I } from "react/jsx-runtime";
import { dequal as O } from "./annotorious-react.es12.js";
import { createContext as U, forwardRef as j, useState as v, useRef as P, useImperativeHandle as k, useEffect as w, useContext as h } from "react";
import { useDebounce as _ } from "./annotorious-react.es13.js";
const f = U({
  anno: void 0,
  setAnno: void 0,
  annotations: [],
  selection: { selected: [] }
}), y = (t, n) => {
  const { event: e, ...r } = t, { event: s, ...o } = n;
  return O(r, o) ? (e == null ? void 0 : e.timeStamp) === (s == null ? void 0 : s.timeStamp) : !1;
}, Q = j((t, n) => {
  const [e, r] = v(null), [s, o] = v([]), [u, c] = v({ selected: [], previous: [] }), V = P([]);
  return k(n, () => e), w(() => {
    if (e) {
      const { selection: p, store: i } = e.state;
      i.all().length > 0 && o(i.all());
      const A = () => o(() => i.all());
      i.observe(A);
      let l;
      const m = p.subscribe(({ selected: S, ...R }) => {
        l && i.unobserve(l);
        const q = (S || []).map(({ id: a, editable: d }) => ({ annotation: i.getAnnotation(a), editable: d }));
        c((a) => {
          const d = {
            selected: q,
            previous: a.selected,
            ...R
          };
          return y(a, d) ? a : (V.current = a.selected, d);
        }), l = (a) => {
          const { updated: d } = a.changes;
          c((g) => ({
            ...g,
            selected: g.selected.map(({ annotation: x, editable: C }) => {
              const H = d.find((E) => E.oldValue.id === x.id);
              return H ? { annotation: H.newValue, editable: C } : { annotation: x, editable: C };
            })
          }));
        }, i.observe(l, { annotations: S.map(({ id: a }) => a) });
      });
      return () => {
        i.unobserve(A), m();
      };
    }
  }, [e]), /* @__PURE__ */ I(f.Provider, { value: {
    anno: e,
    setAnno: r,
    annotations: s,
    selection: u
  }, children: t.children });
}), b = () => {
  const { anno: t } = h(f);
  return t;
}, z = () => {
  const t = b();
  return t == null ? void 0 : t.state.store;
}, B = () => {
  const { annotations: t } = h(f);
  return t;
}, F = (t) => {
  const { annotations: n } = h(f);
  return _(n, t);
}, T = (t) => t ? F(t) : B(), G = (t, n) => {
  const e = z(), [r, s] = v(
    e == null ? void 0 : e.getAnnotation(t)
  );
  return w(() => {
    if (!e) return;
    const o = (u) => {
      const c = u.changes.updated[0];
      c && s(c.newValue);
    };
    return e.observe(o, { ...n, annotations: t }), () => e.unobserve(o);
  }, []), r;
}, W = (t) => {
  const n = b(), e = G(t);
  return n && e ? n.state.selection.evalSelectAction(e) : void 0;
}, X = () => {
  const { selection: t } = h(f);
  return t;
}, Y = () => {
  const t = b(), [n, e] = v();
  return w(() => {
    if (!t) return;
    const { hover: r, store: s } = t.state, o = r.subscribe((u) => {
      if (u) {
        const c = s.getAnnotation(u);
        e(c);
      } else
        e(void 0);
    });
    return () => {
      o();
    };
  }, [t]), n;
}, Z = () => {
  const t = b();
  return t == null ? void 0 : t.getUser();
}, D = () => {
  const t = b(), [n, e] = v([]);
  return w(() => {
    if (t) {
      const { store: r, viewport: s } = t.state;
      if (!s)
        return;
      let o;
      const u = s.subscribe((c) => {
        o && r.unobserve(o);
        const V = c.map((p) => r.getAnnotation(p));
        e(V), o = (p) => {
          const { updated: i } = p.changes;
          e((A) => A.map((l) => {
            const m = i.find((S) => S.oldValue.id === l.id);
            return m ? m.newValue : l;
          }));
        }, r.observe(o, { annotations: c });
      });
      return () => {
        u();
      };
    }
  }, [t]), n;
}, J = (t) => {
  const n = D();
  return _(n, t);
}, $ = (t) => t ? J(t) : D();
export {
  Q as Annotorious,
  f as AnnotoriousContext,
  G as useAnnotation,
  W as useAnnotationSelectAction,
  z as useAnnotationStore,
  T as useAnnotations,
  b as useAnnotator,
  Z as useAnnotatorUser,
  Y as useHover,
  X as useSelection,
  $ as useViewportState
};
//# sourceMappingURL=annotorious-react.es2.js.map
