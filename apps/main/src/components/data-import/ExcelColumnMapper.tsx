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
import { trackOnboardingMilestone } from "@gridix/utils/integrations";
import CustomFieldsManager from "@/components/fields/CustomFieldsManager";
import { useLanguageNavigation } from "@gridix/utils/react";
import { useProjectCRUD } from "@/entities/project/queries/useProjects";
import { useLanguage } from "@gridix/utils/react";
import { adminThemeClasses as admin } from "@gridix/utils/lib";
import { Language } from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";

interface ImportedRowData {
  [key: string]: string | number | null | undefined;
}

interface ExcelColumnMapperProps {
  excelColumns: string[];
  importedData: ImportedRowData[];
  onComplete: () => void;
}

interface ColumnMapping {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
  [key: string]: string; // для кастомных полей
}

interface ProjectData {
  name: string;
  description: string;
  floors: number;
  type: "building" | "object";
}

interface CustomField {
  id?: string;
  field_name: string;
  field_label: string;
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
  statusDistribution: { [key: string]: number };
}

interface RoomsMapping {
  [key: string]: number | "invalid";
}

interface RoomsValidationResult {
  validCount: number;
  invalidCount: number;
  invalidRooms: string[];
  roomsDistribution: { [key: string]: number };
}

const ExcelColumnMapper = ({
  excelColumns,
  importedData,
  onComplete,
}: ExcelColumnMapperProps) => {
  const { createProject } = useProjectCRUD();
  const { t, language } = useLanguage();
  const { userProfile } = useAuth();

  // Функция для получения локализованного названия поля
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

  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    description: "",
    floors: 1,
    type: "building",
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { navigate } = useLanguageNavigation();

  // Status validation states
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

  // Rooms validation states
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

  const fieldLabels = useMemo(() => {
    const baseLabels: Record<string, string> = {
      apartmentNumber:
        projectData.type === "object"
          ? t("project.objectNumber")
          : t("project.apartmentNumber"),
      floor: t("project.floor"),
      rooms: t("project.rooms"),
      area: t("project.area"),
      price: t("project.price"),
      status: t("project.status"),
    };

    // Для типа object убираем поле floor
    if (projectData.type === "object") {
      delete baseLabels.floor;
    }

    return baseLabels;
  }, [t, projectData.type]);

  const toColumnClass = useCallback((columnName: string) => {
    const safe = String(columnName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return `excelcol_${safe}_usertour`;
  }, []);

  const requiredFields = useMemo(() => {
    const baseFields = ["apartmentNumber", "area"];

    // Для типа building добавляем floor и rooms
    if (projectData.type === "building") {
      baseFields.push("floor", "rooms");
    }
    // Для типа object rooms не обязательное
    else if (projectData.type === "object") {
      // rooms не добавляем в обязательные для object
    }

    return baseFields;
  }, [projectData.type]);

  // Создаем временный проект для настройки кастомных полей

  // Status validation functions
  const validateStatuses = useCallback(() => {
    if (!columnMapping.status || columnMapping.status === "__none__") {
      setStatusValidation(null);
      return;
    }

    const statusDistribution: { [key: string]: number } = {};
    const invalidStatuses: string[] = [];
    let validCount = 0;
    let invalidCount = 0;

    importedData.forEach((row) => {
      const statusValue = String(row[columnMapping.status] || "")
        .toLowerCase()
        .trim();

      if (!statusValue) return;

      // Подсчитываем распределение статусов
      statusDistribution[statusValue] =
        (statusDistribution[statusValue] || 0) + 1;

      // Проверяем валидность статуса
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
        setStatusMapping((prev) => ({
          ...prev,
          [key]: "available", // по умолчанию
        }));
      }
    },
    [statusMapping],
  );

  // Rooms validation functions
  const validateRooms = useCallback(() => {
    if (!columnMapping.rooms || columnMapping.rooms === "__none__") {
      setRoomsValidation(null);
      return;
    }

    const roomsDistribution: { [key: string]: number } = {};
    const invalidRooms: string[] = [];
    let validCount = 0;
    let invalidCount = 0;

    importedData.forEach((row) => {
      const roomsValue = String(row[columnMapping.rooms] || "")
        .toLowerCase()
        .trim();

      if (!roomsValue) return;

      // Подсчитываем распределение комнат
      roomsDistribution[roomsValue] = (roomsDistribution[roomsValue] || 0) + 1;

      // Проверяем валидность количества комнат
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
        setRoomsMapping((prev) => ({
          ...prev,
          [key]: 1, // по умолчанию 1 комната
        }));
      }
    },
    [roomsMapping],
  );

  // Валидируем статусы при изменении маппинга колонки статуса
  useEffect(() => {
    // Добавляем debounce для предотвращения множественных вызовов
    const timeoutId = setTimeout(() => {
      validateStatuses();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [validateStatuses]);

  // Валидируем комнаты при изменении маппинга колонки комнат
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateRooms();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [validateRooms]);

  const handleCustomFieldsChange = useCallback((fields: CustomField[]) => {
    setCustomFields(fields);

    // Добавляем кастомные поля в маппинг
    setColumnMapping((prev) => {
      const newMapping = { ...prev };
      fields.forEach((field) => {
        if (!newMapping[field.field_name]) {
          newMapping[field.field_name] = "";
        }
      });
      return newMapping;
    });
  }, []);

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
        return t("excel.mapper.noData");
      const value = importedData[0]?.[columnName];
      return value !== null && value !== undefined && value !== ""
        ? value
        : t("excel.mapper.noData");
    },
    [columnMapping, importedData, t],
  );

  const allRequiredFields = useMemo(() => {
    return [
      ...requiredFields,
      ...customFields.filter((f) => f.is_required).map((f) => f.field_name),
    ];
  }, [customFields, requiredFields]);

  const isValidWithCustom = useMemo(() => {
    const basicFieldsValid = allRequiredFields.every(
      (field) =>
        columnMapping[field as keyof ColumnMapping] &&
        columnMapping[field as keyof ColumnMapping] !== "__none__",
    );

    // Проверяем, что нет неопознанных значений в статусах и комнатах
    const statusValid =
      !statusValidation || statusValidation.invalidCount === 0;
    const roomsValid =
      projectData.type === "building"
        ? !roomsValidation || roomsValidation.invalidCount === 0
        : true;

    return basicFieldsValid && statusValid && roomsValid;
  }, [
    allRequiredFields,
    columnMapping,
    statusValidation,
    roomsValidation,
    projectData.type,
  ]);

  const createProjectWithData = useCallback(async () => {
    if (!isValidWithCustom || !projectData.name.trim()) {
      let errorMessage = t("excel.mapper.errors.fillRequiredFields");

      if (statusValidation && statusValidation.invalidCount > 0) {
        errorMessage += t("excel.mapper.errors.configureUnknownStatuses");
      }

      if (
        projectData.type === "building" &&
        roomsValidation &&
        roomsValidation.invalidCount > 0
      ) {
        errorMessage += t("excel.mapper.errors.configureUnknownRooms");
      }

      toast.error(errorMessage);
      return;
    }

    setIsCreating(true);
    try {
      // Вычисляем максимальный этаж из данных (только для типа building)
      let maxFloor = 1;
      if (
        projectData.type === "building" &&
        columnMapping.floor &&
        columnMapping.floor !== "__none__"
      ) {
        maxFloor = Math.max(
          ...importedData.map((row) => {
            const floorValue = row[columnMapping.floor];
            const parsedFloor = parseInt(String(floorValue)) || 1;
            return parsedFloor;
          }),
        );
      }

      // Создаем реальный проект
      const projectDataForCreation = {
        name: projectData.name.trim(),
        description: projectData.description.trim() || null,
        floors: Math.max(maxFloor, projectData.floors),
        has_parking: false,
        has_commercial: false,
        address: null,
        building_image_url: null,
        latitude: null,
        longitude: null,
        slug: null,
        currency: "USD" as const,
        available_languages: ["ru", "en"],
        is_public: true,
        is_featured: false,
        installment_enabled: false,
        min_down_payment_percent: null,
        max_installment_months: null,
        pdf_presentation_url: null,
        theme_color: null,
        is_public_visible: true,
        project_type: projectData.type,
        subscription_expires_at: null,
        subscription_status: "active",
        view_count: 0,
        facade_open: true,
        polygon_settings_facade: {},
        polygon_settings_floor: {},
      };

      const project = await createProject(projectDataForCreation);

      if (!project) throw new Error("Failed to create project");

      // Driver.js tour uses local once-storage; we don't persist onboarding state in Supabase here.
      void trackOnboardingMilestone({
        eventName: "gridix_project_created",
        properties: { project_id: project.id, source: "excel_import" },
        onceKey: "gridix_project_created",
      });

      // Сохраняем кастомные поля в реальный проект
      if (customFields.length > 0) {
        const customFieldsData = customFields.map((field) => ({
          project_id: project.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          field_options: field.field_options || null,
        }));

        const { error: fieldsError } = await supabase
          .from("project_custom_fields")
          .insert(customFieldsData);

        if (fieldsError) {
          console.error("Ошибка при копировании кастомных полей:", fieldsError);
        }
      }

      // Создаем этажи здания для визуализации (только для типа building)
      if (projectData.type === "building") {
        const floorData = [];
        for (let i = 1; i <= Math.max(maxFloor, projectData.floors); i++) {
          floorData.push({
            project_id: project.id,
            floor_number: i,
            polygon: [],
            color: "#3b82f6",
          });
        }

        const { error: floorError } = await supabase
          .from("building_floors")
          .insert(floorData);

        if (floorError) {
          console.error("Ошибка при создании этажей:", floorError);
        }
      }

      // Обрабатываем и вставляем данные квартир
      const usedApartmentNumbers = new Set<string>();
      const apartmentData = importedData.map((row, index) => {
        const floorNumber =
          projectData.type === "building"
            ? parseInt(String(row[columnMapping.floor])) || 1
            : 1; // Для типа object всегда этаж 1

        // Обеспечиваем уникальность номеров квартир
        let baseApartmentNumber = String(
          row[columnMapping.apartmentNumber] || "",
        ).trim();
        if (!baseApartmentNumber) {
          baseApartmentNumber = `${index + 1}`;
        }

        let apartmentNumber = baseApartmentNumber;
        let counter = 1;
        while (usedApartmentNumbers.has(apartmentNumber)) {
          apartmentNumber = `${baseApartmentNumber}-${counter}`;
          counter++;
        }
        usedApartmentNumbers.add(apartmentNumber);

        // Используем валидацию комнат (только для типа building)
        let rooms = 1;
        if (
          projectData.type === "building" &&
          columnMapping.rooms &&
          columnMapping.rooms !== "__none__"
        ) {
          const roomsValue = String(row[columnMapping.rooms] || "")
            .toLowerCase()
            .trim();
          const mappedRooms = roomsMapping[roomsValue];
          if (typeof mappedRooms === "number") {
            rooms = mappedRooms;
          } else if (roomsValue) {
            console.warn(
              `Неизвестное количество комнат "${roomsValue}" для квартиры ${apartmentNumber}, используется 1`,
            );
          }
        }
        // Для типа object rooms всегда 1 (не используется)

        const area = parseFloat(String(row[columnMapping.area])) || 0;
        const price =
          columnMapping.price && columnMapping.price !== "__none__"
            ? parseInt(String(row[columnMapping.price])) || 0
            : 0;

        // Используем валидацию статусов
        let status: "available" | "sold" | "reserved" = "available";
        if (columnMapping.status && columnMapping.status !== "__none__") {
          const statusValue = String(row[columnMapping.status] || "")
            .toLowerCase()
            .trim();
          const mappedStatus = statusMapping[statusValue];
          if (mappedStatus && mappedStatus !== "invalid") {
            status = mappedStatus;
          } else if (statusValue) {
            console.warn(
              `Неизвестный статус "${statusValue}" для квартиры ${apartmentNumber}, используется "available"`,
            );
          }
        }

        // Собираем кастомные поля
        const customFieldsData: Record<string, string | number | boolean> = {};
        customFields.forEach((field) => {
          const mappedColumn = columnMapping[field.field_name];
          if (mappedColumn && mappedColumn !== "__none__") {
            let value = row[mappedColumn];

            // Преобразуем значение в зависимости от типа поля
            switch (field.field_type) {
              case "number":
                value = parseFloat(String(value)) || 0;
                break;
              case "boolean":
                value =
                  String(value).toLowerCase() === "true" ||
                  String(value) === "1" ||
                  String(value).toLowerCase() === "да"
                    ? 1
                    : 0;
                break;
              default:
                value = String(value || "");
            }

            customFieldsData[field.field_name] = value;
          }
        });

        return {
          project_id: project.id,
          apartment_number: apartmentNumber,
          floor_number: floorNumber,
          rooms: String(rooms),
          area: area,
          price: price || null,
          status: status,
          polygon: [],
          custom_fields: customFieldsData,
        };
      });

      const { error: apartmentError } = await supabase
        .from("apartments")
        .insert(apartmentData);

      if (apartmentError) {
        console.error("Ошибка при создании квартир:", apartmentError);
        if (
          apartmentError.code === "23505" &&
          apartmentError.message.includes(
            "apartments_project_id_apartment_number_key",
          )
        ) {
          throw new Error(t("excel.mapper.errors.duplicateApartmentNumbers"));
        }
        throw apartmentError;
      }

      // Временный проект больше не используется

      // Группируем квартиры по этажам для отчета
      const apartmentsByFloor = apartmentData.reduce(
        (acc, apt) => {
          acc[apt.floor_number] = (acc[apt.floor_number] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      const successMessage =
        projectData.type === "building"
          ? t("excel.url.toast.projectCreated", {
              name: projectData.name,
              count: apartmentData.length,
              floors: Math.max(maxFloor, projectData.floors),
            })
          : t("excel.url.toast.projectCreatedObjects", {
              name: projectData.name,
              count: apartmentData.length,
            });

      toast.success(successMessage);

      // Перенаправляем на созданный проект
      setTimeout(() => {
        navigate(`/admin/project/${project.id}`);
      }, 1000);
    } catch (error) {
      console.error("Ошибка создания проекта:", error);
      toast.error(t("excel.url.toast.projectCreationError"));
    } finally {
      setIsCreating(false);
    }
  }, [
    projectData.name,
    projectData.description,
    projectData.floors,
    projectData.type,
    columnMapping,
    importedData,
    customFields,
    roomsMapping,
    roomsValidation,
    statusMapping,
    statusValidation,
    isValidWithCustom,
    createProject,
    navigate,
    t,
  ]);

  // Объединяем стандартные поля и кастомные поля для маппинга
  const allFields = useMemo(() => {
    const fields: Record<string, string> = { ...fieldLabels };
    customFields.forEach((field) => {
      fields[field.field_name] = getFieldLabel(field);
    });
    return fields;
  }, [customFields, fieldLabels, getFieldLabel]);

  // Режим без временного проекта: сразу показываем интерфейс

  return (
    <div className="space-y-6">
      {/* Информация о проекте */}
      <Card>
        <CardHeader>
          <CardTitle>{t("excel.mapper.projectInfo.title")}</CardTitle>
          <CardDescription>
            {t("excel.mapper.projectInfo.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectName">
              {t("excel.mapper.project.name")}
            </Label>
            <Input
              id="projectName"
              value={projectData.name}
              onChange={(e) =>
                setProjectData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="excel_project_name_usertour mt-1"
            />
          </div>
          <div>
            <Label htmlFor="projectType">
              {t("excel.mapper.project.type")}
            </Label>
            <Select
              value={projectData.type}
              onValueChange={(value: "building" | "object") =>
                setProjectData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="excel_project_type_usertour mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="building"
                  className="excel_project_type_building_usertour"
                >
                  {t("excel.mapper.project.types.building")}
                </SelectItem>
                <SelectItem value="object">
                  {t("excel.mapper.project.types.object")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="projectDescription">
              {t("excel.mapper.project.description")}
            </Label>
            <Input
              id="projectDescription"
              value={projectData.description}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="excel_project_description_usertour mt-1"
            />
          </div>
          {projectData.type === "building" && (
            <div>
              <Label htmlFor="floors">{t("projectEditor.floors")}</Label>
              <Input
                id="floors"
                type="number"
                value={projectData.floors}
                onChange={(e) =>
                  setProjectData((prev) => ({
                    ...prev,
                    floors: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                max="50"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("excel.mapper.project.floors.hint")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Настройка кастомных полей */}
      <CustomFieldsManager
        projectId={null}
        onFieldsChange={handleCustomFieldsChange}
      />

      {/* Соотнести столбцы */}
      <Card className="excel_mapping_required_usertour">
        <CardHeader>
          <CardTitle>{t("excel.mapper.columns.title")}</CardTitle>
          <CardDescription>
            {t("excel.mapper.columns.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Object.entries(allFields).map(([field, label]) => {
              const isRequired = allRequiredFields.includes(field);
              const currentValue = columnMapping[field as keyof ColumnMapping];

              return (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {label}
                    {isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        {t("excel.mapper.required")}
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={currentValue || ""}
                    onValueChange={(value) =>
                      handleMappingChange(field as keyof ColumnMapping, value)
                    }
                  >
                    <SelectTrigger
                      className={[
                        (!currentValue || currentValue === "__none__") &&
                        isRequired
                          ? "border-red-300"
                          : "",
                        `excel_mapping_${field}_usertour`,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <SelectValue
                        placeholder={t("excel.mapper.columns.selectColumn")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t("excel.mapper.columns.selectColumnPlaceholder")}
                      </SelectItem>
                      {excelColumns.map((column) => (
                        <SelectItem
                          key={column}
                          value={column}
                          className={toColumnClass(column)}
                        >
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentValue && currentValue !== "__none__" && (
                    <div className="flex items-center gap-2 rounded bg-real-estate-50 p-2 text-sm text-real-estate-600">
                      <span>{t("common.example")}:</span>
                      <ArrowRight className="h-3 w-3" />
                      <strong>
                        {getPreviewValue(field as keyof ColumnMapping)}
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Валидация статусов и комнат */}
      {((columnMapping.status && columnMapping.status !== "__none__") ||
        (projectData.type === "building" &&
          columnMapping.rooms &&
          columnMapping.rooms !== "__none__")) && (
        <Card className="excel_validation_usertour">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("excel.mapper.validation.title")}
              {((statusValidation && statusValidation.invalidCount > 0) ||
                (projectData.type === "building" &&
                  roomsValidation &&
                  roomsValidation.invalidCount > 0)) && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {(statusValidation?.invalidCount || 0) +
                    (projectData.type === "building"
                      ? roomsValidation?.invalidCount || 0
                      : 0)}{" "}
                  {t("excel.mapper.validation.unknown")}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t("excel.mapper.validation.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(statusValidation?.validCount || 0) +
                    (projectData.type === "building"
                      ? roomsValidation?.validCount || 0
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.validValues")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(statusValidation?.invalidCount || 0) +
                    (projectData.type === "building"
                      ? roomsValidation?.invalidCount || 0
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.invalidValues")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(statusValidation
                    ? Object.keys(statusValidation.statusDistribution).length
                    : 0) +
                    (projectData.type === "building" && roomsValidation
                      ? Object.keys(roomsValidation.roomsDistribution).length
                      : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("excel.mapper.validation.uniqueValues")}
                </div>
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                >
                  {showValidation
                    ? t("excel.mapper.validation.hideDetails")
                    : t("excel.mapper.validation.showDetails")}
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
                        {t("excel.mapper.validation.status.title")}
                      </Label>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          {t("excel.mapper.validation.status.distribution")}
                        </Label>
                        {Object.entries(
                          statusValidation.statusDistribution,
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
                                    {t("excel.mapper.validation.count")}
                                  </Badge>
                                  {isInvalid && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      {t(
                                        "excel.mapper.validation.unknownValue",
                                      )}
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
                                        <div className="h-3 w-3 rounded bg-green-500"></div>
                                        {t("project.available")}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="reserved">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-yellow-500"></div>
                                        {t("project.reserved")}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="sold">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-red-500"></div>
                                        {t("project.sold")}
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="invalid">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-gray-500"></div>
                                        {t("excel.mapper.validation.ignore")}
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
                            {t("excel.mapper.validation.status.addMapping")}
                          </Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder={t(
                                "excel.mapper.validation.valueFromExcel",
                              )}
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
                {projectData.type === "building" &&
                  columnMapping.rooms &&
                  columnMapping.rooms !== "__none__" &&
                  roomsValidation && (
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">
                        {t("excel.mapper.validation.rooms.title")}
                      </Label>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          {t("excel.mapper.validation.rooms.distribution")}
                        </Label>
                        {Object.entries(roomsValidation.roomsDistribution).map(
                          ([value, count]) => {
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
                                    <span className="font-medium">
                                      "{value}"
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {count}
                                      {t("excel.mapper.validation.count")}
                                    </Badge>
                                    {isInvalid && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {t(
                                          "excel.mapper.validation.rooms.unknown",
                                        )}
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
                                          <div className="h-3 w-3 rounded bg-purple-500"></div>
                                          {t("rooms.studio")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="1">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-blue-500"></div>
                                          {t("rooms.one")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="2">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-green-500"></div>
                                          {t("rooms.two")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="3">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-yellow-500"></div>
                                          {t("rooms.three")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="4">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-orange-500"></div>
                                          {t("rooms.four")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="5">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-red-500"></div>
                                          {t("rooms.fivePlus")}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="invalid">
                                        <div className="flex items-center gap-2">
                                          <div className="h-3 w-3 rounded bg-gray-500"></div>
                                          {t("excel.mapper.validation.ignore")}
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          },
                        )}

                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">
                            {t("excel.mapper.validation.rooms.addMapping")}
                          </Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder={t(
                                "excel.mapper.validation.valueFromExcel",
                              )}
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
                {statusValidation && statusValidation.invalidCount > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {t("excel.mapper.validation.status.warning")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-yellow-700">
                      {t("excel.mapper.validation.status.warningMessage", {
                        statuses: statusValidation.invalidStatuses.join(", "),
                      }) ||
                        `Обнаружены неизвестные статусы: ${statusValidation.invalidStatuses.join(", ")}. Квартиры с неизвестными статусами будут импортированы со статусом "Свободна".`}
                    </p>
                  </div>
                )}

                {projectData.type === "building" &&
                  roomsValidation &&
                  roomsValidation.invalidCount > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">
                          {t("excel.mapper.validation.rooms.warning")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-yellow-700">
                        {t("excel.mapper.validation.rooms.warningMessage", {
                          rooms: roomsValidation.invalidRooms.join(", "),
                        }) ||
                          `Обнаружены неизвестные значения комнат: ${roomsValidation.invalidRooms.join(", ")}. Квартиры с неизвестными значениями будут импортированы с 1 комнатой.`}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Предварительный просмотр данных */}
      <Card>
        <CardHeader>
          <CardTitle>{t("excel.mapper.preview.title")}</CardTitle>
          <CardDescription>
            {t("excel.mapper.preview.description", {
              count: importedData.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold text-real-estate-900">
                    {t("project.status")}
                  </th>
                  {Object.entries(allFields).map(([field, label]) => (
                    <th
                      key={field}
                      className="p-3 text-left font-semibold text-real-estate-900"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b hover:bg-real-estate-50">
                    <td className="p-3">
                      <Check className="h-5 w-5 text-success-500" />
                    </td>
                    {Object.entries(allFields).map(([field]) => {
                      const columnName =
                        columnMapping[field as keyof ColumnMapping];
                      const value =
                        columnName && columnName !== "__none__"
                          ? row[columnName]
                          : "";
                      return (
                        <td key={field} className="p-3">
                          {value !== null &&
                          value !== undefined &&
                          value !== "" ? (
                            String(value)
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {importedData.length > 5 && (
              <p className="mt-2 text-center text-sm text-real-estate-600">
                {t("excel.mapper.preview.moreRecords", {
                  count: importedData.length - 5,
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onComplete}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={createProjectWithData}
          disabled={
            !isValidWithCustom || !projectData.name.trim() || isCreating
          }
          className={`${admin.primary} ${admin.primaryHover} excel_create_project_usertour`}
        >
          {isCreating
            ? t("state.creatingProject")
            : t("excel.mapper.actions.createProject")}
        </Button>
      </div>
    </div>
  );
};

export default ExcelColumnMapper;
