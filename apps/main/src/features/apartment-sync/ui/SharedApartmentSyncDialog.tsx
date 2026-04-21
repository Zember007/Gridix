import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  OperationProgressCard,
} from "@gridix/ui";
import type { TFunction } from "i18next";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import ApartmentSyncTargetsList from "./ApartmentSyncTargetsList";
import { syncApartments } from "../model/syncApartments";
import {
  applyFloorDuplicationPreview,
  loadFloorDuplicationData,
  type FloorDuplicationApplyResult,
  type FloorDuplicationProgressPayload,
} from "../model/floorDuplication";
import {
  buildFloorDuplicationPreview,
  type FloorDuplicationCopyOption,
  type FloorDuplicationLoadedData,
  type FloorDuplicationMatchingRule,
  type FloorDuplicationPreview,
  type FloorDuplicationSourceApartment,
} from "../model/floorDuplicationPreview";

const resolveOperationDescription = (
  payload: FloorDuplicationProgressPayload,
  t: TFunction,
) => {
  if (payload.currentFloor == null) return undefined;
  if (payload.currentOperation === "floor_image") {
    return t("apartmentsManager.syncDialog.progressFloorImageOp", {
      floor: payload.currentFloor,
    });
  }
  if (payload.currentOperation === "apartment_polygon") {
    return t("apartmentsManager.syncDialog.progressPolygonOp", {
      floor: payload.currentFloor,
    });
  }
  return undefined;
};

type ApartmentMatchingAttribute = "area" | "rooms" | "type";

const DEFAULT_MATCHING_ATTRIBUTES: ApartmentMatchingAttribute[] = [
  "area",
  "rooms",
  "type",
];

function filterByAttributes(
  source: Apartment,
  all: Apartment[],
  attrs: ApartmentMatchingAttribute[],
): Apartment[] {
  return all.filter(
    (apt) =>
      apt.id !== source.id &&
      (!attrs.includes("area") || apt.area === source.area) &&
      (!attrs.includes("rooms") || apt.rooms === source.rooms) &&
      (!attrs.includes("type") || apt.type === source.type),
  );
}

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApartmentSyncModeProps extends BaseDialogProps {
  mode?: "apartment-sync";
  sourceApartment: Apartment | null;
  allApartments: Apartment[];
  onSyncComplete: (updatedApartments: Apartment[]) => void;
  getStatusColor?: (status: string) => string;
  getStatusLabel?: (status: string) => string;
  currencySymbol?: string;
}

interface PhotoDuplicateModeProps extends BaseDialogProps {
  mode: "photo-duplicate";
  sourceApartment: Apartment | null;
  allApartments: Apartment[];
  photoCountsByApartment: Record<string, number>;
  isSubmitting: boolean;
  onConfirm: (selectedIds: Set<string>) => Promise<void>;
}

interface FloorDuplicateModeProps extends BaseDialogProps {
  mode: "floor-duplicate";
  projectId: string;
  sourceFloorNumber: number;
  allFloorNumbers: number[];
  sourceImageUrl: string;
  sourceApartments: FloorDuplicationSourceApartment[];
  onComplete?: (result: FloorDuplicationApplyResult) => void;
}

export type ApartmentSyncDialogProps =
  | ApartmentSyncModeProps
  | FloorDuplicateModeProps
  | PhotoDuplicateModeProps;

const DEFAULT_MATCHING_RULES: FloorDuplicationMatchingRule[] = [
  "number_with_floor_prefix",
  "exact_number",
  "area_rooms_type",
];

const toggleValue = <T,>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

