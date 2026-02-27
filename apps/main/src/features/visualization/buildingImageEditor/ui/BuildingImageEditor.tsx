import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Upload,
  Save,
  Trash2,
  Image as ImageIcon,
  Edit3,
  X,
  Plus,
  Check,
  Undo2,
  Redo2,
} from "lucide-react";
import PolygonAnnotator from "@/components/visualization/polygon-editor/PolygonAnnotator";
import PolygonCustomizationSettings, {
  type PolygonSettings,
} from "@/components/visualization/PolygonCustomizationSettings";
import type { BuildingImageEditorProps } from "../model/types";
import { useBuildingEditorData } from "../hooks/useBuildingEditorData";

const BuildingImageEditor = ({
  projectId,
  currentImageUrl,
  onImageUpdate,
}: BuildingImageEditorProps) => {
  const { loader, facade, floor, selectFacade } = useBuildingEditorData({
    projectId,
    currentImageUrl,
    onImageUpdate,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardDescription>
            {loader.t("buildingImage.description")}
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
                    onClick={() => selectFacade(f.id, f.image_url ?? null)}
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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {loader.isObjectProject
                ? loader.t("buildingImage.object.polygonsTitle")
                : loader.t("buildingImage.floors.title")}
            </CardTitle>
            <CardDescription>
              {loader.isObjectProject
                ? loader.t("buildingImage.object.polygonsDescription")
                : loader.t("buildingImage.floors.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="floor-select" className="text-sm font-medium">
                  {loader.isObjectProject
                    ? loader.t("buildingImage.object.number")
                    : loader.t("buildingImage.floors.floor")}
                </Label>
                <select
                  id="floor-select"
                  value={floor.selectedFloor}
                  onChange={(e) =>
                    floor.setSelectedFloor(Number(e.target.value))
                  }
                  className="min-w-[80px] rounded border px-2 py-1 text-sm"
                  disabled={floor.isEditing}
                >
                  {loader.isObjectProject
                    ? loader.apartmentNumbers.length > 0
                      ? loader.apartmentNumbers.map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))
                      : Array.from({ length: 20 }, (_, i) => i + 1).map(
                          (num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ),
                        )
                    : Array.from(
                        {
                          length:
                            Math.max(
                              loader.floors,
                              loader.buildingFloors.length > 0
                                ? Math.max(
                                    ...loader.buildingFloors.map(
                                      (f) => f.floor_number,
                                    ),
                                  )
                                : 0,
                            ) + 3,
                        },
                        (_, i) => i,
                      ).map((floorNum) => (
                        <option key={floorNum} value={floorNum}>
                          {floorNum}
                        </option>
                      ))}
                </select>
              </div>

              {!floor.isEditing && (
                <Button
                  onClick={floor.startCreatingNewFloor}
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
            </div>

            {/* Canvas with all polygons */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {floor.isCreatingNewFloor
                    ? loader.isObjectProject
                      ? loader.t("buildingImage.object.creating", {
                          number: floor.selectedFloor,
                        })
                      : loader.t("buildingImage.floors.creatingNew", {
                          floor: floor.selectedFloor,
                        })
                    : loader.isObjectProject
                      ? loader.t("buildingImage.object.plan")
                      : loader.t("buildingImage.floors.canvas")}
                </h4>
                {(floor.isEditing || floor.currentShape) && (
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
                      onClick={floor.handlePolygonSave}
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
                )}
              </div>

              <PolygonAnnotator
                ref={floor.polygonAnnotatorRef}
                imageUrl={loader.buildingImage}
                shapes={loader.shapes}
                currentShape={floor.currentShape}
                onCurrentShapeUpdate={floor.handleCurrentShapeUpdate}
                mode={floor.isEditing ? "edit" : "view"}
                drawingEnabled={floor.isEditing}
                getStyleById={floor.getStyleById}
                onSelectAnnotationId={(id) => {
                  if (!floor.isEditing && id) {
                    const floorData = loader.buildingFloors.find(
                      (f) => f.id === id,
                    );
                    if (floorData) {
                      floor.startEditingFloor(floorData.id);
                    }
                  }
                }}
              />
            </div>

            {loader.buildingFloors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {loader.isObjectProject
                    ? loader.t("buildingImage.object.configured")
                    : loader.t("buildingImage.floors.configured")}
                </h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {loader.buildingFloors.map((floorItem) => (
                    <div
                      key={floorItem.id}
                      className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm"
                    >
                      <span>
                        {loader.isObjectProject
                          ? loader.t("buildingImage.object.objectNumber", {
                              number: floorItem.floor_number,
                            })
                          : loader.t("buildingImage.floors.floorNumber", {
                              floor: floorItem.floor_number,
                            })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => floor.startEditingFloor(floorItem.id)}
                          className="h-6 w-6 p-0"
                          disabled={floor.isEditing}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            floor.handleDeleteFloorPolygon(floorItem.id)
                          }
                          className="h-6 w-6 p-0"
                          disabled={floor.isEditing}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PolygonCustomizationSettings
        projectId={loader.project?.id || projectId}
        type="building"
        initialSettings={
          {
            colors: {
              available: "#3b82f6",
              sold: "#ef4444",
              reserved: "#f59e0b",
              building: loader.facadeDisplaySettings.colors.building,
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
              normal: loader.facadeDisplaySettings.opacity.normal,
              hover: loader.facadeDisplaySettings.opacity.hover,
            },
          } satisfies PolygonSettings
        }
        onSettingsChange={(settings) => {
          loader.setFacadeDisplaySettings({
            colors: {
              building: settings.colors.building || "#3b82f6",
            },
            opacity: {
              normal: settings.opacity.normal,
              hover: settings.opacity.hover,
            },
          });
        }}
      />
    </div>
  );
};

export default BuildingImageEditor;
