import { useMemo, useState } from "react";
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
import { useLanguage } from "@gridix/utils/react";
import SharedApartmentSyncDialog from "@/features/apartment-sync/ui/SharedApartmentSyncDialog";
import ApartmentPhotosCoveragePanel from "./ApartmentPhotosCoveragePanel";
import ApartmentPhotosUploadPanel from "./ApartmentPhotosUploadPanel";
import ApartmentPhotosGrid from "./ApartmentPhotosGrid";
import { useApartmentPhotosManager } from "../model/useApartmentPhotosManager";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";

interface ApartmentPhotosManagerProps {
  projectId: string;
  subProjectId?: string;
}

const ApartmentPhotosManager = ({
  projectId,
  subProjectId,
}: ApartmentPhotosManagerProps) => {
  const { t } = useLanguage();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const {
    apartments,
    selectedApartment,
    setSelectedApartment,
    photos,
    loading,
    uploading,
    uploadProgresses,
    isCoverageExpanded,
    setIsCoverageExpanded,
    coverageFilter,
    setCoverageFilter,
    apartmentsWithPhotos,
    apartmentsWithoutPhotos,
    filteredApartments,
    photoCountsByApartment,
    handleCancelUpload,
    handleFilesSelected,
    resolveDroppedFiles,
    duplicatePhotosToApartments,
    handleDeletePhoto,
    handleReorderPhotos,
  } = useApartmentPhotosManager(projectId, subProjectId);

  const sourceApartment = useMemo(
    () =>
      apartments.find((apartment) => apartment.id === selectedApartment) ??
      null,
    [apartments, selectedApartment],
  );

  const handleOpenDuplicateDialog = async () => {
    if (!sourceApartment || photos.length === 0) {
      return;
    }

    setDuplicateDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <LoadingProgress />
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
                  disabled={uploading}
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
                uploadProgresses={uploadProgresses}
                photosCount={photos.length}
                onCancelUpload={handleCancelUpload}
                onFilesSelected={handleFilesSelected}
                resolveDroppedFiles={resolveDroppedFiles}
                onDuplicatePhotos={handleOpenDuplicateDialog}
              />

              {selectedApartment && (
                <ApartmentPhotosGrid
                  photos={photos}
                  onDeletePhoto={handleDeletePhoto}
                  onReorderPhotos={handleReorderPhotos}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts">
          <LayoutPhotosManager
            projectId={projectId}
            subProjectId={subProjectId}
            initialApartments={apartments}
          />
        </TabsContent>
      </Tabs>

      <SharedApartmentSyncDialog
        mode="photo-duplicate"
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        sourceApartment={sourceApartment}
        allApartments={apartments}
        photoCountsByApartment={photoCountsByApartment}
        isSubmitting={isDuplicating}
        onConfirm={async (selectedIds) => {
          setIsDuplicating(true);
          try {
            await duplicatePhotosToApartments(Array.from(selectedIds));
            setDuplicateDialogOpen(false);
          } finally {
            setIsDuplicating(false);
          }
        }}
      />
    </div>
  );
};

export default ApartmentPhotosManager;
