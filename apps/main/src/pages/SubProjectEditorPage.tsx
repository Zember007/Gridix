import { useCallback, useEffect, useState, type ClipboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@gridix/ui";
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import ProjectApartmentsManager from "@/components/projects/ProjectApartmentsManager";
import ApartmentPhotosManager from "@/features/apartment-photos-management/ui/ApartmentPhotosManager";
import ProjectFloorsManager from "@/components/projects/ProjectFloorsManager";
import AllFieldsManager from "@/features/projectEditor/ui/AllFieldsManager";
import { SubProjectImportModal } from "@/features/genplan/ui/SubProjectImportModal";
import BuildingImageEditor from "@/features/visualization/buildingImageEditor/ui/BuildingImageEditor";
import { SubProjectEditorSidebar } from "@/shared/ui/sidebar-component";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import type { SubProject } from "@/features/genplan/model/types";
import { normalizeSubProjectKind } from "@/components/project-selector/lib/subProjectDisplay";

type Tab =
  | "general"
  | "facade"
  | "apartments"
  | "floorplan"
  | "photos"
  | "fields";

export default function SubProjectEditorPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { projectSlug, subProjectSlug } = useParams<{
    projectSlug: string;
    subProjectSlug: string;
  }>();
  const { user, userProfile } = useAuth();

  const [subProject, setSubProject] = useState<SubProject | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handlePasteCoords = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("Text");
      const parts = text.split(",").map((part) => part.trim());

      if (parts.length === 2) {
        const [parsedLat, parsedLon] = parts;
        setSubProject((prev) =>
          prev
            ? {
                ...prev,
                latitude: parseFloat(parsedLat ?? "0"),
                longitude: parseFloat(parsedLon ?? "0"),
              }
            : prev,
        );
        e.preventDefault();
      }
    },
    [],
  );

  const load = useCallback(async () => {
    if (!projectSlug || !subProjectSlug) return;
    setLoading(true);
    try {
      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = UUID_RE.test(projectSlug);

      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq(isUUID ? "id" : "slug", projectSlug)
        .maybeSingle();

      if (!project) return;
      setProjectId(project.id);

      const { data: sp } = await supabase
        .from("sub_projects")
        .select("*")
        .eq("project_id", project.id)
        .eq("slug", subProjectSlug)
        .maybeSingle();

      setSubProject(sp ?? null);
    } finally {
      setLoading(false);
    }
  }, [projectSlug, subProjectSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!subProject) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sub_projects")
        .update({
          name: subProject.name,
          type: subProject.type,
          floors: subProject.floors,
          has_parking: subProject.has_parking,
          has_commercial: subProject.has_commercial,
          address: subProject.address?.trim() || null,
          latitude: subProject.latitude,
          longitude: subProject.longitude,
        })
        .eq("id", subProject.id);
      if (error) throw error;
      toast.success(t("projectEditor.projectSaved"));
    } catch (err) {
      console.error("Error saving sub-project:", err);
      toast.error(t("projectEditor.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSidebarSectionChange = (section: string) => {
    setActiveTab(section as Tab);
  };

  const subProjectType = normalizeSubProjectKind(subProject?.type);

  if (loading) return <LoadingProgress />;
  if (!subProject || !projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t("genplan.subProjects.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SubProjectEditorSidebar
        onSectionChange={handleSidebarSectionChange}
        activeTab={activeTab}
        userEmail={userProfile?.email || user?.email || ""}
        subProjectType={subProjectType}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`relative flex flex-1 flex-col bg-background transition-all duration-300 ${isCollapsed ? "md:ml-24 md:max-w-[calc(100vw-6rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 shrink-0 border-b bg-white">
            <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("projectEditor.back")}
                    </span>
                  </Button>
                  <div>
                    <h1 className="text-base font-bold lg:text-xl lg:leading-tight">
                      {subProject.name}
                    </h1>

                    <p className="text-xs text-muted-foreground">
                      {t("genplan.subProjects.editor")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    style={{
                      backgroundColor: ADMIN_THEME.primary,
                      color: ADMIN_THEME.textOnPrimary,
                    }}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {saving
                        ? t("projectEditor.saving")
                        : t("projectEditor.save")}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-6 lg:py-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("projectEditor.general")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name */}
                    <div>
                      <Label htmlFor="sp-name">
                        {t("projectEditor.projectName")}
                      </Label>
                      <Input
                        id="sp-name"
                        value={subProject.name}
                        onChange={(e) =>
                          setSubProject((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev,
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sp-address">
                        {t("projectEditor.address")}
                      </Label>
                      <Input
                        id="sp-address"
                        value={subProject.address ?? ""}
                        onChange={(e) =>
                          setSubProject((prev) =>
                            prev ? { ...prev, address: e.target.value } : prev,
                          )
                        }
                        placeholder={t("projectEditor.address")}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="sp-latitude">
                          {t("projectEditor.latitude")}
                        </Label>
                        <Input
                          id="sp-latitude"
                          type="number"
                          step="0.000001"
                          value={subProject.latitude ?? ""}
                          onPaste={handlePasteCoords}
                          onChange={(e) =>
                            setSubProject((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    latitude: e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  }
                                : prev,
                            )
                          }
                          placeholder={t("projectEditor.latitudePlaceholder")}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t("projectEditor.latitudeExample")}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="sp-longitude">
                          {t("projectEditor.longitude")}
                        </Label>
                        <Input
                          id="sp-longitude"
                          type="number"
                          step="0.000001"
                          value={subProject.longitude ?? ""}
                          onPaste={handlePasteCoords}
                          onChange={(e) =>
                            setSubProject((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    longitude: e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  }
                                : prev,
                            )
                          }
                          placeholder={t("projectEditor.longitudePlaceholder")}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t("projectEditor.longitudeExample")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Type */}
                      <div>
                        <Label>{t("projectEditor.projectType")}</Label>
                        <Select
                          value={subProject.type || "building"}
                          onValueChange={(v: string) =>
                            setSubProject((prev) =>
                              prev ? { ...prev, type: v } : prev,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="building">
                              {t("projectEditor.typeBuilding")}
                            </SelectItem>
                            <SelectItem value="object">
                              {t("projectEditor.typeObject")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Floors */}
                      {subProject.type !== "object" && (
                        <div>
                          <Label>{t("projectEditor.floors")} *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={subProject.floors ?? 1}
                            onChange={(e) =>
                              setSubProject((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      floors: parseInt(e.target.value) || 1,
                                    }
                                  : prev,
                              )
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={subProject.has_parking ?? false}
                          onCheckedChange={(v) =>
                            setSubProject((prev) =>
                              prev ? { ...prev, has_parking: v } : prev,
                            )
                          }
                        />
                        <Label>{t("projectEditor.hasParking")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={subProject.has_commercial ?? false}
                          onCheckedChange={(v) =>
                            setSubProject((prev) =>
                              prev ? { ...prev, has_commercial: v } : prev,
                            )
                          }
                        />
                        <Label>{t("projectEditor.hasCommercial")}</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "facade" && (
              <BuildingImageEditor
                projectId={projectId}
                subProjectId={subProject.id}
                initialFloors={subProject.floors ?? 1}
                subProjectType={subProjectType}
                currentImageUrl={subProject.building_image_url}
                onImageUpdate={(imageUrl) =>
                  setSubProject((prev) =>
                    prev ? { ...prev, building_image_url: imageUrl } : prev,
                  )
                }
              />
            )}

            {activeTab === "apartments" && (
              <>
                <div className="mb-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t("genplan.subProjects.addApartments")}
                  </Button>
                </div>
                <ProjectApartmentsManager
                  projectId={projectId}
                  subProjectId={subProject.id}
                  projectType={subProjectType}
                />
              </>
            )}

            {activeTab === "floorplan" && subProjectType !== "object" && (
              <ProjectFloorsManager
                projectId={projectId}
                subProjectId={subProject.id}
              />
            )}

            {activeTab === "photos" && (
              <ApartmentPhotosManager
                projectId={projectId}
                subProjectId={subProject.id}
              />
            )}

            {activeTab === "fields" && (
              <AllFieldsManager
                projectId={projectId}
                subProjectId={subProject.id}
              />
            )}
          </div>
        </div>
      </div>

      <SubProjectImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onManualFill={() => setImportModalOpen(false)}
        projectId={projectId}
        subProjectId={subProject.id}
      />
    </div>
  );
}
