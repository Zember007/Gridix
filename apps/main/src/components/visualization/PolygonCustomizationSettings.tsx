import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Slider } from "@gridix/ui";
import { Separator } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Json } from "@gridix/types/database";
export interface PolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
    building?: string; // For building type - single color
  };
  hoverEffects: {
    scale: boolean;
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea: boolean;
    showPrice: boolean;
  };
  opacity: {
    normal: number;
    hover: number;
  };
}

interface PolygonCustomizationSettingsProps {
  projectId: string;
  type: "building" | "floor" | "genplan";
  /** @deprecated Genplan settings are stored on the project; this prop is ignored. */
  masterplanId?: string;
  /** When provided, load/save settings from sub_projects instead of projects. */
  subProjectId?: string;
  onSettingsChange?: (settings: PolygonSettings) => void;
  initialSettings?: PolygonSettings | null;
  /** Passed to root Card — use e.g. for borderless embedding in Sheet. */
  cardClassName?: string;
}

const defaultSettings: PolygonSettings = {
  colors: {
    available: "#3b82f6",
    sold: "#ef4444",
    reserved: "#f59e0b",
    building: "#3b82f6",
  },
  hoverEffects: {
    scale: false,
    colorChange: true,
    opacityChange: true,
    glow: true,
  },
  display: {
    showNumbers: true,
    showTooltip: false,
    showArea: false,
    showPrice: false,
  },
  opacity: {
    normal: 0.4,
    hover: 0.7,
  },
};

/** Defaults for genplan: every toggle in this form is on. */
const defaultGenplanPolygonSettings: PolygonSettings = {
  ...defaultSettings,
  hoverEffects: {
    scale: true,
    colorChange: true,
    opacityChange: true,
    glow: true,
  },
  display: {
    showNumbers: true,
    showTooltip: true,
    showArea: true,
    showPrice: true,
  },
};

function baseDefaults(type: "building" | "floor" | "genplan"): PolygonSettings {
  if (type === "genplan") {
    return { ...defaultGenplanPolygonSettings };
  }
  return { ...defaultSettings };
}

// Функция для валидации и дополнения настроек дефолтными значениями
const validateAndMergeSettings = (
  loadedSettings: unknown,
  type: "building" | "floor" | "genplan",
): PolygonSettings => {
  const merged = baseDefaults(type);

  if (!loadedSettings || typeof loadedSettings !== "object") {
    return merged;
  }

  const settings = loadedSettings as Partial<PolygonSettings>;

  const base = baseDefaults(type);

  // Валидация и слияние colors
  if (settings.colors && typeof settings.colors === "object") {
    merged.colors = {
      ...base.colors,
      ...settings.colors,
    };
  }

  // Валидация и слияние hoverEffects
  if (settings.hoverEffects && typeof settings.hoverEffects === "object") {
    merged.hoverEffects = {
      ...base.hoverEffects,
      ...settings.hoverEffects,
    };
  }

  // Валидация и слияние display
  if (settings.display && typeof settings.display === "object") {
    merged.display = {
      ...base.display,
      ...settings.display,
    };
  }

  // Валидация и слияние opacity
  if (settings.opacity && typeof settings.opacity === "object") {
    merged.opacity = {
      ...base.opacity,
      ...settings.opacity,
    };
  }

  // Для типа building убеждаемся, что есть building цвет
  if ((type === "building" || type === "genplan") && !merged.colors.building) {
    merged.colors.building = "#3b82f6";
  }

  return merged;
};

/** One bordered group: rows separated by divide-y (anti-card per skill). */
const POLYGON_TOGGLE_GROUP_CLASS =
  "divide-y divide-border overflow-hidden rounded-lg border border-border/70 bg-muted/20";

