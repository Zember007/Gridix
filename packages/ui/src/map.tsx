"use client";

import { useEffect, useState, type ComponentType } from "react";

export interface WorldMapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

export function WorldMap({ ...props }: WorldMapProps) {
  const [Impl, setImpl] = useState<ComponentType<WorldMapProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./map.impl").then((mod) => {
      if (cancelled) return;
      setImpl(() => mod.WorldMapImpl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Impl) return null;
  return <Impl {...props} />;
}
