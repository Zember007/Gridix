import { Badge } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { AlertTriangle, ArrowRight, Plus } from "lucide-react";

type ColumnMapping = {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
  [key: string]: string;
};

type StatusValidationResult = {
  validCount: number;
  invalidCount: number;
  invalidStatuses: string[];
  statusDistribution: Record<string, number>;
};

type RoomsValidationResult = {
  validCount: number;
  invalidCount: number;
  invalidRooms: string[];
  roomsDistribution: Record<string, number>;
};

type StatusMapping = {
  [key: string]: "available" | "sold" | "reserved" | "invalid";
};

type RoomsMapping = {
  [key: string]: number | "invalid";
};

export function ValidationSection({
  t,
  columnMapping,
  effectiveType,
  statusValidation,
  roomsValidation,
  statusMapping,
  roomsMapping,
  showValidation,
  setShowValidation,
  updateStatusMapping,
  updateRoomsMapping,
  addCustomStatusMapping,
  addCustomRoomsMapping,
}: {
  t: any;
  columnMapping: ColumnMapping;
  effectiveType: "building" | "object";
  statusValidation: StatusValidationResult | null;
  roomsValidation: RoomsValidationResult | null;
  statusMapping: StatusMapping;
  roomsMapping: RoomsMapping;
  showValidation: boolean;
  setShowValidation: (v: boolean) => void;
  updateStatusMapping: (
    originalValue: string,
    mappedValue: "available" | "sold" | "reserved" | "invalid",
  ) => void;
  updateRoomsMapping: (
    originalValue: string,
    mappedValue: number | "invalid",
  ) => void;
  addCustomStatusMapping: (originalValue: string) => void;
  addCustomRoomsMapping: (originalValue: string) => void;
}) {
  const shouldShow =
    (columnMapping.status && columnMapping.status !== "__none__") ||
    (effectiveType === "building" &&
      columnMapping.rooms &&
      columnMapping.rooms !== "__none__");

  if (!shouldShow) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("excel.mapper.validation.title") || "Валидация данных"}
          {((statusValidation && statusValidation.invalidCount > 0) ||
            (effectiveType === "building" &&
              roomsValidation &&
              roomsValidation.invalidCount > 0)) && (
            <Badge variant="destructive" className="flex items-center gap-1">
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
              {t("excel.mapper.validation.validValues") || "Валидных значений"}
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
              {(statusValidation
                ? Object.keys(statusValidation.statusDistribution).length
                : 0) +
                (effectiveType === "building" && roomsValidation
                  ? Object.keys(roomsValidation.roomsDistribution).length
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
                ? t("excel.mapper.validation.hideDetails") || "Скрыть детали"
                : t("excel.mapper.validation.showDetails") || "Показать детали"}
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
                    <Label className="text-sm font-medium">
                      {t("excel.mapper.validation.status.distribution")}
                    </Label>
                    {Object.entries(statusValidation.statusDistribution).map(
                      ([value, count]) => {
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
                                  {t("excel.mapper.validation.count") || " шт."}
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
                                      {t("project.reserved") || "Забронирована"}
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
                      },
                    )}

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
                                <span className="font-medium">"{value}"</span>
                                <Badge variant="outline" className="text-xs">
                                  {count}
                                  {t("excel.mapper.validation.count") || " шт."}
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
                      },
                    )}

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
            {statusValidation && statusValidation.invalidCount > 0 && (
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
                    statuses: statusValidation.invalidStatuses.join(", "),
                  }) ||
                    `Неизвестные статусы: ${statusValidation.invalidStatuses.join(", ")}. Строки с ними будут пропущены для поля статуса.`}
                </p>
              </div>
            )}

            {effectiveType === "building" &&
              roomsValidation &&
              roomsValidation.invalidCount > 0 && (
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
                      rooms: roomsValidation.invalidRooms.join(", "),
                    }) ||
                      `Неизвестные значения комнат: ${roomsValidation.invalidRooms.join(", ")}. Строки с ними будут пропущены для поля комнат.`}
                  </p>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
