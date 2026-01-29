import { jsx as d, Fragment as g } from "react/jsx-runtime";
import { Children as u, useContext as w, useEffect as n, cloneElement as A } from "react";
import { createImageAnnotator as C } from "@annotorious/annotorious";
import { AnnotoriousContext as x } from "./annotorious-react.es2.js";
const S = (t) => {
  const { children: o, tool: i, ...a } = t, l = u.only(o), { anno: e, setAnno: r } = w(x), c = (m) => {
    if (!e) {
      const s = m.target, f = C(s, a);
      r(f);
    }
  };
  return n(() => {
    !e || !t.containerClassName || (e.element.className = t.containerClassName);
  }, [t.containerClassName, e]), n(() => {
    e && e.setDrawingEnabled(t.drawingEnabled);
  }, [t.drawingEnabled]), n(() => {
    e && e.setDrawingMode(t.drawingMode);
  }, [t.drawingMode]), n(() => {
    e && e.setFilter(t.filter);
  }, [t.filter]), n(() => {
    e && e.setStyle(t.style);
  }, [t.style]), n(() => {
    i && e && e.setDrawingTool(t.tool);
  }, [i, e]), n(() => {
    e && e.setUserSelectAction(t.userSelectAction);
  }, [t.userSelectAction]), /* @__PURE__ */ d(g, { children: A(l, { onLoad: c }) });
};
export {
  S as ImageAnnotator
};
//# sourceMappingURL=annotorious-react.es5.js.map
