import { useState, useRef } from "react";
import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Progress } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface ImportedRow {
  id: number;
  apartmentNumber: string;
  floor: number;
  rooms: number;
  area: number;
  price: number;
  status: string;
  error?: string;
}

const DataImport = () => {
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const sampleData: ImportedRow[] = [
    {
      id: 1,
      apartmentNumber: "101",
      floor: 1,
      rooms: 1,
      area: 45.5,
      price: 5500000,
      status: "available",
    },
    {
      id: 2,
      apartmentNumber: "102",
      floor: 1,
      rooms: 2,
      area: 68.2,
      price: 7200000,
      status: "available",
    },
    {
      id: 3,
      apartmentNumber: "103",
      floor: 1,
      rooms: 3,
      area: 92.1,
      price: 9800000,
      status: "sold",
    },
    {
      id: 4,
      apartmentNumber: "201",
      floor: 2,
      rooms: 1,
      area: 44.8,
      price: 5400000,
      status: "available",
    },
    {
      id: 5,
      apartmentNumber: "202",
      floor: 2,
      rooms: 2,
      area: 67.5,
      price: 7100000,
      status: "reserved",
    },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast.error("Only Excel (.xlsx, .xls) and CSV files are supported");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setImportedData(sampleData);
          toast.success("Data imported successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    toast.info("File processing started...");
  };

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = `Apartment Number,Floor,Rooms,Area (m²),Price (USD),Status
101,1,1,45.5,550000,available
102,1,2,68.2,720000,available
103,1,3,92.1,980000,sold
201,2,1,44.8,540000,available
202,2,2,67.5,710000,reserved`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "apartment_template.csv";
    link.click();
    toast.success("Template downloaded");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-success-100 text-success-800">Available</Badge>
        );
      case "sold":
        return <Badge className="bg-red-100 text-red-800">Sold</Badge>;
      case "reserved":
        return (
          <Badge className="bg-warning-100 text-warning-800">Reserved</Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const validCount = importedData.filter((row) => !row.error).length;
  const errorCount = importedData.filter((row) => row.error).length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-real-estate-600" />
            Import Apartment Data
          </CardTitle>
          <CardDescription>
            Upload Excel file with apartment data for automatic information
            filling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : "Upload File"}
            </Button>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 rounded-lg bg-real-estate-50 p-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-real-estate-600">
                {importedData.length}
              </div>
              <div className="text-sm text-real-estate-700">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {validCount}
              </div>
              <div className="text-sm text-real-estate-700">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {errorCount}
              </div>
              <div className="text-sm text-real-estate-700">With Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {importedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Check the correctness of imported data before applying
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Status
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Apartment
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Floor
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Rooms
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Area
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Price
                    </th>
                    <th className="p-3 text-left font-semibold text-real-estate-900">
                      Availability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importedData.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-real-estate-50"
                    >
                      <td className="p-3">
                        {row.error ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Check className="h-5 w-5 text-success-500" />
                        )}
                      </td>
                      <td className="p-3 font-medium">{row.apartmentNumber}</td>
                      <td className="p-3">{row.floor}</td>
                      <td className="p-3">{row.rooms}</td>
                      <td className="p-3">{row.area} m²</td>
                      <td className="p-3">${row.price.toLocaleString()}</td>
                      <td className="p-3">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importedData.length > 0 && (
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportedData([]);
                    toast.info("Data cleared");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Data applied to projects");
                    // Here you would actually apply the data to projects
                  }}
                  className="bg-real-estate-600 hover:bg-real-estate-700"
                >
                  Apply Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold text-real-estate-900">
                File Format
              </h4>
              <ul className="list-inside list-disc space-y-1 text-real-estate-700">
                <li>Supported formats: Excel (.xlsx, .xls) and CSV</li>
                <li>First row should contain column headers</li>
                <li>Use UTF-8 encoding for proper character display</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-real-estate-900">
                Required Columns
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">
                      Apartment Number:
                    </span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      101, 102A, etc.
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">Floor:</span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      1, 2, 3, etc.
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">Rooms:</span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      1, 2, 3, etc.
                    </code>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">Area (m²):</span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      45.5, 68.2, etc.
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">Price (USD):</span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      550000
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-real-estate-700">Status:</span>
                    <code className="rounded bg-real-estate-100 px-2 py-1 text-sm">
                      available, sold, reserved
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImport;
