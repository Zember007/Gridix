import type { FacadeSettings } from "../model/types";

const DEFAULT: FacadeSettings = {
  colors: { building: "#3b82f6" },
  opacity: { normal: 0.4, hover: 0.7 },
  hoverEffects: {
    glow: true,
    colorChange: true,
    opacityChange: true,
    scale: false,
  },
  display: {
    showNumbers: true,
    showTooltip: false,
    showArea: false,
    showPrice: false,
  },
};

/** Parses `project_masterplans.polygon_display_settings` (same shape as facade polygon settings). */
export function parsePolygonOverlaySettings(raw: unknown): FacadeSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;

  const s = raw as Record<string, unknown>;
  const colors = s.colors as Record<string, unknown> | undefined;
  const opacity = s.opacity as Record<string, unknown> | undefined;
  const hoverEffects = s.hoverEffects as Record<string, unknown> | undefined;
  const display = s.display as Record<string, unknown> | undefined;

  return {
    colors: {
      building:
        typeof colors?.building === "string"
          ? colors.building
          : DEFAULT.colors.building,
      ...(typeof colors?.available === "string" && {
        available: colors.available,
      }),
      ...(typeof colors?.sold === "string" && { sold: colors.sold }),
      ...(typeof colors?.reserved === "string" && {
        reserved: colors.reserved,
      }),
    },
    opacity: {
      normal:
        typeof opacity?.normal === "number"
          ? opacity.normal
          : DEFAULT.opacity.normal,
      hover:
        typeof opacity?.hover === "number"
          ? opacity.hover
          : DEFAULT.opacity.hover,
    },
    hoverEffects: {
      glow: !!hoverEffects?.glow,
      colorChange: !!hoverEffects?.colorChange,
      opacityChange: !!hoverEffects?.opacityChange,
      scale: !!hoverEffects?.scale,
    },
    display: {
      showNumbers: !!display?.showNumbers,
      showTooltip: !!display?.showTooltip,
      showArea: !!display?.showArea,
      showPrice: !!display?.showPrice,
    },
  };
}
