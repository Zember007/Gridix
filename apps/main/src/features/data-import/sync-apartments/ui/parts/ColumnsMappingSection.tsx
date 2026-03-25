import { Badge } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { ArrowRight } from "lucide-react";

type ColumnMapping = {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
  [key: string]: string;
};

export function ColumnsMappingSection({
  t,
  excelColumns,
  allFields,
  columnMapping,
  handleMappingChange,
  getPreviewValue,
}: {
  t: any;
  excelColumns: string[];
  allFields: Record<string, string>;
  columnMapping: ColumnMapping;
  handleMappingChange: (field: keyof ColumnMapping, value: string) => void;
  getPreviewValue: (field: keyof ColumnMapping) => any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("excel.sync.columns.title")}</CardTitle>
        <CardDescription>{t("excel.sync.columns.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Object.entries(allFields).map(([field, label]) => {
            const isRequired = field === "apartmentNumber";
            const currentValue = columnMapping[field as keyof ColumnMapping];

            return (
              <div key={field} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {label}
                  {isRequired && (
                    <Badge variant="destructive" className="text-xs">
                      {t("excel.mapper.required") || "Обязательно"}
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
                    className={
                      (!currentValue || currentValue === "__none__") &&
                      isRequired
                        ? "border-red-300"
                        : ""
                    }
                  >
                    <SelectValue
                      placeholder={
                        t("excel.mapper.columns.selectColumn") ||
                        "Выберите столбец"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("excel.mapper.columns.selectColumnPlaceholder") ||
                        "-- Выберите столбец --"}
                    </SelectItem>
                    {excelColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentValue && currentValue !== "__none__" && (
                  <div className="flex items-center gap-2 rounded bg-real-estate-50 p-2 text-sm text-real-estate-600">
                    <span>{t("common.example") || "Пример"}:</span>
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
  );
}