const defaultGetStatusColor = (status: string) => {
  switch (status) {
    case "sold":
      return "bg-red-100 text-red-800";
    case "reserved":
      return "bg-yellow-100 text-yellow-800";
    case "available":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const defaultGetStatusLabel = (status: string) => {
  switch (status) {
    case "sold":
      return "Продано";
    case "reserved":
      return "Забронировано";
    case "available":
      return "Доступно";
    default:
      return status;
  }
};

const ApartmentDataSyncDialog = ({
  open,
  onOpenChange,
  sourceApartment,
  allApartments,
  onSyncComplete,
  currencySymbol = "",
  getStatusColor = defaultGetStatusColor,
  getStatusLabel = defaultGetStatusLabel,
}: ApartmentSyncModeProps) => {
  const { t } = useLanguage();
  const [selectedAttributes, setSelectedAttributes] = useState<
    ApartmentMatchingAttribute[]
  >(() => [...DEFAULT_MATCHING_ATTRIBUTES]);

  const targetApartments = useMemo(() => {
    if (!sourceApartment) {
      return [];
    }
    return filterByAttributes(
      sourceApartment,
      allApartments,
      selectedAttributes,
    );
  }, [sourceApartment, allApartments, selectedAttributes]);

  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(
    new Set(),
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedAttributes([...DEFAULT_MATCHING_ATTRIBUTES]);
    }
  }, [open]);

  useEffect(() => {
    setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
  }, [targetApartments]);

  const toggleAttribute = (attr: ApartmentMatchingAttribute) => {
    setSelectedAttributes((previous) => toggleValue(previous, attr));
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) {
      return t("apartmentsManager.syncDialog.priceNotSpecified");
    }

    return `${price.toLocaleString()}${currencySymbol ? ` ${currencySymbol}` : ""}`;
  };

  const resetSelection = () => {
    setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
  };

  const handleOpenStateChange = (nextOpen: boolean) => {
    if (!nextOpen && isSyncing) {
      return;
    }

    if (!nextOpen) {
      resetSelection();
    }

    onOpenChange(nextOpen);
  };

  const handleApartmentToggle = (apartmentId: string) => {
    setSelectedApartments((previous) => {
      const nextSelected = new Set(previous);

      if (nextSelected.has(apartmentId)) {
        nextSelected.delete(apartmentId);
      } else {
        nextSelected.add(apartmentId);
      }

      return nextSelected;
    });
  };

  const handleSelectAll = () => {
    setSelectedApartments(
      selectedApartments.size === targetApartments.length
        ? new Set()
        : new Set(targetApartments.map((apt) => apt.id)),
    );
  };

  const handleConfirmSync = async () => {
    if (!sourceApartment || selectedApartments.size === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const updatedApartments = await syncApartments({
        sourceApartment,
        targetApartments,
        selectedApartmentIds: selectedApartments,
      });

      onSyncComplete(updatedApartments);
      onOpenChange(false);
      toast.success(
        t("apartmentsManager.syncDialog.success", {
          count: selectedApartments.size,
        }),
      );
    } catch (error) {
      console.error("Error syncing apartment data:", error);
      toast.error(t("apartmentsManager.syncDialog.error"));
    } finally {
      setIsSyncing(false);
    }
  };

  if (!sourceApartment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenStateChange}>
      <DialogContent className="flex max-h-[86vh] max-w-4xl flex-col overflow-hidden p-0">
        <div className="border-b px-5 py-4 sm:px-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl leading-tight">
              {t("apartmentsManager.syncDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("apartmentsManager.syncDialog.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.95fr)] lg:gap-3 lg:space-y-0">
            <div
              className="rounded-lg border p-3 lg:col-start-1 lg:row-start-1"
              style={{
                backgroundColor: ADMIN_THEME.backgroundSecondary,
                borderColor: ADMIN_THEME.info,
              }}
            >
              <h4
                className="mb-1.5 text-sm font-semibold"
                style={{ color: ADMIN_THEME.info }}
              >
                {t("apartmentsManager.syncDialog.sourceApartment")}
              </h4>
              <div className="grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
                <p>
                  <strong>
                    {t("apartmentsManager.syncDialog.apartmentNumber")}:
                  </strong>{" "}
                  {sourceApartment.apartment_number}
                </p>
                <p>
                  <strong>{t("apartmentsManager.syncDialog.floor")}:</strong>{" "}
                  {sourceApartment.floor_number}
                </p>
                <p>
                  <strong>{t("apartmentsManager.syncDialog.rooms")}:</strong>{" "}
                  {sourceApartment.rooms == 0
                    ? t("apartment.studio")
                    : sourceApartment.rooms}
                </p>
                <p>
                  <strong>{t("apartmentsManager.syncDialog.area")}:</strong>{" "}
                  {sourceApartment.area} м²
                </p>
                <p>
                  <strong>{t("apartmentsManager.price")}:</strong>{" "}
                  {formatPrice(sourceApartment.price)}
                </p>
                <p className="flex items-center gap-2">
                  <strong>{t("apartmentsManager.status")}:</strong>
                  <Badge className={getStatusColor(sourceApartment.status)}>
                    {getStatusLabel(sourceApartment.status)}
                  </Badge>
                </p>
              </div>
            </div>

            <div
              className="space-y-3 rounded-lg border p-3 lg:col-span-2 lg:row-start-2"
              style={{
                backgroundColor: ADMIN_THEME.backgroundSecondary,
                borderColor: ADMIN_THEME.border,
              }}
            >
              <h4
                className="text-sm font-semibold"
                style={{ color: ADMIN_THEME.textPrimary }}
              >
                {t("apartmentsManager.syncDialog.filterByAttributesTitle")}
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: ADMIN_THEME.textMuted }}
              >
                {t("apartmentsManager.syncDialog.filterByAttributesHint")}
              </p>
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("area")}
                    onCheckedChange={() => toggleAttribute("area")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeArea")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeAreaHint")}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("rooms")}
                    onCheckedChange={() => toggleAttribute("rooms")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeRooms")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeRoomsHint")}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("type")}
                    onCheckedChange={() => toggleAttribute("type")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeType")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeTypeHint")}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-2 lg:row-start-3">
              <div className="flex items-center justify-between gap-3">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: ADMIN_THEME.textPrimary }}
                >
                  {t("apartmentsManager.syncDialog.targetsTitle", {
                    selected: selectedApartments.size,
                    total: targetApartments.length,
                  })}
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={targetApartments.length === 0}
                >
                  {selectedApartments.size === targetApartments.length
                    ? t("apartmentsManager.syncDialog.deselectAll")
                    : t("apartmentsManager.syncDialog.selectAll")}
                </Button>
              </div>

              {targetApartments.length === 0 ? (
                <p className="text-sm" style={{ color: ADMIN_THEME.textMuted }}>
                  {t("apartmentsManager.syncDialog.noTargetsAfterFilter")}
                </p>
              ) : (
                <ApartmentSyncTargetsList
                  targetApartments={targetApartments}
                  sourceApartment={sourceApartment}
                  selectedApartments={selectedApartments}
                  onApartmentToggle={handleApartmentToggle}
                  formatPrice={formatPrice}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              )}
            </div>

            <div
              className="rounded-lg border p-3 lg:col-start-2 lg:row-start-1"
              style={{
                backgroundColor: ADMIN_THEME.backgroundSecondary,
                borderColor: ADMIN_THEME.warning,
              }}
            >
              <h4
                className="mb-1.5 text-sm font-semibold"
                style={{ color: ADMIN_THEME.warning }}
              >
                {t("apartmentsManager.syncDialog.syncedTitle")}
              </h4>
              <ul
                className="space-y-1 text-sm"
                style={{ color: ADMIN_THEME.textSecondary }}
              >
                <li>• {t("apartmentsManager.syncDialog.syncedPrice")}</li>
                <li>• {t("apartmentsManager.syncDialog.syncedStatus")}</li>
                <li>
                  • {t("apartmentsManager.syncDialog.syncedCustomFields")}
                </li>
              </ul>
              <p
                className="mt-2 text-xs"
                style={{ color: ADMIN_THEME.textMuted }}
              >
                {t("apartmentsManager.syncDialog.notChangedHint")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t bg-background px-5 py-3 sm:px-6">
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmSync}
              disabled={
                targetApartments.length === 0 ||
                selectedApartments.size === 0 ||
                isSyncing
              }
              style={{
                backgroundColor: ADMIN_THEME.primary,
                color: ADMIN_THEME.textOnPrimary,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor =
                  ADMIN_THEME.primaryHover;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
              }}
            >
              {isSyncing
                ? t("apartmentsManager.syncDialog.syncing")
                : t("apartmentsManager.syncDialog.syncButton", {
                    count: selectedApartments.size,
                  })}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenStateChange(false)}
              disabled={isSyncing}
            >
              {t("apartmentsManager.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PhotoDuplicateModeDialog = ({
  open,
  onOpenChange,
  sourceApartment,
  allApartments,
  photoCountsByApartment,
  isSubmitting,
  onConfirm,
}: PhotoDuplicateModeProps) => {
  const { t } = useLanguage();

  const [selectedAttributes, setSelectedAttributes] = useState<
    ApartmentMatchingAttribute[]
  >(() => [...DEFAULT_MATCHING_ATTRIBUTES]);

  const targetApartments = useMemo(() => {
    if (!sourceApartment) {
      return [];
    }
    return filterByAttributes(
      sourceApartment,
      allApartments,
      selectedAttributes,
    );
  }, [sourceApartment, allApartments, selectedAttributes]);

  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (open) {
      setSelectedAttributes([...DEFAULT_MATCHING_ATTRIBUTES]);
    }
  }, [open]);

  useEffect(() => {
    setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
  }, [targetApartments]);

  const toggleAttribute = (attr: ApartmentMatchingAttribute) => {
    setSelectedAttributes((previous) => toggleValue(previous, attr));
  };

  const handleOpenStateChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleApartmentToggle = (apartmentId: string) => {
    setSelectedApartments((previous) => {
      const next = new Set(previous);
      if (next.has(apartmentId)) {
        next.delete(apartmentId);
      } else {
        next.add(apartmentId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedApartments(
      selectedApartments.size === targetApartments.length
        ? new Set()
        : new Set(targetApartments.map((apt) => apt.id)),
    );
  };

  const handleConfirm = async () => {
    if (selectedApartments.size === 0) {
      return;
    }
    await onConfirm(selectedApartments);
  };

  if (!sourceApartment) {
    return null;
  }

  const sourcePhotoCount = photoCountsByApartment[sourceApartment.id] ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenStateChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden p-0">
        <div className="border-b px-5 py-4 sm:px-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg leading-tight">
              {t("photosManager.duplicateToSimilar")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-4">
            <div className="rounded-xl border p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("photosManager.selectApartment")}
                  </div>
                  <div className="text-base font-semibold leading-tight">
                    {t("photosManager.apartmentOption", {
                      number: sourceApartment.apartment_number,
                      floor: sourceApartment.floor_number,
                    })}
                  </div>
                </div>
                <Badge className="bg-sky-100 text-sky-800">
                  {sourcePhotoCount > 0
                    ? t("photosManager.photoCountShort", {
                        count: sourcePhotoCount,
                      })
                    : t("photosManager.noIndividualPhotosShort")}
                </Badge>
              </div>
            </div>

            <div
              className="space-y-3 rounded-lg border p-3"
              style={{
                backgroundColor: ADMIN_THEME.backgroundSecondary,
                borderColor: ADMIN_THEME.border,
              }}
            >
              <h4
                className="text-sm font-semibold"
                style={{ color: ADMIN_THEME.textPrimary }}
              >
                {t("apartmentsManager.syncDialog.filterByAttributesTitle")}
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: ADMIN_THEME.textMuted }}
              >
                {t("apartmentsManager.syncDialog.filterByAttributesHint")}
              </p>
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("area")}
                    onCheckedChange={() => toggleAttribute("area")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeArea")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeAreaHint")}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("rooms")}
                    onCheckedChange={() => toggleAttribute("rooms")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeRooms")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeRoomsHint")}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAttributes.includes("type")}
                    onCheckedChange={() => toggleAttribute("type")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-tight">
                      {t("apartmentsManager.syncDialog.attributeType")}
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      {t("apartmentsManager.syncDialog.attributeTypeHint")}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                {t("apartmentsManager.syncDialog.targetsTitle", {
                  selected: selectedApartments.size,
                  total: targetApartments.length,
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={targetApartments.length === 0}
              >
                {selectedApartments.size === targetApartments.length
                  ? t("apartmentsManager.syncDialog.deselectAll")
                  : t("apartmentsManager.syncDialog.selectAll")}
              </Button>
            </div>

            {targetApartments.length === 0 ? (
              <p className="text-sm" style={{ color: ADMIN_THEME.textMuted }}>
                {t("apartmentsManager.syncDialog.noTargetsAfterFilter")}
              </p>
            ) : (
              <div className="space-y-2 rounded-xl border p-3">
                {targetApartments.map((apartment) => {
                  const apartmentPhotoCount =
                    photoCountsByApartment[apartment.id] ?? 0;

                  return (
                    <label
                      key={apartment.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedApartments.has(apartment.id)}
                        onCheckedChange={() =>
                          handleApartmentToggle(apartment.id)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium leading-tight">
                          {t("photosManager.apartmentOption", {
                            number: apartment.apartment_number,
                            floor: apartment.floor_number,
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>
                            {apartmentPhotoCount > 0
                              ? t("photosManager.photoCountShort", {
                                  count: apartmentPhotoCount,
                                })
                              : t("photosManager.noIndividualPhotosShort")}
                          </span>
                          <span>
                            {t("apartmentsManager.areaValue", {
                              area: apartment.area,
                            })}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-background px-5 py-4 sm:px-6">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                void handleConfirm();
              }}
              disabled={
                targetApartments.length === 0 ||
                selectedApartments.size === 0 ||
                isSubmitting
              }
            >
              {t("photosManager.duplicateToSimilar")}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenStateChange(false)}
              disabled={isSubmitting}
            >
              {t("apartmentsManager.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FloorDuplicationModeDialog = ({
  open,
  onOpenChange,
  projectId,
  sourceFloorNumber,
  allFloorNumbers,
  sourceImageUrl,
  sourceApartments,
  onComplete,
}: FloorDuplicateModeProps) => {
  const { t } = useLanguage();
  const targetFloorNumbers = useMemo(
    () =>
      [...new Set(allFloorNumbers)]
        .filter((floorNumber) => floorNumber !== sourceFloorNumber)
        .sort((a, b) => a - b),
    [allFloorNumbers, sourceFloorNumber],
  );
  const availablePolygonCount = useMemo(
    () =>
      sourceApartments.filter((apartment) => apartment.polygon.length >= 3)
        .length,
    [sourceApartments],
  );
  const defaultCopyOptions = useMemo(() => {
    const nextOptions: FloorDuplicationCopyOption[] = [];

    if (sourceImageUrl) {
      nextOptions.push("floor_image");
    }
    if (availablePolygonCount > 0) {
      nextOptions.push("apartment_polygons");
    }

    return nextOptions;
  }, [availablePolygonCount, sourceImageUrl]);
  const [selectedMatchingRules, setSelectedMatchingRules] = useState<
    FloorDuplicationMatchingRule[]
  >(DEFAULT_MATCHING_RULES);
  const [selectedCopyOptions, setSelectedCopyOptions] =
    useState<FloorDuplicationCopyOption[]>(defaultCopyOptions);
  const [loadedData, setLoadedData] =
    useState<FloorDuplicationLoadedData | null>(null);
  const [previewLoadError, setPreviewLoadError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] =
    useState<FloorDuplicationProgressPayload | null>(null);
  const [applyResult, setApplyResult] =
    useState<FloorDuplicationApplyResult | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedMatchingRules(DEFAULT_MATCHING_RULES);
    setSelectedCopyOptions(defaultCopyOptions);
    setLoadedData(null);
    setPreviewLoadError(null);
    setApplyProgress(null);
    setApplyResult(null);
    setIsLoadingPreview(true);

    void loadFloorDuplicationData({
      projectId,
      targetFloorNumbers,
    })
      .then((data) => {
        setLoadedData(data);
      })
      .catch((error) => {
        console.error("Error loading floor duplication preview:", error);
        setPreviewLoadError(t("apartmentsManager.syncDialog.previewError"));
      })
      .finally(() => {
        setIsLoadingPreview(false);
      });
  }, [defaultCopyOptions, open, projectId, t, targetFloorNumbers]);

  const preview: FloorDuplicationPreview | null = useMemo(() => {
    if (!loadedData) {
      return null;
    }

    return buildFloorDuplicationPreview({
      sourceFloorNumber,
      targetFloorNumbers,
      sourceImageUrl,
      sourceApartments,
      loadedData,
      selectedMatchingRules,
      selectedCopyOptions,
    });
  }, [
    loadedData,
    selectedCopyOptions,
    selectedMatchingRules,
    sourceApartments,
    sourceFloorNumber,
    sourceImageUrl,
    targetFloorNumbers,
  ]);

  const handleOpenStateChange = (nextOpen: boolean) => {
    if (!nextOpen && isApplying) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const getMatchingRuleLabel = (rule: FloorDuplicationMatchingRule) => {
    switch (rule) {
      case "number_with_floor_prefix":
        return t("apartmentsManager.syncDialog.ruleNumberWithFloorPrefix");
      case "exact_number":
        return t("apartmentsManager.syncDialog.ruleExactNumber");
      case "area_rooms_type":
        return t("apartmentsManager.syncDialog.ruleAreaRoomsType");
      default:
        return rule;
    }
  };

  const getMatchingRuleHint = (rule: FloorDuplicationMatchingRule) => {
    switch (rule) {
      case "number_with_floor_prefix":
        return t("apartmentsManager.syncDialog.ruleNumberWithFloorPrefixHint");
      case "exact_number":
        return t("apartmentsManager.syncDialog.ruleExactNumberHint");
      case "area_rooms_type":
        return t("apartmentsManager.syncDialog.ruleAreaRoomsTypeHint");
      default:
        return "";
    }
  };

  const getMatchingRuleFields = (rule: FloorDuplicationMatchingRule) => {
    switch (rule) {
      case "number_with_floor_prefix":
        return t(
          "apartmentsManager.syncDialog.ruleNumberWithFloorPrefixFields",
        );
      case "exact_number":
        return t("apartmentsManager.syncDialog.ruleExactNumberFields");
      case "area_rooms_type":
        return t("apartmentsManager.syncDialog.ruleAreaRoomsTypeFields");
      default:
        return "";
    }
  };

  const getFloorPlanActionLabel = (
    action: FloorDuplicationPreview["floors"][number]["floorPlanAction"],
  ) => {
    switch (action) {
      case "create":
        return t("apartmentsManager.syncDialog.previewFloorImageCreate");
      case "update":
        return t("apartmentsManager.syncDialog.previewFloorImageUpdate");
      case "skip":
        return t("apartmentsManager.syncDialog.previewFloorImageSkip");
      default:
        return t("apartmentsManager.syncDialog.previewFloorImageNone");
    }
  };

  const getSkippedReasonLabel = (reason: "no_match" | "ambiguous") => {
    switch (reason) {
      case "ambiguous":
        return t("apartmentsManager.syncDialog.skippedAmbiguous");
      default:
        return t("apartmentsManager.syncDialog.skippedNoMatch");
    }
  };

  const canApply =
    !!preview &&
    preview.summary.totalOperations > 0 &&
    selectedCopyOptions.length > 0 &&
    (!selectedCopyOptions.includes("apartment_polygons") ||
      selectedMatchingRules.length > 0) &&
    !isApplying &&
    !isLoadingPreview;

  const handleApply = async () => {
    if (!preview) {
      return;
    }

    setIsApplying(true);
    setApplyResult(null);
    setApplyProgress({
      completed: 0,
      total: preview.summary.totalOperations,
      currentFloor: null,
      currentOperation: null,
    });

    try {
      const result = await applyFloorDuplicationPreview({
        projectId,
        preview,
        sourceImageUrl,
        sourceApartments,
        selectedCopyOptions,
        onProgress: setApplyProgress,
      });

      onComplete?.(result);

      if (result.errors.length > 0) {
        setApplyResult(result);
        toast.warning(t("apartmentsManager.syncDialog.partialSuccess"));
        return;
      }

      toast.success(
        t("apartmentsManager.syncDialog.floorDuplicateSuccess", {
          floorPlans: result.updatedFloorPlans,
          polygons: result.updatedPolygons,
          skipped: result.skippedMatches,
        }),
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error duplicating floor data:", error);
      toast.error(t("floorPlan.duplicate.error"));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenStateChange}>
      <DialogContent className="flex max-h-[min(90dvh,85vh)] min-h-0 max-w-5xl flex-col overflow-hidden p-0 sm:max-h-[85vh]">
        <div className="shrink-0 border-b px-5 py-2.5 sm:px-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold leading-tight">
              {t("apartmentsManager.syncDialog.floorDuplicateTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("apartmentsManager.syncDialog.floorDuplicateDescription")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <div className="space-y-3 border-b px-5 py-3 sm:px-6">
            <div className="grid gap-3 lg:grid-cols-3">
              <div
                className="rounded-xl border p-2"
                style={{
                  backgroundColor: ADMIN_THEME.backgroundSecondary,
                  borderColor: ADMIN_THEME.info,
                }}
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {t("apartmentsManager.syncDialog.sourceFloor")}
                </div>
                <div className="text-sm font-bold leading-none">
                  {sourceFloorNumber}
                </div>
              </div>
              <div
                className="rounded-xl border p-2"
                style={{
                  backgroundColor: ADMIN_THEME.backgroundSecondary,
                  borderColor: ADMIN_THEME.info,
                }}
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {t("apartmentsManager.syncDialog.sourceFloorPlan")}
                </div>
                <div className="text-sm font-bold leading-none">
                  {sourceImageUrl ? t("common.yes") : t("common.no")}
                </div>
              </div>
              <div
                className="rounded-xl border p-2"
                style={{
                  backgroundColor: ADMIN_THEME.backgroundSecondary,
                  borderColor: ADMIN_THEME.info,
                }}
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {t("apartmentsManager.syncDialog.sourcePolygons")}
                </div>
                <div className="text-sm font-bold leading-none">
                  {availablePolygonCount}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border p-2.5">
                <h4 className="mb-2 text-sm font-semibold">
                  {t("apartmentsManager.syncDialog.copyOptionsTitle")}
                </h4>
                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedCopyOptions.includes("floor_image")}
                      onCheckedChange={() =>
                        setSelectedCopyOptions((previous) =>
                          toggleValue(previous, "floor_image"),
                        )
                      }
                      disabled={!sourceImageUrl}
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-medium leading-tight">
                        {t("apartmentsManager.syncDialog.copyFloorImage")}
                      </div>
                      <div className="text-xs leading-relaxed text-muted-foreground">
                        {t("apartmentsManager.syncDialog.copyFloorImageHint")}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedCopyOptions.includes(
                        "apartment_polygons",
                      )}
                      onCheckedChange={() =>
                        setSelectedCopyOptions((previous) =>
                          toggleValue(previous, "apartment_polygons"),
                        )
                      }
                      disabled={availablePolygonCount === 0}
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-medium leading-tight">
                        {t(
                          "apartmentsManager.syncDialog.copyApartmentPolygons",
                        )}
                      </div>
                      <div className="text-xs leading-relaxed text-muted-foreground">
                        {t(
                          "apartmentsManager.syncDialog.copyApartmentPolygonsHint",
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border p-2.5">
                <h4 className="mb-2 text-sm font-semibold">
                  {t("apartmentsManager.syncDialog.matchingByAttributesTitle")}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t("apartmentsManager.syncDialog.matchingCriteriaOrderHint")}
                </p>
                <div className="mt-3 space-y-3">
                  {DEFAULT_MATCHING_RULES.map((rule, ruleIndex) => (
                    <label key={rule} className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedMatchingRules.includes(rule)}
                        onCheckedChange={() =>
                          setSelectedMatchingRules((previous) =>
                            toggleValue(previous, rule),
                          )
                        }
                        disabled={
                          !selectedCopyOptions.includes("apartment_polygons")
                        }
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                            {ruleIndex + 1}.
                          </span>
                          <span className="text-sm font-medium leading-tight">
                            {getMatchingRuleLabel(rule)}
                          </span>
                        </div>
                        <div className="text-xs font-medium leading-snug text-foreground/90">
                          {getMatchingRuleFields(rule)}
                        </div>
                        <div className="text-xs leading-relaxed text-muted-foreground">
                          {getMatchingRuleHint(rule)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4 sm:px-6">
            {isLoadingPreview ? (
              <div className="rounded-xl border p-8">
                <LoadingProgress />
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {t("apartmentsManager.syncDialog.previewLoading")}
                </p>
              </div>
            ) : previewLoadError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {previewLoadError}
              </div>
            ) : !preview ? null : (
              <div className="space-y-4">
                <div className="rounded-xl border p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-sky-100 text-sky-800">
                      {t("apartmentsManager.syncDialog.summaryFloorPlans", {
                        count: preview.summary.floorPlanOperations,
                      })}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {t("apartmentsManager.syncDialog.summaryPolygons", {
                        count: preview.summary.polygonOperations,
                      })}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-900">
                      {t("apartmentsManager.syncDialog.summarySkipped", {
                        count: preview.summary.skippedMatches,
                      })}
                    </Badge>
                    <Badge className="bg-rose-100 text-rose-800">
                      {t("apartmentsManager.syncDialog.summaryAmbiguous", {
                        count: preview.summary.ambiguousMatches,
                      })}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-800">
                      {t("apartmentsManager.syncDialog.readyOperations", {
                        count: preview.summary.totalOperations,
                      })}
                    </Badge>
                  </div>

                  {selectedCopyOptions.length === 0 ? (
                    <p className="mt-3 text-sm text-amber-700">
                      {t("apartmentsManager.syncDialog.noCopyOptions")}
                    </p>
                  ) : null}
                  {selectedCopyOptions.includes("apartment_polygons") &&
                  selectedMatchingRules.length === 0 ? (
                    <p className="mt-3 text-sm text-amber-700">
                      {t("apartmentsManager.syncDialog.noMatchingRules")}
                    </p>
                  ) : null}
                  {targetFloorNumbers.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("apartmentsManager.syncDialog.noTargetFloors")}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {preview.floors.map((floor) => (
                    <div
                      key={floor.floorNumber}
                      className="rounded-xl border p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold leading-tight">
                            {t("apartmentsManager.floor", {
                              floor: floor.floorNumber,
                            })}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {getFloorPlanActionLabel(floor.floorPlanAction)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-emerald-100 text-emerald-800">
                            {t("apartmentsManager.syncDialog.summaryPolygons", {
                              count: floor.polygonMatches.length,
                            })}
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-900">
                            {t("apartmentsManager.syncDialog.summarySkipped", {
                              count: floor.skippedApartments.length,
                            })}
                          </Badge>
                        </div>
                      </div>

                      {floor.polygonMatches.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {floor.polygonMatches.slice(0, 4).map((match) => (
                            <div
                              key={`${floor.floorNumber}-${match.targetApartmentId}`}
                              className="rounded-lg border border-border/70 bg-background p-3 text-sm"
                            >
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("apartmentsManager.syncDialog.matchMethod")}
                              </div>
                              <div className="mt-1 text-sm font-semibold leading-snug text-foreground">
                                {getMatchingRuleLabel(match.strategy)}
                              </div>
                              <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                {getMatchingRuleFields(match.strategy)}
                              </div>
                              <div className="mt-2 border-t border-border/60 pt-2 font-medium tabular-nums">
                                {match.sourceApartmentNumber} →{" "}
                                {match.targetApartmentNumber}
                              </div>
                            </div>
                          ))}
                          {floor.polygonMatches.length > 4 ? (
                            <div className="text-xs text-muted-foreground">
                              {t("apartmentsManager.syncDialog.moreMatches", {
                                count: floor.polygonMatches.length - 4,
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {floor.skippedApartments.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {floor.skippedApartments
                            .slice(0, 4)
                            .map((apartment) => (
                              <div
                                key={`${floor.floorNumber}-${apartment.sourceApartmentId}`}
                                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                              >
                                <div className="font-medium">
                                  {apartment.sourceApartmentNumber}
                                </div>
                                <div className="text-xs text-amber-800">
                                  {getSkippedReasonLabel(apartment.reason)}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {applyResult?.errors.length ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                {t("apartmentsManager.syncDialog.errorsCount", {
                  count: applyResult.errors.length,
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t bg-background px-5 py-4 sm:px-6">
          {isApplying && applyProgress && applyProgress.total > 0 ? (
            <OperationProgressCard
              className="gap-3 p-3 [&_.shrink-0_svg]:h-5 [&_.shrink-0_svg]:w-5"
              title={t("apartmentsManager.syncDialog.progressTitle")}
              description={resolveOperationDescription(applyProgress, t)}
              current={applyProgress.completed}
              total={applyProgress.total}
              status={
                applyProgress.completed >= applyProgress.total
                  ? "complete"
                  : "running"
              }
              icon={<Copy className="h-5 w-5" />}
            />
          ) : null}
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={!canApply}
              style={{
                backgroundColor: ADMIN_THEME.primary,
                color: ADMIN_THEME.textOnPrimary,
              }}
            >
              {isApplying
                ? t("apartmentsManager.syncDialog.floorDuplicating")
                : t("apartmentsManager.syncDialog.applyButton", {
                    count: preview?.summary.totalOperations ?? 0,
                  })}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenStateChange(false)}
              disabled={isApplying}
            >
              {t("apartmentsManager.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SharedApartmentSyncDialog = (props: ApartmentSyncDialogProps) => {
  if (props.mode === "floor-duplicate") {
    return <FloorDuplicationModeDialog {...props} />;
  }

  if (props.mode === "photo-duplicate") {
    return <PhotoDuplicateModeDialog {...props} />;
  }

  return <ApartmentDataSyncDialog {...props} />;
};

export default SharedApartmentSyncDialog;
