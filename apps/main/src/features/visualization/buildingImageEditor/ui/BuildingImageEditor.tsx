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
import { Switch } from "@gridix/ui";
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
} from "lucide-react";
import PolygonAnnotator from "@/components/visualization/polygon-editor/PolygonAnnotator";
import PolygonCustomizationSettings, {
  type PolygonSettings,
} from "@/components/visualization/PolygonCustomizationSettings";
import type { BuildingImageEditorProps } from "../model/types";
import { useBuildingEditorData } from "../hooks/useBuildingEditorData";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";

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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {loader.isObjectProject
                ? loader.t("buildingImage.object.polygonsTitle")
                : loader.t("buildingImage.floors.title")}
            </CardTitle>
            <CardDescription>
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
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`flex flex-wrap items-center gap-4 ${floorInputInvalid ? "pb-5" : ""}`}
            >
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
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="text-sm text-muted-foreground">
                  {loader.t("buildingImage.guided.progress.floorRange")}{" "}
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
                    {loader.t("buildingImage.guided.toggle")}
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
                  {loader.t("buildingImage.guided.progress.allConfigured")}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0">
                      {loader.t("buildingImage.guided.progress.missingFloors")}
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

            {/* Canvas with all polygons */}
            <div
              ref={viewerWrapRef}
              className="relative rounded-lg border bg-muted/30 p-4"
              onMouseMove={updateMousePos}
              onMouseLeave={clearHoveredFloor}
            >
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
                )}
              </div>

              <PolygonAnnotator
                ref={floor.polygonAnnotatorRef}
                engine="controlled"
                imageUrl={loader.buildingImage}
                shapes={loader.shapes}
                currentShape={floor.currentShape}
                selectedVertexIndex={floor.selectedVertexIndex}
                onSelectVertexIndex={floor.setSelectedVertexIndex}
                onCurrentShapeUpdate={floor.handleCurrentShapeUpdate}
                onClickAnnotationId={(id) => {
                  const floorData = loader.buildingFloors.find(
                    (f) => f.id === id,
                  );
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
                }}
                onHoverAnnotationId={(id) => {
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
                }}
                mode={floor.isEditing ? "edit" : "view"}
                drawingEnabled={floor.isPolygonCreationEnabled}
                getStyleById={floor.getStyleById}
              />
              {!floor.isEditing && hoveredFloor && hoverPopupPos && (
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
              )}
              {guidedModeEnabled &&
                !hasCompletedAllFloors &&
                postSaveGuidance &&
                postSaveGuidance.nextFloor !== null && (
                  <div className="pointer-events-none absolute inset-0 z-30">
                    <div className="pointer-events-auto absolute left-1/2 top-4 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-lg border border-primary/30 bg-background/95 p-3 shadow-lg">
                      <p className="text-sm font-medium">
                        {loader.t("buildingImage.guided.helper.savedAndNext", {
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
                          {loader.t("buildingImage.guided.helper.goNext")}
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
                )}
            </div>
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