const PolygonCustomizationSettings = ({
  projectId,
  type,
  subProjectId,
  onSettingsChange,
  initialSettings,
  cardClassName,
}: PolygonCustomizationSettingsProps) => {
  const [settings, setSettings] = useState<PolygonSettings>(() =>
    initialSettings
      ? validateAndMergeSettings(initialSettings, type)
      : baseDefaults(type),
  );
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const loadSettings = useCallback(async () => {
    try {
      if (type === "genplan") {
        const { data, error } = await supabase
          .from("projects")
          .select("polygon_settings_genplan")
          .eq("id", projectId)
          .single();
        if (error) throw error;
        if (data?.polygon_settings_genplan) {
          setSettings(
            validateAndMergeSettings(
              data.polygon_settings_genplan as unknown as PolygonSettings,
              "genplan",
            ),
          );
        } else {
          setSettings(baseDefaults("genplan"));
        }
      } else if (type === "building") {
        const table = subProjectId ? "sub_projects" : "projects";
        const id = subProjectId ?? projectId;
        const { data, error } = await supabase
          .from(table)
          .select("polygon_settings_facade")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data?.polygon_settings_facade) {
          const loadedSettings =
            data.polygon_settings_facade as unknown as PolygonSettings;
          const validatedSettings = validateAndMergeSettings(
            loadedSettings,
            "building",
          );
          setSettings(validatedSettings);
        }
      } else {
        const table = subProjectId ? "sub_projects" : "projects";
        const id = subProjectId ?? projectId;
        const { data, error } = await supabase
          .from(table)
          .select("polygon_settings_floor")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data?.polygon_settings_floor) {
          const loadedSettings =
            data.polygon_settings_floor as unknown as PolygonSettings;
          const validatedSettings = validateAndMergeSettings(
            loadedSettings,
            "floor",
          );
          setSettings(validatedSettings);
        }
      }
    } catch (error) {
      console.error("Error loading polygon settings:", error);
    }
  }, [projectId, subProjectId, type]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(validateAndMergeSettings(initialSettings, type));
      return;
    }
    void loadSettings();
  }, [initialSettings, loadSettings, type]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      if (type === "genplan") {
        const { error } = await supabase
          .from("projects")
          .update({ polygon_settings_genplan: settings as unknown as Json })
          .eq("id", projectId);
        if (error) throw error;
      } else if (type === "building") {
        const table = subProjectId ? "sub_projects" : "projects";
        const id = subProjectId ?? projectId;
        const { error } = await supabase
          .from(table)
          .update({ polygon_settings_facade: settings as unknown as Json })
          .eq("id", id);
        if (error) throw error;
      } else {
        const table = subProjectId ? "sub_projects" : "projects";
        const id = subProjectId ?? projectId;
        const { error } = await supabase
          .from(table)
          .update({ polygon_settings_floor: settings as unknown as Json })
          .eq("id", id);
        if (error) throw error;
      }

      toast.success(t("polygonSettings.saved"));
      onSettingsChange?.(settings);
    } catch (error) {
      console.error("Error saving polygon settings:", error);
      toast.error(t("polygonSettings.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (path: string, value: string | number | boolean) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      const keys = path.split(".");
      let current: Record<string, unknown> = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!key) continue;
        const next = current[key];
        if (!next || typeof next !== "object") {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey) {
        current[lastKey] = value;
      }
      return newSettings;
    });
  };

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="mx-auto w-full max-w-xl">
          <CardTitle className="text-lg">
            {type === "genplan"
              ? t("polygonSettings.genplanTitle")
              : type === "floor"
                ? t("polygonSettings.floorTitle")
                : t("polygonSettings.buildingTitle")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mx-auto w-full max-w-xl space-y-5">
          {/* Цвета - для здания один цвет, для этажа - по статусам */}
          <div className="space-y-3">
            <h4 className="font-medium">{t("polygonSettings.colors")}</h4>
            {type !== "floor" ? (
              <div className={POLYGON_TOGGLE_GROUP_CLASS}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <Label className="mb-0">
                    {t("polygonSettings.buildingColor")}
                  </Label>
                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      type="color"
                      value={settings.colors.building || "#3b82f6"}
                      onChange={(e) =>
                        updateSettings("colors.building", e.target.value)
                      }
                      className="h-8 w-8 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {settings.colors.building || "#3b82f6"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("project.available")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.colors.available}
                      onChange={(e) =>
                        updateSettings("colors.available", e.target.value)
                      }
                      className="h-8 w-8 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {settings.colors.available}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("project.sold")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.colors.sold}
                      onChange={(e) =>
                        updateSettings("colors.sold", e.target.value)
                      }
                      className="h-8 w-8 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {settings.colors.sold}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("project.reserved")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.colors.reserved}
                      onChange={(e) =>
                        updateSettings("colors.reserved", e.target.value)
                      }
                      className="h-8 w-8 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {settings.colors.reserved}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Эффекты при наведении */}
          <div className="space-y-3">
            <h4 className="font-medium">{t("polygonSettings.hoverEffects")}</h4>
            <div className={POLYGON_TOGGLE_GROUP_CLASS}>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <Label>{t("polygonSettings.colorChange")}</Label>
                <Switch
                  checked={settings.hoverEffects.colorChange}
                  onCheckedChange={(checked) =>
                    updateSettings("hoverEffects.colorChange", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <Label>{t("polygonSettings.opacityChange")}</Label>
                <Switch
                  checked={settings.hoverEffects.opacityChange}
                  onCheckedChange={(checked) =>
                    updateSettings("hoverEffects.opacityChange", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <Label>{t("polygonSettings.glow")}</Label>
                <Switch
                  checked={settings.hoverEffects.glow}
                  onCheckedChange={(checked) =>
                    updateSettings("hoverEffects.glow", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Отображение информации */}
          <div className="space-y-3">
            <h4 className="font-medium">{t("polygonSettings.display")}</h4>
            <div className={POLYGON_TOGGLE_GROUP_CLASS}>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <Label>{t("polygonSettings.showNumbers")}</Label>
                <Switch
                  checked={settings.display.showNumbers}
                  onCheckedChange={(checked) =>
                    updateSettings("display.showNumbers", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <Label>{t("polygonSettings.showTooltip")}</Label>
                <Switch
                  checked={settings.display.showTooltip}
                  onCheckedChange={(checked) =>
                    updateSettings("display.showTooltip", checked)
                  }
                />
              </div>
              {type !== "building" && (
                <>
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <Label>{t("polygonSettings.showArea")}</Label>
                    <Switch
                      checked={settings.display.showArea}
                      onCheckedChange={(checked) =>
                        updateSettings("display.showArea", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <Label>{t("polygonSettings.showPrice")}</Label>
                    <Switch
                      checked={settings.display.showPrice}
                      onCheckedChange={(checked) =>
                        updateSettings("display.showPrice", checked)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Настройки прозрачности */}
          <div className="space-y-3">
            <h4 className="font-medium">{t("polygonSettings.opacity")}</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("polygonSettings.normalOpacity")}</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {Math.round(settings.opacity.normal * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.opacity.normal]}
                  onValueChange={([value]) =>
                    updateSettings(
                      "opacity.normal",
                      value ?? settings.opacity.normal,
                    )
                  }
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full max-w-[min(100%,280px)]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("polygonSettings.hoverOpacity")}</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {Math.round(settings.opacity.hover * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.opacity.hover]}
                  onValueChange={([value]) =>
                    updateSettings(
                      "opacity.hover",
                      value ?? settings.opacity.hover,
                    )
                  }
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full max-w-[min(100%,280px)]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={saveSettings}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading
                ? t("polygonSettings.saving")
                : t("polygonSettings.save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolygonCustomizationSettings;
