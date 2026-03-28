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
import { toast } from "sonner";
import LayoutPhotosManager from "@/components/visualization/LayoutPhotosManager";
import { useLanguage } from "@gridix/utils/react";
import ApartmentPhotosCoveragePanel from "./ApartmentPhotosCoveragePanel";
import ApartmentPhotosDuplicateDialog from "./ApartmentPhotosDuplicateDialog";
import ApartmentPhotosUploadPanel from "./ApartmentPhotosUploadPanel";
import ApartmentPhotosGrid from "./ApartmentPhotosGrid";
import { useApartmentPhotosManager } from "../model/useApartmentPhotosManager";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";

interface ApartmentPhotosManagerProps {
  projectId: string;
}

const ApartmentPhotosManager = ({ projectId }: ApartmentPhotosManagerProps) => {
  const { t } = useLanguage();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedDuplicateApartmentIds, setSelectedDuplicateApartmentIds] =
    useState<Set<string>>(new Set());
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
  } = useApartmentPhotosManager(projectId);

  const sourceApartment = useMemo(
    () =>
      apartments.find((apartment) => apartment.id === selectedApartment) ??
      null,
    [apartments, selectedApartment],
  );

  const similarApartments = useMemo(() => {
    if (!sourceApartment) {
      return [];
    }

    return apartments.filter((apartment) => {
      return (
        apartment.id !== sourceApartment.id &&
        apartment.type === sourceApartment.type &&
        apartment.area === sourceApartment.area &&
        apartment.rooms === sourceApartment.rooms
      );
    });
  }, [apartments, sourceApartment]);

  const handleOpenDuplicateDialog = async () => {
    if (!sourceApartment || photos.length === 0) {
      return;
    }

    if (similarApartments.length === 0) {
      toast.error(t("apartmentsManager.syncError"));
      return;
    }

    setSelectedDuplicateApartmentIds(
      new Set(similarApartments.map((apartment) => apartment.id)),
    );
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateApartmentToggle = (apartmentId: string) => {
    setSelectedDuplicateApartmentIds((previous) => {
      const next = new Set(previous);

      if (next.has(apartmentId)) {
        next.delete(apartmentId);
      } else {
        next.add(apartmentId);
      }

      return next;
    });
  };

  const handleDuplicateSelectAll = () => {
    setSelectedDuplicateApartmentIds(
      selectedDuplicateApartmentIds.size === similarApartments.length
        ? new Set()
        : new Set(similarApartments.map((apartment) => apartment.id)),
    );
  };

  const handleConfirmDuplicate = async () => {
    const targetApartmentIds = Array.from(selectedDuplicateApartmentIds);
    if (targetApartmentIds.length === 0) {
      return;
    }

    setIsDuplicating(true);
    try {
      await duplicatePhotosToApartments(targetApartmentIds);
      setDuplicateDialogOpen(false);
    } finally {
      setIsDuplicating(false);
    }
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
            initialApartments={apartments}
          />
        </TabsContent>
      </Tabs>

      <ApartmentPhotosDuplicateDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        sourceApartment={sourceApartment}
        targetApartments={similarApartments}
        selectedApartmentIds={selectedDuplicateApartmentIds}
        photoCountsByApartment={photoCountsByApartment}
        isSubmitting={isDuplicating}
        onApartmentToggle={handleDuplicateApartmentToggle}
        onSelectAll={handleDuplicateSelectAll}
        onConfirm={handleConfirmDuplicate}
      />
    </div>
  );
};

export default ApartmentPhotosManager;
