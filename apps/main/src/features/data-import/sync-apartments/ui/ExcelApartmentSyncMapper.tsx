import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@gridix/ui";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Check, ArrowRight, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";
import { adminThemeClasses as admin } from "@gridix/utils/lib";
import type { Language } from "@gridix/utils/lib";
import {
  syncApartmentsFromExcel,
  type ApartmentSyncUpdate,
} from "@/features/projectSelector/api/projectSelectorApi";

import { ActionsBar } from "./parts/ActionsBar";
import { ColumnsMappingSection } from "./parts/ColumnsMappingSection";
import { PreviewTable } from "./parts/PreviewTable";
import { ValidationSection } from "./parts/ValidationSection";

interface ImportedRowData {
  [key: string]: string | number | null | undefined;
}

interface ExcelApartmentSyncMapperProps {
  projectId: string;
  projectType: "building" | "object" | null;
  excelColumns: string[];
  importedData: ImportedRowData[];
  onComplete: () => void;
  onSyncDone: () => void;
}

interface ColumnMapping {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
  [key: string]: string;
}

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<Language, string>>;
  field_type: "text" | "number" | "select" | "boolean";
  is_required: boolean;
  field_options?: string[];
}

interface StatusMapping {
  [key: string]: "available" | "sold" | "reserved" | "invalid";
}

interface StatusValidationResult {
  validCount: number;
  invalidCount: number;
  invalidStatuses: string[];
  statusDistribution: Record<string, number>;
}

interface RoomsMapping {
  [key: string]: number | "invalid";
}

interface RoomsValidationResult {
  validCount: number;
  invalidCount: number;
  invalidRooms: string[];
  roomsDistribution: Record<string, number>;
}

