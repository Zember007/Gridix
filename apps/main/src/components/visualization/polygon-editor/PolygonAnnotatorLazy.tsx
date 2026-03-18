import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type RefAttributes,
} from "react";
import Spinner from "@/shared/ui/Spinner";

import type {
  PolygonAnnotatorProps,
  PolygonAnnotatorRef,
} from "./PolygonAnnotator";

function isModuleWithDefault(mod: unknown): mod is {
  default: ForwardRefExoticComponent<
    PropsWithoutRef<PolygonAnnotatorProps> & RefAttributes<PolygonAnnotatorRef>
  >;
} {
  return !!mod && typeof mod === "object" && "default" in mod;
}

const PolygonAnnotatorLazy = forwardRef<
  PolygonAnnotatorRef,
  PolygonAnnotatorProps
>((props, ref) => {
  const [Loaded, setLoaded] = useState<ForwardRefExoticComponent<
    PropsWithoutRef<PolygonAnnotatorProps> & RefAttributes<PolygonAnnotatorRef>
  > | null>(null);

  const themeColor = useMemo(() => {
    const anyProps = props as unknown as { themeColor?: string };
    return anyProps.themeColor ?? "#000000";
  }, [props]);

  useEffect(() => {
    let cancelled = false;
    void import("./PolygonAnnotator").then((mod) => {
      if (cancelled) return;
      if (!isModuleWithDefault(mod)) return;
      setLoaded(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Loaded) {
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner size="md" color={themeColor} />
      </div>
    );
  }

  return <Loaded {...props} ref={ref} />;
});

PolygonAnnotatorLazy.displayName = "PolygonAnnotatorLazy";

export type { PolygonAnnotatorRef };
export default PolygonAnnotatorLazy;
