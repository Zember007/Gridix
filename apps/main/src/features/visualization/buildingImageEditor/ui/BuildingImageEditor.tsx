import { Button, FileDropzone } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import {
  Upload,
  Save,
  Trash2,
  Image as ImageIcon,
  X,
  Plus,
  Check,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import PolygonCustomizationSettings, {
  type PolygonSettings,
} from "@/components/visualization/PolygonCustomizationSettings";
import type {
  BuildingImageEditorProps,
  GenplanEditorConfig,
} from "../model/types";
import { useBuildingEditorData } from "../hooks/useBuildingEditorData";
import {
  useGenplanEditorData,
  type InfraZoneFormData,
} from "../hooks/useGenplanEditorData";
import {
  useGenplanPolygonEditor,
  type GenplanLinkedEntityType,
} from "../hooks/useGenplanPolygonEditor";
import { BuildingPolygonWorkspace } from "./BuildingPolygonWorkspace";
import { useLanguage } from "@gridix/utils/react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";

// ─── Genplan zone types ────────────────────────────────────────────────────

const INFRA_ZONE_TYPES = [
  "playground",
  "parking",
  "amenity",
  "green_zone",
  "other",
] as const;

// ─── Infrastructure zone inline form ───────────────────────────────────────

function InfraZoneForm({
  initial,
  saving,
  uploadingZoneImage,
  onSave,
  onCancel,
  t,
}: {
  initial?: Partial<InfraZoneFormData>;
  saving: boolean;
  uploadingZoneImage: boolean;
  onSave: (data: InfraZoneFormData, imageFile?: File | null) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [zoneType, setZoneType] = useState(initial?.zone_type ?? "other");
  const [description, setDescription] = useState(
    initial?.short_description ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(
    initial?.cover_image ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(
      {
        id: initial?.id,
        name: name.trim(),
        zone_type: zoneType,
        short_description: description,
        cover_image: existingImage,
      },
      imageFile,
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs">{t("genplan.infraZones.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("genplan.infraZones.namePlaceholder")}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t("genplan.infraZones.type")}</Label>
          <Select value={zoneType} onValueChange={setZoneType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INFRA_ZONE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`genplan.infraZones.type_${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">{t("genplan.infraZones.description")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
      <div>
        <Label className="text-xs">{t("genplan.infraZones.photo")}</Label>
        <div className="mt-1 flex items-center gap-2">
          {existingImage && (
            <img
              src={existingImage}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImageFile(file);
              if (file) setExistingImage(URL.createObjectURL(file));
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingZoneImage}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {uploadingZoneImage
              ? t("genplan.infraZones.uploadingPhoto")
              : t("genplan.infraZones.photo")}
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          {saving ? t("common.saving") : t("common.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

// ─── Genplan editor panel (reuses BuildingPolygonWorkspace + same polygon UX as facade) ──

function GenplanEditorPanel({
  projectId,
  currentImageUrl,
  genplan,
}: {
  projectId: string;
  currentImageUrl?: string | null;
  genplan: GenplanEditorConfig;
}) {
  const { t } = useLanguage();
  const data = useGenplanEditorData({ projectId, currentImageUrl, genplan });
  const gp = useGenplanPolygonEditor({
    projectId,
    genplan,
    infrastructureZones: data.infraZones,
    masterplanImageUrl: data.masterplanImageUrl,
    uploadedUrlRef: data.uploadedUrlRef,
    t,
  });

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [addingZone, setAddingZone] = useState(false);

  const viewerWrapRef = useRef<HTMLDivElement | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoverPopupPos, setHoverPopupPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [guidedModeEnabled, setGuidedModeEnabled] = useState(true);
  const [postSaveGuidance, setPostSaveGuidance] = useState<{
    savedName: string;
    nextName: string;
    nextId: string;
    nextType: GenplanLinkedEntityType;
  } | null>(null);

  const entitySelectValue =
    gp.selectedEntityId && gp.selectedEntityType
      ? `${gp.selectedEntityType}:${gp.selectedEntityId}`
      : "";

  const updateMousePos = useCallback((e: React.MouseEvent) => {
    const rect = viewerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastMousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const clearHoveredAnnotation = useCallback(() => {
    setHoveredAreaId(null);
    setHoverPopupPos(null);
  }, []);

  useEffect(() => {
    if (!guidedModeEnabled || gp.hasCompletedAllSubProjects) {
      setPostSaveGuidance(null);
    }
  }, [guidedModeEnabled, gp.hasCompletedAllSubProjects]);

  const handleEntitySelect = (value: string) => {
    if (!value) return;
    const [type, id] = value.split(":", 2) as [GenplanLinkedEntityType, string];
    if (!id || (type !== "sub_project" && type !== "infrastructure_zone")) {
      return;
    }
    void gp.selectEntity(type, id);
  };

  const handlePolygonSaveWithGuidance = async () => {
    const savedName =
      gp.selectedEntityType && gp.selectedEntityId
        ? gp.entityDisplayName(gp.selectedEntityType, gp.selectedEntityId)
        : "";
    const expectedMissing = gp.missingSubProjects.filter(
      (sp) => sp.id !== gp.selectedEntityId,
    );
    const nextSp = expectedMissing[0] ?? null;
    const saved = await gp.handlePolygonSave();
    if (!saved) return;
    if (!guidedModeEnabled || !nextSp) {
      setPostSaveGuidance(null);
      return;
    }
    setPostSaveGuidance({
      savedName,
      nextName: nextSp.name,
      nextId: nextSp.id,
      nextType: "sub_project",
    });
  };

  const hoveredAreaLabel =
    hoveredAreaId && gp.labelMap[hoveredAreaId]
      ? gp.labelMap[hoveredAreaId]
      : null;

  if (!data.masterplanImageUrl) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardDescription>
              {t("buildingImage.genplan.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">
              {t("genplan.editor.imageTitle")}
            </p>
            <FileDropzone
              onFilesSelected={(files) => void data.handleUploadImage(files)}
              accept="image/*"
              disabled={data.uploading}
              className="min-h-[200px]"
            />
            {data.uploading && (
              <p className="text-center text-sm text-muted-foreground">
                {t("common.uploading")}…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasSelectableEntities =
    genplan.subProjects.length > 0 || data.infraZones.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardDescription>
            {t("buildingImage.genplan.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) void data.handleUploadImage([file]);
                };
                input.click();
              }}
              disabled={data.uploading || gp.isEditing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {data.uploading
                ? t("buildingImage.uploading")
                : t("buildingImage.upload")}
            </Button>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <img
              src={data.masterplanImageUrl}
              alt=""
              className="mx-auto h-auto max-h-48 max-w-full rounded object-contain"
            />
          </div>
        </CardContent>
      </Card>

      {data.masterplanImageUrl && genplan.masterplanId && (
        <>
          {!hasSelectableEntities ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                {t("buildingImage.genplan.noEntities")}
              </CardContent>
            </Card>
          ) : (
            <BuildingPolygonWorkspace
              viewerWrapRef={viewerWrapRef}
              updateMousePos={updateMousePos}
              clearHoveredAnnotation={clearHoveredAnnotation}
              polygonCardTitle={t("buildingImage.genplan.polygonsTitle")}
              polygonCardDescription={
                <span>{t("buildingImage.genplan.polygonsDescription")}</span>
              }
              selectionBlock={
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="whitespace-nowrap text-sm font-medium">
                      {t("buildingImage.genplan.selectLabel")}
                    </Label>
                    <Select
                      value={entitySelectValue}
                      onValueChange={handleEntitySelect}
                      disabled={gp.isEditing}
                    >
                      <SelectTrigger className="h-8 min-w-[200px] max-w-[320px] text-xs">
                        <SelectValue
                          placeholder={t(
                            "buildingImage.genplan.selectPlaceholder",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {genplan.subProjects.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs">
                              {t("genplan.subProjects.title")}
                            </SelectLabel>
                            {genplan.subProjects.map((sp) => (
                              <SelectItem
                                key={sp.id}
                                value={`sub_project:${sp.id}`}
                              >
                                {sp.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {data.infraZones.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs">
                              {t("genplan.infraZones.title")}
                            </SelectLabel>
                            {data.infraZones.map((iz) => (
                              <SelectItem
                                key={iz.id}
                                value={`infrastructure_zone:${iz.id}`}
                              >
                                {iz.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {!gp.isEditing && (
                    <Button
                      type="button"
                      onClick={() => {
                        if (gp.selectedEntityType && gp.selectedEntityId) {
                          void gp.selectEntity(
                            gp.selectedEntityType,
                            gp.selectedEntityId,
                          );
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={!gp.selectedEntityType || !gp.selectedEntityId}
                    >
                      <ImageIcon className="mr-1 h-3 w-3" />
                      {t("buildingImage.genplan.addNew")}
                    </Button>
                  )}
                </>
              }
              selectionBlockNeedsPaddingForError={false}
              guidedProgressBlock={
                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="text-sm text-muted-foreground">
                      {t("buildingImage.genplan.guided.progress.rangeLabel")}{" "}
                      <span className="font-medium text-foreground">
                        {gp.totalSubProjectsCount}
                      </span>
                    </div>
                    <div>
                      {t("buildingImage.guided.progress.configured")}{" "}
                      <span className="font-medium">
                        {gp.configuredSubProjectCount} /{" "}
                        {gp.totalSubProjectsCount}
                      </span>
                    </div>
                    <div>
                      {t("buildingImage.guided.progress.missing")}{" "}
                      <span className="font-medium">
                        {gp.missingSubProjects.length}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Label
                        htmlFor="genplan-guided-toggle"
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        {t("buildingImage.genplan.guided.toggle")}
                      </Label>
                      <Switch
                        id="genplan-guided-toggle"
                        checked={guidedModeEnabled}
                        onCheckedChange={setGuidedModeEnabled}
                      />
                    </div>
                  </div>
                  {gp.hasCompletedAllSubProjects ? (
                    <p className="text-sm font-medium text-emerald-600">
                      {t("buildingImage.genplan.guided.progress.allConfigured")}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="shrink-0">
                        {t("buildingImage.genplan.guided.progress.missingList")}
                      </span>
                      {gp.missingSubProjects.length > 0 && (
                        <div className="flex-1 overflow-x-auto pb-1">
                          <div className="flex min-w-max gap-2">
                            {gp.missingSubProjects.map((sp) => (
                              <Button
                                key={sp.id}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  void gp.selectEntity("sub_project", sp.id);
                                }}
                                disabled={gp.isEditing}
                              >
                                {sp.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
              canvasTitle={
                gp.isCreatingNewArea &&
                gp.selectedEntityType &&
                gp.selectedEntityId
                  ? t("buildingImage.genplan.creating", {
                      name: gp.entityDisplayName(
                        gp.selectedEntityType,
                        gp.selectedEntityId,
                      ),
                    })
                  : t("buildingImage.genplan.canvas")
              }
              showEditingToolbar={!!(gp.isEditing || gp.currentShape)}
              editingToolbar={
                <div className="flex items-center gap-2">
                  <Button
                    onClick={gp.handleUndo}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={gp.undoStackRef.current.length === 0}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={gp.handleRedo}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={gp.redoStackRef.current.length === 0}
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => void gp.handleDeletePoint()}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!gp.isEditing || gp.pointCount <= 3}
                    title="Delete point"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={gp.selectPrevVertex}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!gp.canSelectVertex()}
                    title="Previous point"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[56px] text-center text-xs text-muted-foreground">
                    {gp.selectedVertexDisplayIndex}/{gp.pointCount}
                  </span>
                  <Button
                    onClick={gp.selectNextVertex}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!gp.canSelectVertex()}
                    title="Next point"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => {
                      void handlePolygonSaveWithGuidance();
                    }}
                    size="sm"
                    className="h-8"
                    disabled={
                      gp.isCreatingNewArea &&
                      (gp.currentShape?.points.length ?? 0) === 0
                    }
                  >
                    <Save className="mr-1 h-3 w-3" />
                    {gp.isCreatingNewArea
                      ? t("buildingImage.polygon.create")
                      : t("buildingImage.polygon.save")}
                  </Button>
                  {gp.editingAreaId && !gp.isCreatingNewArea && (
                    <Button
                      onClick={async () => {
                        const deleted = await gp.handleDeleteAreaPolygon(
                          gp.editingAreaId!,
                        );
                        if (deleted) {
                          setPostSaveGuidance(null);
                          gp.resetEditing();
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      {t("buildingImage.genplan.delete")}
                    </Button>
                  )}
                  <Button
                    onClick={() => void gp.handlePolygonCancel()}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <X className="mr-1 h-3 w-3" />
                    {t("buildingImage.polygon.cancel")}
                  </Button>
                </div>
              }
              polygonAnnotatorRef={gp.polygonAnnotatorRef}
              polygonAnnotatorProps={{
                engine: "controlled",
                imageUrl: data.masterplanImageUrl!,
                shapes: gp.shapes,
                currentShape: gp.currentShape,
                selectedVertexIndex: gp.selectedVertexIndex,
                onSelectVertexIndex: gp.setSelectedVertexIndex,
                onCurrentShapeUpdate: gp.handleCurrentShapeUpdate,
                onClickAnnotationId: (id) => {
                  const areaRow = genplan.areas.find((a) => a.id === id);
                  if (!areaRow) return;
                  if (
                    areaRow.linked_entity_type !== "sub_project" &&
                    areaRow.linked_entity_type !== "infrastructure_zone"
                  ) {
                    return;
                  }
                  if (areaRow.id === gp.editingAreaId) return;
                  void (async () => {
                    const persisted =
                      await gp.persistCurrentPolygonBeforeEntitySwitch();
                    if (!persisted) return;
                    setPostSaveGuidance(null);
                    gp.requestStartEditingArea(areaRow.id);
                  })();
                },
                onHoverAnnotationId: (id) => {
                  if (gp.isEditing) {
                    clearHoveredAnnotation();
                    return;
                  }
                  if (!id) {
                    clearHoveredAnnotation();
                    return;
                  }
                  setHoveredAreaId(id);
                  setHoverPopupPos(lastMousePosRef.current);
                },
                mode: gp.isEditing ? "edit" : "view",
                drawingEnabled: gp.isPolygonCreationEnabled,
                getStyleById: gp.getStyleById,
              }}
              hoverPopup={
                !gp.isEditing &&
                hoveredAreaId &&
                hoverPopupPos &&
                hoveredAreaLabel ? (
                  <div
                    className="pointer-events-none absolute z-20 max-w-[200px] overflow-hidden rounded-2xl border border-white/70 shadow-xl"
                    style={{
                      left: hoverPopupPos.x + 12,
                      top: hoverPopupPos.y + 12,
                    }}
                  >
                    <div className="line-clamp-2 bg-gradient-to-b from-[#4E8DFF] to-[#3B82F6] px-3 py-2 text-center text-sm font-semibold leading-tight text-white">
                      {hoveredAreaLabel}
                    </div>
                    <div className="bg-[#3A3A3D] px-3 py-2 text-center text-xs font-medium leading-none text-white">
                      {t("buildingImage.genplan.hoverCaption")}
                    </div>
                  </div>
                ) : null
              }
              guidedOverlay={
                guidedModeEnabled &&
                !gp.hasCompletedAllSubProjects &&
                postSaveGuidance ? (
                  <div className="pointer-events-none absolute inset-0 z-30">
                    <div className="pointer-events-auto absolute left-1/2 top-4 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-lg border border-primary/30 bg-background/95 p-3 shadow-lg">
                      <p className="text-sm font-medium">
                        {t("buildingImage.genplan.guided.helper.savedAndNext", {
                          name: postSaveGuidance.savedName,
                          nextName: postSaveGuidance.nextName,
                        })}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            void gp.selectEntity(
                              postSaveGuidance.nextType,
                              postSaveGuidance.nextId,
                            );
                          }}
                        >
                          {t("buildingImage.genplan.guided.helper.goNext")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPostSaveGuidance(null)}
                        >
                          {t("buildingImage.guided.helper.stayHere")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null
              }
            />
          )}
        </>
      )}

      {/* Infrastructure zones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              {t("genplan.infraZones.title")}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setAddingZone(true);
                setEditingZoneId(null);
              }}
              disabled={addingZone}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("genplan.infraZones.add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {addingZone && (
            <InfraZoneForm
              saving={data.savingZone}
              uploadingZoneImage={data.uploadingZoneImage}
              onSave={(formData, imageFile) => {
                void data.handleSaveInfraZone(formData, imageFile).then(() => {
                  setAddingZone(false);
                });
              }}
              onCancel={() => setAddingZone(false)}
              t={t}
            />
          )}

          {data.infraZones.length === 0 && !addingZone && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              {t("genplan.infraZones.empty")}
            </p>
          )}

          {data.infraZones.map((zone) => (
            <div key={zone.id}>
              {editingZoneId === zone.id ? (
                <InfraZoneForm
                  initial={{
                    id: zone.id,
                    name: zone.name,
                    zone_type: zone.zone_type ?? "other",
                    short_description: zone.short_description ?? "",
                    cover_image: zone.cover_image,
                  }}
                  saving={data.savingZone}
                  uploadingZoneImage={data.uploadingZoneImage}
                  onSave={(formData, imageFile) => {
                    void data
                      .handleSaveInfraZone(formData, imageFile)
                      .then(() => {
                        setEditingZoneId(null);
                      });
                  }}
                  onCancel={() => setEditingZoneId(null)}
                  t={t}
                />
              ) : (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  {zone.cover_image ? (
                    <img
                      src={zone.cover_image}
                      alt={zone.name}
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{zone.name}</span>
                      {zone.zone_type && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t(`genplan.infraZones.type_${zone.zone_type}`)}
                        </span>
                      )}
                    </div>
                    {zone.short_description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {zone.short_description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingZoneId(zone.id);
                        setAddingZone(false);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => void data.handleDeleteInfraZone(zone.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Polygon display settings */}
      {genplan.masterplanId && (
        <PolygonCustomizationSettings
          projectId={projectId}
          type="genplan"
          masterplanId={genplan.masterplanId}
        />
      )}
    </div>
  );
}

// ─── Building/Object mode panel (original component body) ────────────────

const BuildingModePanel = ({
  projectId,
  subProjectId,
  initialFloors,
  subProjectType,
  currentImageUrl,
  onImageUpdate,
}: Omit<BuildingImageEditorProps, "genplan" | "subProjectType"> & {
  subProjectType?: "building" | "object";
}) => {
  const { loader, facade, floor, selectFacade } = useBuildingEditorData({
    projectId,
    subProjectId,
    initialFloors,
    subProjectType,
    currentImageUrl,
    onImageUpdate,
  });
  const viewerWrapRef = useRef<HTMLDivElement | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [hoverPopupPos, setHoverPopupPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const floorInputRange = useMemo(() => {
    if (loader.isObjectProject) {
      const objectNumbers =
        loader.apartmentNumbers.length > 0
          ? loader.apartmentNumbers
          : Array.from({ length: 20 }, (_, i) => i + 1);
      const sortedNumbers = [...objectNumbers].sort((a, b) => a - b);
      const min = sortedNumbers[0] ?? 1;
      const max = sortedNumbers[sortedNumbers.length - 1] ?? 20;
      return {
        min,
        max,
        allowed: new Set(sortedNumbers),
      };
    }

    const configuredMax = Math.max(loader.floors, 0);
    const existingMax =
      loader.buildingFloors.length > 0
        ? Math.max(...loader.buildingFloors.map((f) => f.floor_number))
        : 0;
    const max = Math.max(configuredMax, existingMax);

    return {
      min: 0,
      max,
      allowed: null as Set<number> | null,
    };
  }, [
    loader.isObjectProject,
    loader.apartmentNumbers,
    loader.floors,
    loader.buildingFloors,
  ]);

  const [floorInputValue, setFloorInputValue] = useState(
    String(floor.selectedFloor),
  );
  const [floorInputError, setFloorInputError] = useState<string | null>(null);
  const [guidedModeEnabled, setGuidedModeEnabled] = useState(true);
  const [postSaveGuidance, setPostSaveGuidance] = useState<{
    savedFloor: number;
    nextFloor: number | null;
  } | null>(null);

  useEffect(() => {
    setFloorInputValue(String(floor.selectedFloor));
    setFloorInputError(null);
  }, [floor.selectedFloor]);

  const hoveredFloor = useMemo(
    () =>
      hoveredFloorId
        ? (loader.buildingFloors.find(
            (floorItem) => floorItem.id === hoveredFloorId,
          ) ?? null)
        : null,
    [hoveredFloorId, loader.buildingFloors],
  );

  const updateMousePos = useCallback((e: React.MouseEvent) => {
    const rect = viewerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastMousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const clearHoveredFloor = useCallback(() => {
    setHoveredFloorId(null);
    setHoverPopupPos(null);
  }, []);

  const parsedFloorInput = Number(floorInputValue);
  const floorInputIsInteger =
    floorInputValue.trim() !== "" && Number.isInteger(parsedFloorInput);
  const floorInRange =
    floorInputIsInteger &&
    parsedFloorInput >= floorInputRange.min &&
    parsedFloorInput <= floorInputRange.max &&
    (!floorInputRange.allowed || floorInputRange.allowed.has(parsedFloorInput));
  const floorInputInvalid =
    (floorInputValue.trim() !== "" && !floorInRange) ||
    floorInputError !== null;
  const floorInputInvalidText = loader.isObjectProject
    ? loader.t("buildingImage.object.allowedRange", {
        min: floorInputRange.min,
        max: floorInputRange.max,
      })
    : loader.t("buildingImage.floors.allowedRange", {
        min: floorInputRange.min,
        max: floorInputRange.max,
      });
  const allFloorsInRange = useMemo(() => {
    if (floorInputRange.max < floorInputRange.min) {
      return [];
    }
    if (floorInputRange.allowed) {
      return Array.from(floorInputRange.allowed).sort((a, b) => a - b);
    }
    return Array.from(
      { length: floorInputRange.max - floorInputRange.min + 1 },
      (_, index) => floorInputRange.min + index,
    );
  }, [floorInputRange]);
  const allFloorsSet = useMemo(
    () => new Set(allFloorsInRange),
    [allFloorsInRange],
  );
  const configuredFloors = useMemo(() => {
    const uniqueFloors = Array.from(
      new Set(
        loader.buildingFloors
          .map((floorItem) => floorItem.floor_number)
          .filter((floorNumber) => allFloorsSet.has(floorNumber)),
      ),
    );
    return uniqueFloors.sort((a, b) => a - b);
  }, [allFloorsSet, loader.buildingFloors]);
  const configuredFloorsSet = useMemo(
    () => new Set(configuredFloors),
    [configuredFloors],
  );
  const missingFloors = useMemo(
    () =>
      allFloorsInRange.filter(
        (floorNumber) => !configuredFloorsSet.has(floorNumber),
      ),
    [allFloorsInRange, configuredFloorsSet],
  );
  const configuredCount = configuredFloors.length;
  const missingCount = missingFloors.length;
  const totalFloorsCount = allFloorsInRange.length;
  const hasCompletedAllFloors = totalFloorsCount > 0 && missingCount === 0;
  const floorRangeLabel =
    totalFloorsCount > 0
      ? `${allFloorsInRange[0]}-${allFloorsInRange[totalFloorsCount - 1]}`
      : `${floorInputRange.min}-${floorInputRange.max}`;
  const facadePolygonInitialSettings = useMemo(
    () =>
      ({
        colors: {
          available: "#3b82f6",
          sold: "#ef4444",
          reserved: "#f59e0b",
          building: loader.facadeDisplaySettings.colors.building,
        },
        hoverEffects: {
          scale: loader.facadeDisplaySettings.hoverEffects.scale,
          colorChange: loader.facadeDisplaySettings.hoverEffects.colorChange,
          opacityChange:
            loader.facadeDisplaySettings.hoverEffects.opacityChange,
          glow: loader.facadeDisplaySettings.hoverEffects.glow,
        },
        display: {
          showNumbers: loader.facadeDisplaySettings.display.showNumbers,
          showTooltip: loader.facadeDisplaySettings.display.showTooltip,
          showArea: false,
          showPrice: false,
        },
        opacity: {
          normal: loader.facadeDisplaySettings.opacity.normal,
          hover: loader.facadeDisplaySettings.opacity.hover,
        },
      }) satisfies PolygonSettings,
    [loader.facadeDisplaySettings],
  );

  useEffect(() => {
    if (!guidedModeEnabled || hasCompletedAllFloors) {
      setPostSaveGuidance(null);
    }
  }, [guidedModeEnabled, hasCompletedAllFloors]);

  const handleFloorInputChange = (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      setFloorInputValue(value);
      setFloorInputError(null);
      return;
    }

    const nextNumber = Number(trimmedValue);
    if (!Number.isFinite(nextNumber) || !Number.isInteger(nextNumber)) {
      setFloorInputValue(value);
      setFloorInputError(floorInputInvalidText);
      return;
    }

    if (nextNumber < floorInputRange.min || nextNumber > floorInputRange.max) {
      setFloorInputError(floorInputInvalidText);
      return;
    }

    setFloorInputValue(value);
    if (floorInputRange.allowed && !floorInputRange.allowed.has(nextNumber)) {
      setFloorInputError(floorInputInvalidText);
      return;
    }

    setFloorInputError(null);
  };

  const selectFloorNumber = async (floorNumber: number) => {
    const existingFloor = loader.buildingFloors.find(
      (floorItem) => floorItem.floor_number === floorNumber,
    );

    // No-op when user re-selects the currently edited floor.
    if (existingFloor && existingFloor.id === floor.editingFloorId) {
      return;
    }

    if (
      !existingFloor &&
      floor.selectedFloor === floorNumber &&
      floor.isCreatingNewFloor
    ) {
      return;
    }

    const persisted = await floor.persistCurrentPolygonBeforeFloorSwitch();
    if (!persisted) {
      setFloorInputValue(String(floor.selectedFloor));
      return;
    }

    setFloorInputValue(String(floorNumber));
    setFloorInputError(null);
    setPostSaveGuidance(null);
    floor.setSelectedFloor(floorNumber);

    if (existingFloor) {
      floor.requestStartEditingFloor(existingFloor.id);
      return;
    }

    floor.startCreatingNewFloor(floorNumber);
  };

  const applyFloorInputSelection = async () => {
    if (!floorInRange || floorInputError) {
      setFloorInputError(floorInputInvalidText);
      return;
    }
    await selectFloorNumber(parsedFloorInput);
  };

  const handlePolygonSaveWithGuidance = async () => {
    const savedFloor = floor.selectedFloor;
    const expectedMissingAfterSave = missingFloors.filter(
      (floorNumber) => floorNumber !== savedFloor,
    );
    const nextMissingFloor =
      expectedMissingAfterSave.find(
        (floorNumber) => floorNumber > savedFloor,
      ) ??
      expectedMissingAfterSave[0] ??
      null;
    const saved = await floor.handlePolygonSave();
    if (!saved) return;
    if (!guidedModeEnabled || nextMissingFloor === null) {
      setPostSaveGuidance(null);
      return;
    }
    setPostSaveGuidance({
      savedFloor,
      nextFloor: nextMissingFloor,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardDescription>
            {loader.isObjectProject
              ? loader.t("buildingImage.object.description")
              : loader.t("buildingImage.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {loader.facades.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${
                      loader.activeFacade?.id === f.id
                        ? "border-primary bg-white"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      void selectFacade(f.id, f.image_url ?? null);
                    }}
                    disabled={floor.isEditing}
                    title={f.name}
                  >
                    <span className="max-w-[180px] truncate font-medium">
                      {f.name}
                    </span>
                    {f.order_index === 0 && (
                      <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">
                        primary
                      </span>
                    )}
                  </button>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => facade.setIsAddingFacade((v) => !v)}
                  disabled={floor.isEditing}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {loader.t("buildingImage.facades.add")}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  ref={facade.fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={facade.handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => facade.fileInputRef.current?.click()}
                  disabled={facade.uploading || !loader.activeFacade?.id}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {facade.uploading
                    ? loader.t("buildingImage.uploading")
                    : loader.t("buildingImage.facades.upload")}
                </Button>
              </div>
            </div>

            {facade.isAddingFacade && (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="new-facade-name">
                      {loader.t("buildingImage.facades.name")}
                    </Label>
                    <Input
                      id="new-facade-name"
                      value={facade.newFacadeName}
                      onChange={(e) => facade.setNewFacadeName(e.target.value)}
                      placeholder={loader.t(
                        "buildingImage.facades.namePlaceholder",
                      )}
                      disabled={facade.savingFacade}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-facade-file">
                      {loader.t("buildingImage.facades.image")}
                    </Label>
                    <Input
                      id="new-facade-file"
                      ref={facade.newFacadeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        facade.setNewFacadeFile(e.target.files?.[0] ?? null)
                      }
                      disabled={facade.savingFacade}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={facade.handleCreateFacade}
                    disabled={facade.savingFacade}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {facade.savingFacade
                      ? loader.t("buildingImage.facades.creating")
                      : loader.t("buildingImage.facades.create")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={facade.cancelAddingFacade}
                    disabled={facade.savingFacade}
                  >
                    {loader.t("buildingImage.facades.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {loader.activeFacade && (
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="facade-name" className="text-sm font-medium">
                  {loader.t("buildingImage.facades.current")}
                </Label>
                <Input
                  id="facade-name"
                  className="max-w-[340px]"
                  value={loader.activeFacade.name}
                  onChange={(e) =>
                    facade.updateFacadeNameLocally(
                      loader.activeFacade!.id,
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    void facade.handleRenameFacade(
                      loader.activeFacade!.id,
                      e.target.value,
                    )
                  }
                  disabled={floor.isEditing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    void facade.handleDeleteFacade(loader.activeFacade!.id)
                  }
                  disabled={floor.isEditing || loader.facades.length <= 1}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {loader.t("buildingImage.facades.delete")}
                </Button>
              </div>
            )}
          </div>

          {loader.buildingImage && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <img
                src={loader.buildingImage}
                alt="Здание"
                className="mx-auto h-auto max-h-48 max-w-full rounded object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {loader.buildingImage && loader.activeFacade?.id && (
        <BuildingPolygonWorkspace
          viewerWrapRef={viewerWrapRef}
          updateMousePos={updateMousePos}
          clearHoveredAnnotation={clearHoveredFloor}
          polygonCardTitle={
            loader.isObjectProject
              ? loader.t("buildingImage.object.polygonsTitle")
              : loader.t("buildingImage.floors.title")
          }
          polygonCardDescription={
            <>
              <span>
                {loader.isObjectProject
                  ? loader.t("buildingImage.object.polygonsDescription")
                  : loader.t("buildingImage.floors.description")}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {loader.isObjectProject
                  ? loader.t("buildingImage.object.allowedRange", {
                      min: floorInputRange.min,
                      max: floorInputRange.max,
                    })
                  : loader.t("buildingImage.floors.allowedRange", {
                      min: floorInputRange.min,
                      max: floorInputRange.max,
                    })}
              </span>
            </>
          }
          selectionBlock={
            <>
              <div className="relative flex flex-col">
                <div className="flex items-center gap-2">
                  <Label htmlFor="floor-select" className="text-sm font-medium">
                    {loader.isObjectProject
                      ? loader.t("buildingImage.object.number")
                      : loader.t("buildingImage.floors.floor")}
                  </Label>
                  <Input
                    id="floor-select"
                    type="number"
                    inputMode="numeric"
                    min={floorInputRange.min}
                    max={floorInputRange.max}
                    step={1}
                    value={floorInputValue}
                    onChange={(e) => handleFloorInputChange(e.target.value)}
                    onBlur={() => {
                      void applyFloorInputSelection();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyFloorInputSelection();
                      }
                    }}
                    className={`h-8 w-[92px] ${
                      floorInputInvalid ? "border-destructive" : ""
                    }`}
                    disabled={floor.isEditing}
                  />
                </div>
                {floorInputInvalid && (
                  <p className="absolute left-0 top-full mt-1 whitespace-nowrap text-xs text-destructive">
                    {floorInputInvalidText}
                  </p>
                )}
              </div>

              {!floor.isEditing && (
                <Button
                  onClick={() => {
                    void applyFloorInputSelection();
                  }}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <ImageIcon className="mr-1 h-3 w-3" />
                  {loader.isObjectProject
                    ? loader.t("buildingImage.object.addNew")
                    : loader.t("buildingImage.floors.addNew")}
                </Button>
              )}
            </>
          }
          selectionBlockNeedsPaddingForError={floorInputInvalid}
          guidedProgressBlock={
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="text-sm text-muted-foreground">
                  {loader.isObjectProject
                    ? loader.t(
                        "buildingImage.object.guided.progress.floorRange",
                      )
                    : loader.t("buildingImage.guided.progress.floorRange")}{" "}
                  <span className="font-medium text-foreground">
                    {floorRangeLabel}
                  </span>
                </div>
                <div>
                  {loader.t("buildingImage.guided.progress.configured")}{" "}
                  <span className="font-medium">
                    {configuredCount} / {totalFloorsCount}
                  </span>
                </div>
                <div>
                  {loader.t("buildingImage.guided.progress.missing")}{" "}
                  <span className="font-medium">{missingCount}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Label
                    htmlFor="guided-mode-toggle"
                    className="whitespace-nowrap text-sm font-medium"
                  >
                    {loader.isObjectProject
                      ? loader.t("buildingImage.object.guided.toggle")
                      : loader.t("buildingImage.guided.toggle")}
                  </Label>
                  <Switch
                    id="guided-mode-toggle"
                    checked={guidedModeEnabled}
                    onCheckedChange={setGuidedModeEnabled}
                  />
                </div>
              </div>
              {hasCompletedAllFloors ? (
                <p className="text-sm font-medium text-emerald-600">
                  {loader.isObjectProject
                    ? loader.t(
                        "buildingImage.object.guided.progress.allConfigured",
                      )
                    : loader.t("buildingImage.guided.progress.allConfigured")}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0">
                      {loader.isObjectProject
                        ? loader.t(
                            "buildingImage.object.guided.progress.missingFloors",
                          )
                        : loader.t(
                            "buildingImage.guided.progress.missingFloors",
                          )}
                    </span>
                    {missingFloors.length > 0 && (
                      <div className="flex-1 overflow-x-auto pb-1">
                        <div className="flex min-w-max gap-2">
                          {missingFloors.map((missingFloor) => (
                            <Button
                              key={missingFloor}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                void selectFloorNumber(missingFloor);
                              }}
                            >
                              {missingFloor}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          }
          canvasTitle={
            floor.isCreatingNewFloor
              ? loader.isObjectProject
                ? loader.t("buildingImage.object.creating", {
                    number: floor.selectedFloor,
                  })
                : loader.t("buildingImage.floors.creatingNew", {
                    floor: floor.selectedFloor,
                  })
              : loader.isObjectProject
                ? loader.t("buildingImage.object.plan")
                : loader.t("buildingImage.floors.canvas")
          }
          showEditingToolbar={!!(floor.isEditing || floor.currentShape)}
          editingToolbar={
            <div className="flex items-center gap-2">
              <Button
                onClick={floor.handleUndo}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={floor.undoStackRef.current.length === 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={floor.handleRedo}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={floor.redoStackRef.current.length === 0}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => void floor.handleDeletePoint()}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!floor.isEditing || floor.pointCount <= 3}
                title="Delete point"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={floor.selectPrevVertex}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!floor.canSelectVertex()}
                title="Previous point"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[56px] text-center text-xs text-muted-foreground">
                {floor.selectedVertexDisplayIndex}/{floor.pointCount}
              </span>
              <Button
                onClick={floor.selectNextVertex}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!floor.canSelectVertex()}
                title="Next point"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => {
                  void handlePolygonSaveWithGuidance();
                }}
                size="sm"
                className="h-8"
                disabled={
                  floor.isCreatingNewFloor &&
                  floor.currentShape?.points.length === 0
                }
              >
                <Save className="mr-1 h-3 w-3" />
                {floor.isCreatingNewFloor
                  ? loader.t("buildingImage.polygon.create")
                  : loader.t("buildingImage.polygon.save")}
              </Button>
              {floor.editingFloorId && !floor.isCreatingNewFloor && (
                <Button
                  onClick={async () => {
                    const deleted = await floor.handleDeleteFloorPolygon(
                      floor.editingFloorId!,
                    );
                    if (deleted) {
                      setPostSaveGuidance(null);
                      floor.resetEditing();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {loader.isObjectProject
                    ? loader.t("buildingImage.object.delete")
                    : loader.t("buildingImage.floors.delete")}
                </Button>
              )}
              <Button
                onClick={floor.handlePolygonCancel}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <X className="mr-1 h-3 w-3" />
                {loader.t("buildingImage.polygon.cancel")}
              </Button>
            </div>
          }
          polygonAnnotatorRef={floor.polygonAnnotatorRef}
          polygonAnnotatorProps={{
            engine: "controlled",
            imageUrl: loader.buildingImage,
            shapes: loader.shapes,
            currentShape: floor.currentShape,
            selectedVertexIndex: floor.selectedVertexIndex,
            onSelectVertexIndex: floor.setSelectedVertexIndex,
            onCurrentShapeUpdate: floor.handleCurrentShapeUpdate,
            onClickAnnotationId: (id) => {
              const floorData = loader.buildingFloors.find((f) => f.id === id);
              if (floorData) {
                if (floorData.id === floor.editingFloorId) {
                  return;
                }
                void (async () => {
                  const persisted =
                    await floor.persistCurrentPolygonBeforeFloorSwitch();
                  if (!persisted) return;
                  setPostSaveGuidance(null);
                  floor.setSelectedFloor(floorData.floor_number);
                  floor.requestStartEditingFloor(floorData.id);
                })();
              }
            },
            onHoverAnnotationId: (id) => {
              if (floor.isEditing) {
                clearHoveredFloor();
                return;
              }
              if (!id) {
                clearHoveredFloor();
                return;
              }
              setHoveredFloorId(id);
              setHoverPopupPos(lastMousePosRef.current);
            },
            mode: floor.isEditing ? "edit" : "view",
            drawingEnabled: floor.isPolygonCreationEnabled,
            getStyleById: floor.getStyleById,
          }}
          hoverPopup={
            !floor.isEditing && hoveredFloor && hoverPopupPos ? (
              <div
                className="pointer-events-none absolute z-20 w-[80px] overflow-hidden rounded-2xl border border-white/70 shadow-xl"
                style={{
                  left: hoverPopupPos.x + 12,
                  top: hoverPopupPos.y + 12,
                }}
              >
                <div className="bg-gradient-to-b from-[#4E8DFF] to-[#3B82F6] px-3 py-2 text-center text-4xl font-semibold leading-none text-white">
                  {hoveredFloor.floor_number}
                </div>
                <div className="bg-[#3A3A3D] px-3 py-2 text-center text-base font-medium leading-none text-white">
                  {loader.isObjectProject
                    ? loader.t("buildingImage.object.number")
                    : loader.t("buildingImage.floors.floor")}
                </div>
              </div>
            ) : null
          }
          guidedOverlay={
            guidedModeEnabled &&
            !hasCompletedAllFloors &&
            postSaveGuidance &&
            postSaveGuidance.nextFloor !== null ? (
              <div className="pointer-events-none absolute inset-0 z-30">
                <div className="pointer-events-auto absolute left-1/2 top-4 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-lg border border-primary/30 bg-background/95 p-3 shadow-lg">
                  <p className="text-sm font-medium">
                    {loader.isObjectProject
                      ? loader.t(
                          "buildingImage.object.guided.helper.savedAndNext",
                          {
                            floor: postSaveGuidance.savedFloor,
                            nextFloor: postSaveGuidance.nextFloor,
                          },
                        )
                      : loader.t("buildingImage.guided.helper.savedAndNext", {
                          floor: postSaveGuidance.savedFloor,
                          nextFloor: postSaveGuidance.nextFloor,
                        })}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        void selectFloorNumber(postSaveGuidance.nextFloor!);
                      }}
                    >
                      {loader.isObjectProject
                        ? loader.t("buildingImage.object.guided.helper.goNext")
                        : loader.t("buildingImage.guided.helper.goNext")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPostSaveGuidance(null)}
                    >
                      {loader.t("buildingImage.guided.helper.stayHere")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null
          }
        />
      )}

      <PolygonCustomizationSettings
        projectId={loader.project?.id || projectId}
        subProjectId={subProjectId}
        type="building"
        initialSettings={facadePolygonInitialSettings}
        onSettingsChange={(settings) => {
          loader.setFacadeDisplaySettings({
            colors: {
              building: settings.colors.building || "#3b82f6",
            },
            opacity: {
              normal: settings.opacity.normal,
              hover: settings.opacity.hover,
            },
            hoverEffects: {
              scale: settings.hoverEffects.scale,
              colorChange: settings.hoverEffects.colorChange,
              opacityChange: settings.hoverEffects.opacityChange,
              glow: settings.hoverEffects.glow,
            },
            display: {
              showNumbers: settings.display.showNumbers,
              showTooltip: settings.display.showTooltip,
            },
          });
        }}
      />
    </div>
  );
};

// ─── Main dispatcher ──────────────────────────────────────────────────────

const BuildingImageEditor = ({
  projectId,
  subProjectId,
  initialFloors,
  subProjectType,
  currentImageUrl,
  onImageUpdate,
  genplan,
}: BuildingImageEditorProps) => {
  if (subProjectType === "genplan") {
    if (!genplan) return null;
    return (
      <GenplanEditorPanel
        projectId={projectId}
        currentImageUrl={currentImageUrl}
        genplan={genplan}
      />
    );
  }
  return (
    <BuildingModePanel
      projectId={projectId}
      subProjectId={subProjectId}
      initialFloors={initialFloors}
      subProjectType={subProjectType as "building" | "object" | undefined}
      currentImageUrl={currentImageUrl}
      onImageUpdate={onImageUpdate}
    />
  );
};

export default BuildingImageEditor;
