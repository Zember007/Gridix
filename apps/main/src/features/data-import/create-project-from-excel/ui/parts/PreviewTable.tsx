import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Check } from "lucide-react";

type ColumnMapping = {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
  [key: string]: string;
};

type ImportedRowData = Record<string, string | number | null | undefined>;

export function PreviewTable({
  t,
  importedData,
  allFields,
  columnMapping,
}: {
  t: any;
  importedData: ImportedRowData[];
  allFields: Record<string, string>;
  columnMapping: ColumnMapping;
}) {
  return (
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
  );
}
