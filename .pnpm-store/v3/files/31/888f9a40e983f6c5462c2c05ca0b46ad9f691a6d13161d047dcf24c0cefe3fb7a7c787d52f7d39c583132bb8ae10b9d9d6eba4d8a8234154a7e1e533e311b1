import { useEffect as f } from "react";
import { useAnnotator as s } from "./annotorious-react.es2.js";
const p = (e) => {
  const { onLoad: r, opts: u, plugin: i, pluginRef: n } = e, t = s();
  return f(() => {
    if (!t) return;
    const o = i(t, u);
    return n && (n.current = o), r && r(o), () => {
      o && "unmount" in o && o.unmount(), n && (n.current = null);
    };
  }, [t, u, i, n]), null;
};
export {
  p as AnnotoriousPlugin
};
//# sourceMappingURL=annotorious-react.es3.js.map
