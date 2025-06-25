
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExcelColumnMapperProps {
  excelColumns: string[];
  importedData: any[];
  onComplete: () => void;
}

interface ColumnMapping {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
}

interface ProjectData {
  name: string;
  description: string;
  floors: number;
}

const ExcelColumnMapper = ({ excelColumns, importedData, onComplete }: ExcelColumnMapperProps) => {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    apartmentNumber: '',
    floor: '',
    rooms: '',
    area: '',
    price: '',
    status: ''
  });

  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    floors: 1
  });

  const [isCreating, setIsCreating] = useState(false);

  const fieldLabels = {
    apartmentNumber: 'Apartment Number',
    floor: 'Floor',
    rooms: 'Number of Rooms',
    area: 'Area (m²)',
    price: 'Price',
    status: 'Status'
  };

  const requiredFields = ['apartmentNumber', 'floor', 'rooms', 'area'];
  const isValid = requiredFields.every(field => columnMapping[field as keyof ColumnMapping]);

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };

  const getPreviewValue = (field: keyof ColumnMapping) => {
    const columnName = columnMapping[field];
    if (!columnName || !importedData.length) return 'No data';
    return importedData[0][columnName] || 'No data';
  };

  const createProjectWithData = async () => {
    if (!isValid || !projectData.name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      // Calculate max floor from the data
      const maxFloor = Math.max(...importedData.map(row => {
        const floorValue = row[columnMapping.floor];
        return parseInt(floorValue) || 1;
      }));

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name.trim(),
          description: projectData.description.trim() || null,
          floors: Math.max(maxFloor, projectData.floors)
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Process and insert apartment data
      const apartmentData = importedData.map(row => ({
        project_id: project.id,
        apartment_number: String(row[columnMapping.apartmentNumber] || ''),
        floor_number: parseInt(row[columnMapping.floor]) || 1,
        rooms: parseInt(row[columnMapping.rooms]) || 1,
        area: parseFloat(row[columnMapping.area]) || 0,
        price: columnMapping.price ? (parseInt(row[columnMapping.price]) || 0) : 0,
        status: columnMapping.status ? (row[columnMapping.status] || 'available') : 'available'
      }));

      const { error: apartmentError } = await supabase
        .from('apartments')
        .insert(apartmentData);

      if (apartmentError) throw apartmentError;

      toast.success(`Project "${projectData.name}" created with ${apartmentData.length} apartments`);
      
      // Redirect to the created project
      setTimeout(() => {
        window.location.href = `/admin/projects/${project.id}`;
      }, 1000);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error creating project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic information about your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectName">Project Name*</Label>
            <Input
              id="projectName"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="projectDescription">Description</Label>
            <Input
              id="projectDescription"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="floors">Number of Floors</Label>
            <Input
              id="floors"
              type="number"
              value={projectData.floors}
              onChange={(e) => setProjectData(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
              min="1"
              max="50"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Map Excel Columns</CardTitle>
          <CardDescription>
            Match your Excel columns with apartment data fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(fieldLabels).map(([field, label]) => {
              const isRequired = requiredFields.includes(field);
              const currentValue = columnMapping[field as keyof ColumnMapping];
              
              return (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </Label>
                  <Select
                    value={currentValue}
                    onValueChange={(value) => handleMappingChange(field as keyof ColumnMapping, value)}
                  >
                    <SelectTrigger className={!currentValue && isRequired ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Select Column --</SelectItem>
                      {excelColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentValue && (
                    <div className="flex items-center gap-2 text-sm text-real-estate-600 bg-real-estate-50 p-2 rounded">
                      <span>Preview:</span>
                      <ArrowRight className="h-3 w-3" />
                      <strong>{getPreviewValue(field as keyof ColumnMapping)}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Preview of how your data will be imported ({importedData.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-real-estate-900">Status</th>
                  {Object.entries(fieldLabels).map(([field, label]) => (
                    <th key={field} className="text-left p-3 font-semibold text-real-estate-900">
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
                    {Object.entries(fieldLabels).map(([field]) => {
                      const columnName = columnMapping[field as keyof ColumnMapping];
                      const value = columnName ? row[columnName] : '';
                      return (
                        <td key={field} className="p-3">
                          {value || <span className="text-gray-400">--</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {importedData.length > 5 && (
              <p className="text-sm text-real-estate-600 mt-2 text-center">
                ... and {importedData.length - 5} more records
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button
          onClick={createProjectWithData}
          disabled={!isValid || !projectData.name.trim() || isCreating}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          {isCreating ? 'Creating Project...' : 'Create Project with Data'}
        </Button>
      </div>
    </div>
  );
};

export default ExcelColumnMapper;
