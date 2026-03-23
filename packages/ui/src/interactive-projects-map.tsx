import { useEffect, useState, type ComponentType } from "react";

export type InteractiveMapProject = {
  id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  building_image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export interface InteractiveProjectsMapProps {
  projects: InteractiveMapProject[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  /**
   * Called when user clicks "Open" in popup (if provided).
   * If not provided, we build a default URL based on slug/id.
   */
  onOpenProject?: (project: InteractiveMapProject) => void;
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export function InteractiveProjectsMap({
  ...props
}: InteractiveProjectsMapProps) {
  const [Impl, setImpl] =
    useState<ComponentType<InteractiveProjectsMapProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./interactive-projects-map.impl").then((mod) => {
      if (cancelled) return;
      setImpl(() => mod.InteractiveProjectsMapImpl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Impl) return null;
  return <Impl {...props} />;
}
