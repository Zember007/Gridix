
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Settings, Building2, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import ExcelColumnMapper from '@/components/ExcelColumnMapper';

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  onManualCreate: () => void;
}

interface ImportedRow {
  [key: string]: any;
}

const ProjectCreationModal = ({ open, onClose, onManualCreate }: ProjectCreationModalProps) => {
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Only Excel (.xlsx, .xls) and CSV files are supported');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          // Mock extracted columns from Excel file
          const mockColumns = [
            'Apartment Number', 'Floor', 'Rooms', 'Area', 'Price', 'Status',
            'номер квартиры', 'этаж', 'комнаты', 'площадь', 'цена', 'статус'
          ];
          setExcelColumns(mockColumns);
          
          // Mock imported data
          const mockData = [
            { 'Apartment Number': '101', 'Floor': 1, 'Rooms': 1, 'Area': 45.5, 'Price': 550000, 'Status': 'available' },
            { 'Apartment Number': '102', 'Floor': 1, 'Rooms': 2, 'Area': 68.2, 'Price': 720000, 'Status': 'available' },
            { 'Apartment Number': '103', 'Floor': 1, 'Rooms': 3, 'Area': 92.1, 'Price': 980000, 'Status': 'sold' },
          ];
          setImportedData(mockData);
          setShowColumnMapper(true);
          toast.success('File processed successfully!');
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    toast.info('Processing Excel file...');
  };

  const downloadTemplate = () => {
    const csvContent = `Apartment Number,Floor,Rooms,Area (m²),Price (USD),Status
101,1,1,45.5,550000,available
102,1,2,68.2,720000,available
103,1,3,92.1,980000,sold
201,2,1,44.8,540000,available
202,2,2,67.5,710000,reserved`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'apartment_template.csv';
    link.click();
    toast.success('Template downloaded');
  };

  const handleCloseModal = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    onClose();
  };

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6 text-real-estate-600" />
                  Map Excel Columns
                </DialogTitle>
                <DialogDescription>
                  Map the columns from your Excel file to the apartment data fields
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <ExcelColumnMapper 
            excelColumns={excelColumns}
            importedData={importedData}
            onComplete={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-real-estate-600" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Choose how you want to create your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Manual Creation Option */}
          <Card className="cursor-pointer hover:bg-real-estate-50 transition-colors" onClick={onManualCreate}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-real-estate-600" />
                Manual Setup
              </CardTitle>
              <CardDescription>
                Create a project from scratch and configure everything manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-real-estate-600 hover:bg-real-estate-700">
                Start Manual Creation
              </Button>
            </CardContent>
          </Card>

          {/* Excel Import Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-real-estate-600" />
                Import from Excel
              </CardTitle>
              <CardDescription>
                Upload an Excel file with apartment data and map columns automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-real-estate-600 hover:bg-real-estate-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Upload Excel File'}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                >
                  <Download className="h-4 w-4 mr-2" />
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

              <div className="text-sm text-real-estate-600 bg-real-estate-50 p-3 rounded-md">
                <p><strong>Supported formats:</strong> Excel (.xlsx, .xls) and CSV</p>
                <p><strong>Required data:</strong> Apartment numbers, floors, rooms, area, price, status</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationModal;
