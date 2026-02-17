import autoprefixer from "autoprefixer";
import postcss from "postcss";
import rtlcss from "rtlcss";
import tailwindcss from "tailwindcss";

function scopedRtlcss() {
  return {
    postcssPlugin: "gridix-scoped-rtlcss",
    Once(root) {
      const from = root.source?.input?.file;
      const rtlRoot = postcss.parse(rtlcss.process(root.toString()), { from });

      // IMPORTANT:
      // Keyframes are global, so if we append RTL keyframes with the same name
      // they will override LTR animations in *all* languages.
      rtlRoot.walkAtRules((atRule) => {
        if (/keyframes$/i.test(atRule.name)) atRule.remove();
        if (atRule.name === "charset" || atRule.name === "import")
          atRule.remove();
      });

      const isFixedValue = (v) => v && !String(v).includes("%");

      rtlRoot.walkRules((rule) => {
        // Don't prefix keyframe steps selectors like "0%", "to", etc.
        let parent = rule.parent;
        while (parent) {
          if (parent.type === "atrule" && /keyframes$/i.test(parent.name))
            return;
          parent = parent.parent;
        }

        // Правила, где left/right только в процентах (50%, 100%), не дублируем в RTL —
        // иначе модалки смещаются; в RTL остаётся LTR-правило, центрирование сохраняется
        let hasLeftPct = false;
        let hasRightPct = false;
        let hasLeftFixed = false;
        let hasRightFixed = false;
        rule.walkDecls((decl) => {
          if (decl.prop === "left") {
            if (isFixedValue(decl.value)) hasLeftFixed = true;
            else hasLeftPct = true;
          }
          if (decl.prop === "right") {
            if (isFixedValue(decl.value)) hasRightFixed = true;
            else hasRightPct = true;
          }
        });
        if ((hasLeftPct || hasRightPct) && !hasLeftFixed && !hasRightFixed) {
          rule.remove();
          return;
        }

        rule.selectors = rule.selectors.map((sel) => `html[dir="rtl"] ${sel}`);

        // left/right: добавляем противоположный auto только для фиксированных значений
        hasLeftFixed = false;
        hasRightFixed = false;
        let hasMarginLeft = false;
        let hasMarginRight = false;
        rule.walkDecls((decl) => {
          if (decl.prop === "left" && isFixedValue(decl.value))
            hasLeftFixed = true;
          if (decl.prop === "right" && isFixedValue(decl.value))
            hasRightFixed = true;
          if (decl.prop === "margin-left") hasMarginLeft = true;
          if (decl.prop === "margin-right") hasMarginRight = true;
        });
        if (hasLeftFixed && !hasRightFixed)
          rule.append({ prop: "right", value: "auto" });
        if (hasRightFixed && !hasLeftFixed)
          rule.append({ prop: "left", value: "auto" });
        // margin: в RTL не должны накладываться ml и mr — сбрасываем противоположную сторону в 0
        if (hasMarginLeft && !hasMarginRight)
          rule.append({ prop: "margin-right", value: "0" });
        if (hasMarginRight && !hasMarginLeft)
          rule.append({ prop: "margin-left", value: "0" });
      });

      root.append(rtlRoot.nodes);
    },
  };
}
scopedRtlcss.postcss = true;

export default {
  plugins: [tailwindcss, autoprefixer, scopedRtlcss()],
};
