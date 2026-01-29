import n from "./annotorious-react.es22.js";
import u from "./annotorious-react.es23.js";
import { unsafeStringify as a } from "./annotorious-react.es21.js";
function d(r, t, m) {
  var e;
  r = r || {};
  const f = r.random ?? ((e = r.rng) == null ? void 0 : e.call(r)) ?? u();
  if (f.length < 16)
    throw new Error("Random bytes length must be >= 16");
  return f[6] = f[6] & 15 | 64, f[8] = f[8] & 63 | 128, a(f);
}
function U(r, t, m) {
  return n.randomUUID && !r ? n.randomUUID() : d(r);
}
export {
  U as default
};
//# sourceMappingURL=annotorious-react.es18.js.map
