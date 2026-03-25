import { useApartmentPhotosData } from "./useApartmentPhotosData";
import { useApartmentPhotosUpload } from "./useApartmentPhotosUpload";
import { useApartmentPhotosActions } from "./useApartmentPhotosActions";

export interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

export type CoverageFilter = "all" | "with" | "without";

export const useApartmentPhotosManager = (projectId: string) => {
  const data = useApartmentPhotosData(projectId);

  const upload = useApartmentPhotosUpload({
    selectedApartment: data.selectedApartment,
    photosLength: data.photos.length,
    onAfterUpload: async () => {
      await data.loadPhotos();
      await data.loadPhotoCoverage();
    },
  });

  const actions = useApartmentPhotosActions({
    apartments: data.apartments,
    selectedApartment: data.selectedApartment,
    photos: data.photos,
    onAfterDelete: async () => {
      await data.loadPhotos();
      await data.loadPhotoCoverage();
    },
    onAfterDuplicate: async () => {
      await data.loadPhotoCoverage();
    },
    onAfterReorder: async () => {
      await data.loadPhotos();
    },
  });

  return {
    apartments: data.apartments,
    selectedApartment: data.selectedApartment,
    setSelectedApartment: data.setSelectedApartment,
    photos: data.photos,
    loading: data.loading,
    uploading: upload.uploading,
    uploadProgresses: upload.uploadProgresses,
    isCoverageExpanded: data.isCoverageExpanded,
    setIsCoverageExpanded: data.setIsCoverageExpanded,
    coverageFilter: data.coverageFilter,
    setCoverageFilter: data.setCoverageFilter,
    apartmentsWithPhotos: data.apartmentsWithPhotos,
    apartmentsWithoutPhotos: data.apartmentsWithoutPhotos,
    filteredApartments: data.filteredApartments,
    photoCountsByApartment: data.photoCountsByApartment,
    handleCancelUpload: upload.handleCancelUpload,
    handleFilesSelected: upload.handleFilesSelected,
    resolveDroppedFiles: upload.resolveDroppedFiles,
    duplicatePhotosToApartments: actions.duplicatePhotosToApartments,
    handleDeletePhoto: actions.handleDeletePhoto,
    handleReorderPhotos: actions.handleReorderPhotos,
  };
};