const ExcelApartmentSyncMapper = ({
  projectId,
  projectType,
  excelColumns,
  importedData,
  onComplete,
  onSyncDone,
}: ExcelApartmentSyncMapperProps) => {
  const { t, language } = useLanguage();

  const getFieldLabel = useCallback(
    (field: {
      field_label: string;
      field_label_translations?: Partial<Record<Language, string>>;
    }) => {
      if (
        field.field_label_translations &&
        field.field_label_translations[language]
      ) {
        return field.field_label_translations[language];
      }
      return field.field_label;
    },
    [language],
  );

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    apartmentNumber: "",
    floor: "",
    rooms: "",
    area: "",
    price: "",
    status: "",
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [statusMapping, setStatusMapping] = useState<StatusMapping>({
    available: "available",
    свободна: "available",
    свободно: "available",
    да: "available",
    yes: "available",
    "1": "available",
    sold: "sold",
    продана: "sold",
    продано: "sold",
    нет: "sold",
    no: "sold",
    "0": "sold",
    reserved: "reserved",
    забронирована: "reserved",
    забронировано: "reserved",
    hold: "reserved",
    резерв: "reserved",
  });

  const [statusValidation, setStatusValidation] =
    useState<StatusValidationResult | null>(null);

  const [roomsMapping, setRoomsMapping] = useState<RoomsMapping>({
    студия: 0,
    studio: 0,
    st: 0,
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    однокомнатная: 1,
    двухкомнатная: 2,
    трехкомнатная: 3,
    четырехкомнатная: 4,
    пятикомнатная: 5,
    "1к": 1,
    "2к": 2,
    "3к": 3,
    "4к": 4,
    "5к": 5,
    "1-к": 1,
    "2-к": 2,
    "3-к": 3,
    "4-к": 4,
    "5-к": 5,
    "1-комн": 1,
    "2-комн": 2,
    "3-комн": 3,
    "4-комн": 4,
    "5-комн": 5,
  });

  const [roomsValidation, setRoomsValidation] =
    useState<RoomsValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    const loadCustomFields = async () => {
      const { data } = await supabase
        .from("project_custom_fields")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (data) {
        setCustomFields(data as unknown as CustomField[]);
        setColumnMapping((prev) => {
          const newMapping = { ...prev };
          data.forEach((field: Record<string, unknown>) => {
            const name = field.field_name as string;
            if (!newMapping[name]) {
              newMapping[name] = "";
            }
          });
          return newMapping;
        });
      }
    };
    loadCustomFields();
  }, [projectId]);

  const effectiveType = projectType ?? "building";

  const fieldLabels = useMemo(() => {
    const baseLabels: Record<string, string> = {
      apartmentNumber:
        effectiveType === "object"
          ? t("project.objectNumber") || "Object number"
          : t("project.apartmentNumber"),
      floor: t("project.floor"),
      rooms: t("project.rooms"),
      area: t("project.area"),
      price: t("project.price"),
      status: t("project.status"),
    };

    if (effectiveType === "object") {
      delete baseLabels.floor;
    }

    return baseLabels;
  }, [t, effectiveType]);

  const allFields = useMemo(() => {
    const fields: Record<string, string> = { ...fieldLabels };
    customFields.forEach((field) => {
      fields[field.field_name] = getFieldLabel(field);
    });
    return fields;
  }, [customFields, fieldLabels, getFieldLabel]);

  const validateStatuses = useCallback(() => {
    if (!columnMapping.status || columnMapping.status === "__none__") {
      setStatusValidation(null);
      return;
    }

    const statusDistribution: Record<string, number> = {};
    const invalidStatuses: string[] = [];
    let validCount = 0;
    let invalidCount = 0;

    importedData.forEach((row) => {
      const statusValue = String(row[columnMapping.status] || "")
        .toLowerCase()
        .trim();
      if (!statusValue) return;

      statusDistribution[statusValue] =
        (statusDistribution[statusValue] || 0) + 1;

      if (
        statusMapping[statusValue] &&
        statusMapping[statusValue] !== "invalid"
      ) {
        validCount++;
      } else {
        invalidCount++;
        if (!invalidStatuses.includes(statusValue)) {
          invalidStatuses.push(statusValue);
        }
      }
    });

    setStatusValidation({
      validCount,
      invalidCount,
      invalidStatuses,
      statusDistribution,
    });
  }, [columnMapping.status, statusMapping, importedData]);

  const updateStatusMapping = useCallback(
    (
      originalValue: string,
      mappedValue: "available" | "sold" | "reserved" | "invalid",
    ) => {
      setStatusMapping((prev) => ({
        ...prev,
        [originalValue.toLowerCase()]: mappedValue,
      }));
    },
    [],
  );

  const addCustomStatusMapping = useCallback(
    (originalValue: string) => {
      if (!originalValue.trim()) return;
      const key = originalValue.toLowerCase().trim();
      if (!statusMapping[key]) {
        setStatusMapping((prev) => ({ ...prev, [key]: "available" }));
      }
    },
    [statusMapping],
  );

  const validateRooms = useCallback(() => {
    if (!columnMapping.rooms || columnMapping.rooms === "__none__") {
      setRoomsValidation(null);
      return;
    }

    const roomsDistribution: Record<string, number> = {};
    const invalidRooms: string[] = [];
    let validCount = 0;
    let invalidCount = 0;

    importedData.forEach((row) => {
      const roomsValue = String(row[columnMapping.rooms] || "")
        .toLowerCase()
        .trim();
      if (!roomsValue) return;

      roomsDistribution[roomsValue] = (roomsDistribution[roomsValue] || 0) + 1;

      if (
        roomsMapping[roomsValue] !== undefined &&
        roomsMapping[roomsValue] !== "invalid"
      ) {
        validCount++;
      } else {
        invalidCount++;
        if (!invalidRooms.includes(roomsValue)) {
          invalidRooms.push(roomsValue);
        }
      }
    });

    setRoomsValidation({
      validCount,
      invalidCount,
      invalidRooms,
      roomsDistribution,
    });
  }, [columnMapping.rooms, roomsMapping, importedData]);

  const updateRoomsMapping = useCallback(
    (originalValue: string, mappedValue: number | "invalid") => {
      setRoomsMapping((prev) => ({
        ...prev,
        [originalValue.toLowerCase()]: mappedValue,
      }));
    },
    [],
  );

  const addCustomRoomsMapping = useCallback(
    (originalValue: string) => {
      if (!originalValue.trim()) return;
      const key = originalValue.toLowerCase().trim();
      if (roomsMapping[key] === undefined) {
        setRoomsMapping((prev) => ({ ...prev, [key]: 1 }));
      }
    },
    [roomsMapping],
  );

  useEffect(() => {
    const id = setTimeout(() => validateStatuses(), 100);
    return () => clearTimeout(id);
  }, [validateStatuses]);

  useEffect(() => {
    const id = setTimeout(() => validateRooms(), 100);
    return () => clearTimeout(id);
  }, [validateRooms]);

  const handleMappingChange = useCallback(
    (field: keyof ColumnMapping, value: string) => {
      setColumnMapping((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const getPreviewValue = useCallback(
    (field: keyof ColumnMapping) => {
      const columnName = columnMapping[field];
      if (!columnName || columnName === "__none__" || !importedData.length)
        return t("excel.mapper.noData") || "---";
      const value = importedData[0]?.[columnName];
      return value !== null && value !== undefined && value !== ""
        ? value
        : t("excel.mapper.noData") || "---";
    },
    [columnMapping, importedData, t],
  );

  const hasAtLeastOneUpdateField = useMemo(() => {
    const updateFields = ["floor", "rooms", "area", "price", "status"];
    const hasBase = updateFields.some(
      (f) =>
        columnMapping[f as keyof ColumnMapping] &&
        columnMapping[f as keyof ColumnMapping] !== "__none__",
    );
    const hasCustom = customFields.some(
      (cf) =>
        columnMapping[cf.field_name] &&
        columnMapping[cf.field_name] !== "__none__",
    );
    return hasBase || hasCustom;
  }, [columnMapping, customFields]);

  const isValid = useMemo(() => {
    const aptNumberFilled =
      !!columnMapping.apartmentNumber &&
      columnMapping.apartmentNumber !== "__none__";

    const statusValid =
      !statusValidation || statusValidation.invalidCount === 0;
    const roomsValid =
      effectiveType === "building"
        ? !roomsValidation || roomsValidation.invalidCount === 0
        : true;

    return (
      aptNumberFilled && hasAtLeastOneUpdateField && statusValid && roomsValid
    );
  }, [
    columnMapping.apartmentNumber,
    hasAtLeastOneUpdateField,
    statusValidation,
    roomsValidation,
    effectiveType,
  ]);

  const handleSync = useCallback(async () => {
    if (!isValid) {
      toast.error(t("excel.sync.errors.fillRequired"));
      return;
    }

    setIsSyncing(true);
    try {
      const updates: ApartmentSyncUpdate[] = importedData.map((row) => {
        const aptNumber = String(
          row[columnMapping.apartmentNumber] || "",
        ).trim();

        const update: ApartmentSyncUpdate = { apartment_number: aptNumber };

        if (
          effectiveType === "building" &&
          columnMapping.floor &&
          columnMapping.floor !== "__none__"
        ) {
          const val = parseInt(String(row[columnMapping.floor]));
          if (!isNaN(val)) update.floor_number = val;
        }

        if (columnMapping.rooms && columnMapping.rooms !== "__none__") {
          const roomsValue = String(row[columnMapping.rooms] || "")
            .toLowerCase()
            .trim();
          const mappedRooms = roomsMapping[roomsValue];
          if (typeof mappedRooms === "number") {
            update.rooms = mappedRooms;
          }
        }

        if (columnMapping.area && columnMapping.area !== "__none__") {
          const val = parseFloat(String(row[columnMapping.area]));
          if (!isNaN(val)) update.area = val;
        }

        if (columnMapping.price && columnMapping.price !== "__none__") {
          const raw = row[columnMapping.price];
          if (raw === null || raw === undefined || raw === "") {
            update.price = null;
          } else {
            const val = parseInt(String(raw));
            update.price = isNaN(val) ? null : val;
          }
        }

        if (columnMapping.status && columnMapping.status !== "__none__") {
          const statusValue = String(row[columnMapping.status] || "")
            .toLowerCase()
            .trim();
          const mappedStatus = statusMapping[statusValue];
          if (mappedStatus && mappedStatus !== "invalid") {
            update.status = mappedStatus;
          }
        }

        const customFieldsData: Record<string, string | number | boolean> = {};
        let hasCustom = false;

        customFields.forEach((field) => {
          const mappedColumn = columnMapping[field.field_name];
          if (mappedColumn && mappedColumn !== "__none__") {
            let value: string | number | boolean = "";
            const raw = row[mappedColumn];

            switch (field.field_type) {
              case "number":
                value = parseFloat(String(raw)) || 0;
                break;
              case "boolean":
                value =
                  String(raw).toLowerCase() === "true" ||
                  String(raw) === "1" ||
                  String(raw).toLowerCase() === "да";
                break;
              default:
                value = String(raw || "");
            }

            customFieldsData[field.field_name] = value;
            hasCustom = true;
          }
        });

        if (hasCustom) {
          update.custom_fields = customFieldsData;
        }

        return update;
      });

      const validUpdates = updates.filter((u) => u.apartment_number.length > 0);
      const result = await syncApartmentsFromExcel(projectId, validUpdates);

      if (result.notFound.length > 0) {
        toast.warning(
          t("excel.sync.result.withNotFound")
            .replace("{{updated}}", String(result.updatedCount))
            .replace("{{total}}", String(result.total))
            .replace(
              "{{notFound}}",
              result.notFound.slice(0, 10).join(", ") +
                (result.notFound.length > 10 ? "..." : ""),
            ),
        );
      } else {
        toast.success(
          t("excel.sync.result.success").replace(
            "{{updated}}",
            String(result.updatedCount),
          ),
        );
      }

      onSyncDone();
      onComplete();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(t("excel.sync.errors.syncFailed"));
    } finally {
      setIsSyncing(false);
    }
  }, [
    isValid,
    importedData,
    columnMapping,
    effectiveType,
    roomsMapping,
    statusMapping,
    customFields,
    projectId,
    onSyncDone,
    onComplete,
    t,
  ]);

  // Legacy markup оставляем как страховку (по умолчанию не рендерим).
  // Флаг должен зависеть от runtime, чтобы ESLint не считал условие константным.
  const renderLegacyValidation =
    typeof globalThis !== "undefined" &&
    (globalThis as any).__GRIDIX_RENDER_LEGACY_VALIDATION__ === true;

  return (
    <div className="space-y-6">
      <ColumnsMappingSection
        t={t}
        excelColumns={excelColumns}
        allFields={allFields}
        columnMapping={columnMapping}
        handleMappingChange={handleMappingChange}
        getPreviewValue={getPreviewValue}
      />

      <ValidationSection
        t={t}
        columnMapping={columnMapping}
        effectiveType={effectiveType}
        statusValidation={statusValidation}
        roomsValidation={roomsValidation}
        statusMapping={statusMapping}
        roomsMapping={roomsMapping}
        showValidation={showValidation}
        setShowValidation={(v) => setShowValidation(v)}
        updateStatusMapping={updateStatusMapping}
        updateRoomsMapping={updateRoomsMapping}
        addCustomStatusMapping={addCustomStatusMapping}
        addCustomRoomsMapping={addCustomRoomsMapping}
      />

      {renderLegacyValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("excel.mapper.validation.title") || "Валидация данных"}
              {((statusValidation?.invalidCount ?? 0) > 0 ||
                (effectiveType === "building" &&
                  (roomsValidation?.invalidCount ?? 0) > 0)) && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {(statusValidation?.invalidCount || 0) +
                    (effectiveType === "building"
                      ? roomsValidation?.invalidCount || 0
                      : 0)}{" "}
                  {t("excel.mapper.validation.unknown") || "неизвестных"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t("excel.mapper.validation.description") ||
                "Настройте соответствие значений из Excel к стандартным форматам"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(statusValidation?.validCount || 0) +
                    (effectiveType === "building"
                      ? roomsValidation?.validCount || 0
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.validValues") ||
                    "Валидных значений"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(statusValidation?.invalidCount || 0) +
                    (effectiveType === "building"
                      ? roomsValidation?.invalidCount || 0
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.invalidValues") ||
                    "Неизвестных значений"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(statusValidation?.statusDistribution || {})
                    .length +
                    (effectiveType === "building"
                      ? Object.keys(roomsValidation?.roomsDistribution || {})
                          .length
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.uniqueValues") ||
                    "Уникальных значений"}
                </div>
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                >
                  {showValidation
                    ? t("excel.mapper.validation.hideDetails") ||
                      "Скрыть детали"
                    : t("excel.mapper.validation.showDetails") ||
                      "Показать детали"}
                </Button>
              </div>
            </div>

            {showValidation && (
              <div className="space-y-6 rounded-lg border p-4">
                {/* Валидация статусов */}
                {columnMapping.status &&
                  columnMapping.status !== "__none__" &&
                  statusValidation && (
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">
                        {t("excel.mapper.validation.status.title") ||
                          "Настройка статусов квартир"}
                      </Label>
                      <div className="space-y-3">
                        {Object.entries(
                          statusValidation?.statusDistribution || {},
                        ).map(([value, count]) => {
                          const currentMapping =
                            statusMapping[value.toLowerCase()];
                          const isInvalid =
                            !currentMapping || currentMapping === "invalid";

                          return (
                            <div
                              key={value}
                              className="flex items-center gap-4 rounded-lg border bg-white p-3"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">"{value}"</span>
                                  <Badge variant="outline" className="text-xs">
                                    {count}
                                    {t("excel.mapper.validation.count") ||
                                      " шт."}
                                  </Badge>
                                  {isInvalid && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {t(
                                        "excel.mapper.validation.unknownValue",
                                      ) || "Неизвестный"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <Select
                                  value={currentMapping || "invalid"}
                                  onValueChange={(
                                    mappedValue:
                                      | "available"
                                      | "sold"
                                      | "reserved"
                                      | "invalid",
                                  ) => updateStatusMapping(value, mappedValue)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-green-500" />
                                        {t("project.available") || "Свободна"}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="reserved">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-yellow-500" />
                                        {t("project.reserved") ||
                                          "Забронирована"}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="sold">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-red-500" />
                                        {t("project.sold") || "Продана"}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="invalid">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-gray-500" />
                                        {t("excel.mapper.validation.ignore") ||
                                          "Игнорировать"}
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}

                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">
                            {t("excel.mapper.validation.status.addMapping") ||
                              "Добавить новый маппинг статуса:"}
                          </Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder={
                                t("excel.mapper.validation.valueFromExcel") ||
                                "Значение из Excel"
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addCustomStatusMapping(e.currentTarget.value);
                                  e.currentTarget.value = "";
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                addCustomStatusMapping(input.value);
                                input.value = "";
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Валидация комнат */}
                {effectiveType === "building" &&
                  columnMapping.rooms &&
                  columnMapping.rooms !== "__none__" &&
                  roomsValidation && (
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">
                        {t("excel.mapper.validation.rooms.title") ||
                          "Настройка количества комнат"}
                      </Label>
                      <div className="space-y-3">
                        {Object.entries(
                          roomsValidation?.roomsDistribution || {},
                        ).map(([value, count]) => {
                          const currentMapping =
                            roomsMapping[value.toLowerCase()];
                          const isInvalid =
                            currentMapping === undefined ||
                            currentMapping === "invalid";

                          return (
                            <div
                              key={value}
                              className="flex items-center gap-4 rounded-lg border bg-white p-3"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">"{value}"</span>
                                  <Badge variant="outline" className="text-xs">
                                    {count}
                                    {t("excel.mapper.validation.count") ||
                                      " шт."}
                                  </Badge>
                                  {isInvalid && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {t(
                                        "excel.mapper.validation.rooms.unknown",
                                      ) || "Неизвестное"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <Select
                                  value={
                                    currentMapping === undefined
                                      ? "invalid"
                                      : String(currentMapping)
                                  }
                                  onValueChange={(mappedValue) => {
                                    if (mappedValue === "invalid") {
                                      updateRoomsMapping(value, "invalid");
                                    } else {
                                      updateRoomsMapping(
                                        value,
                                        parseInt(mappedValue),
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-purple-500" />
                                        {t("rooms.studio") || "Студия (0)"}
                                      </div>
                                    </SelectItem>
                                    {(
                                      [
                                        [1, "rooms.one"],
                                        [2, "rooms.two"],
                                        [3, "rooms.three"],
                                        [4, "rooms.four"],
                                        [5, "rooms.fivePlus"],
                                      ] as const
                                    ).map(([n, roomsKey]) => (
                                      <SelectItem key={n} value={String(n)}>
                                        {t(roomsKey)}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="invalid">
                                      {t("excel.mapper.validation.ignore") ||
                                        "Игнорировать"}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}

                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">
                            {t("excel.mapper.validation.rooms.addMapping") ||
                              "Добавить новый маппинг комнат:"}
                          </Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder={
                                t("excel.mapper.validation.valueFromExcel") ||
                                "Значение из Excel"
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addCustomRoomsMapping(e.currentTarget.value);
                                  e.currentTarget.value = "";
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                addCustomRoomsMapping(input.value);
                                input.value = "";
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Предупреждения */}
                {(statusValidation?.invalidCount ?? 0) > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {t("excel.mapper.validation.status.warning") ||
                          "Внимание по статусам!"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-yellow-700">
                      {t("excel.mapper.validation.status.warningMessage", {
                        statuses: (
                          statusValidation?.invalidStatuses || []
                        ).join(", "),
                      }) ||
                        `Неизвестные статусы: ${(statusValidation?.invalidStatuses || []).join(", ")}. Строки с ними будут пропущены для поля статуса.`}
                    </p>
                  </div>
                )}

                {effectiveType === "building" &&
                  (roomsValidation?.invalidCount ?? 0) > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">
                          {t("excel.mapper.validation.rooms.warning") ||
                            "Внимание по комнатам!"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-yellow-700">
                        {t("excel.mapper.validation.rooms.warningMessage", {
                          rooms: (roomsValidation?.invalidRooms || []).join(
                            ", ",
                          ),
                        }) ||
                          `Неизвестные значения комнат: ${(roomsValidation?.invalidRooms || []).join(", ")}. Строки с ними будут пропущены для поля комнат.`}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PreviewTable
        t={t}
        importedData={importedData}
        allFields={allFields}
        columnMapping={columnMapping}
      />

      <ActionsBar
        t={t}
        onComplete={onComplete}
        handleSync={handleSync}
        isValid={isValid}
        isSyncing={isSyncing}
        admin={admin}
      />
    </div>
  );
};

export default ExcelApartmentSyncMapper;
