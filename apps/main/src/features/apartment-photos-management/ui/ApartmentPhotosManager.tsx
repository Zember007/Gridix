import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gridix/ui";
import { Home, Layout } from "lucide-react";
import LayoutPhotosManager from "@/components/visualization/LayoutPhotosManager";
import { Spinner } from "@/shared/ui/Spinner";
import { useLanguage } from "@gridix/utils/react";
import ApartmentPhotosCoveragePanel from "./ApartmentPhotosCoveragePanel";
import ApartmentPhotosUploadPanel from "./ApartmentPhotosUploadPanel";
import ApartmentPhotosGrid from "./ApartmentPhotosGrid";
import { useApartmentPhotosManager } from "../model/useApartmentPhotosManager";

interface ApartmentPhotosManagerProps {
  projectId: string;
}

const ApartmentPhotosManager = ({ projectId }: ApartmentPhotosManagerProps) => {
  const { t } = useLanguage();
  const {
    apartments,
    selectedApartment,
    setSelectedApartment,
    photos,
    loading,
    uploading,
    isDragOverUpload,
    isCoverageExpanded,
    setIsCoverageExpanded,
    coverageFilter,
    setCoverageFilter,
    apartmentsWithPhotos,
    apartmentsWithoutPhotos,
    filteredApartments,
    photoCountsByApartment,
    photoUploadInputRef,
    handlePhotoUpload,
    handleUploadDrop,
    handleUploadDragOver,
    handleUploadDragLeave,
    duplicatePhotosToSimilarApartments,
    handleDeletePhoto,
  } = useApartmentPhotosManager(projectId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="apartments" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="apartments" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {t("photosManager.individualPhotos")}
          </TabsTrigger>
          <TabsTrigger value="layouts" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            {t("photosManager.layoutPhotos")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apartments">
          <Card>
            <CardHeader>
              <CardTitle>{t("photosManager.title")}</CardTitle>
              <CardDescription>
                {t("photosManager.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apartment-select">
                  {t("photosManager.selectApartment")}
                </Label>
                <Select
                  value={selectedApartment}
                  onValueChange={setSelectedApartment}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={t(
                        "photosManager.selectApartmentPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apartment) => (
                      <SelectItem key={apartment.id} value={apartment.id}>
                        {t("photosManager.apartmentOption", {
                          number: apartment.apartment_number,
                          floor: apartment.floor_number,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ApartmentPhotosCoveragePanel
                apartments={apartments}
                selectedApartment={selectedApartment}
                setSelectedApartment={setSelectedApartment}
                isCoverageExpanded={isCoverageExpanded}
                setIsCoverageExpanded={setIsCoverageExpanded}
                coverageFilter={coverageFilter}
                setCoverageFilter={setCoverageFilter}
                apartmentsWithPhotos={apartmentsWithPhotos}
                apartmentsWithoutPhotos={apartmentsWithoutPhotos}
                filteredApartments={filteredApartments}
                photoCountsByApartment={photoCountsByApartment}
              />

              <ApartmentPhotosUploadPanel
                selectedApartment={selectedApartment}
                uploading={uploading}
                isDragOverUpload={isDragOverUpload}
                photoUploadInputRef={photoUploadInputRef}
                photosCount={photos.length}
                onPhotoUpload={handlePhotoUpload}
                onUploadDrop={handleUploadDrop}
                onUploadDragOver={handleUploadDragOver}
                onUploadDragLeave={handleUploadDragLeave}
                onDuplicatePhotos={duplicatePhotosToSimilarApartments}
              />

              {selectedApartment && (
                <ApartmentPhotosGrid
                  photos={photos}
                  onDeletePhoto={handleDeletePhoto}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts">
          <LayoutPhotosManager
            projectId={projectId}
            initialApartments={apartments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApartmentPhotosManager;
