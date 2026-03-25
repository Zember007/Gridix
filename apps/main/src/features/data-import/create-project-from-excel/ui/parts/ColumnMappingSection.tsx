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

export function ColumnMappingSection({
  t,
  excelColumns,
  allFields,
  allRequiredFields,
  columnMapping,
  handleMappingChange,
  toColumnClass,
  getPreviewValue,
}: {
  t: any;
  excelColumns: string[];
  allFields: Record<string, string>;
  allRequiredFields: string[];
  columnMapping: ColumnMapping;
  handleMappingChange: (field: keyof ColumnMapping, value: string) => void;
  toColumnClass: (columnName: string) => string;
  getPreviewValue: (field: keyof ColumnMapping) => any;
}) {
  return (
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
  );
}
