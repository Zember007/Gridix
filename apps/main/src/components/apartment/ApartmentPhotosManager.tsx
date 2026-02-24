import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
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
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Home,
  Image as ImageIcon,
  Layout,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  uploadApartmentPhoto,
  deleteApartmentPhoto,
} from "@/features/projectEditor/api/projectEditorApi";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import LayoutPhotosManager from "@/components/visualization/LayoutPhotosManager";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@gridix/utils/react";
import { compressToWebP } from "@gridix/utils/lib";
import { Spinner } from "@/shared/ui/Spinner";

interface ApartmentPhotosManagerProps {
  projectId: string;
}

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

const ApartmentPhotosManager = ({ projectId }: ApartmentPhotosManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<string>("");
  const [photos, setPhotos] = useState<ApartmentPhoto[]>([]);
  const [photoCountsByApartment, setPhotoCountsByApartment] = useState<
    Record<string, number>
  >({});
  const [isCoverageExpanded, setIsCoverageExpanded] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();
  const editorData = useProjectEditorDataContext();

  const loadApartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId)
        .order("floor_number", { ascending: true })
        .order("apartment_number", { ascending: true });

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
    } catch (error) {
      console.error("Error loading apartments:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (editorData) {
      if (editorData.loading) {
        setLoading(true);
        return;
      }
      if (editorData?.data?.apartments == null) {
        setApartments([]);
        setLoading(false);
        return;
      }
      setApartments(editorData.data.apartments.map(normalizeApartmentData));
      setLoading(false);
      return;
    }
    loadApartments();
  }, [editorData, editorData?.data?.apartments, loadApartments]);

  const loadPhotos = useCallback(async () => {
    if (!selectedApartment) return;
    try {
      const { data, error } = await supabase
        .from("apartment_photos")
        .select("*")
        .eq("apartment_id", selectedApartment)
        .order("order_index", { ascending: true });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  }, [selectedApartment]);

  useEffect(() => {
    if (selectedApartment) {
      loadPhotos();
    }
  }, [selectedApartment, loadPhotos]);

  const loadPhotoCoverage = useCallback(async () => {
    const apartmentIds = apartments.map((apartment) => apartment.id);
    if (apartmentIds.length === 0) {
      setPhotoCountsByApartment({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("apartment_photos")
        .select("apartment_id")
        .in("apartment_id", apartmentIds);

      if (error) throw error;

      const defaultCounts = apartmentIds.reduce<Record<string, number>>(
        (acc, apartmentId) => {
          acc[apartmentId] = 0;
          return acc;
        },
        {},
      );

      const counts = (data || []).reduce<Record<string, number>>(
        (acc, photo) => {
          acc[photo.apartment_id] = (acc[photo.apartment_id] || 0) + 1;
          return acc;
        },
        defaultCounts,
      );

      setPhotoCountsByApartment(counts);
    } catch (error) {
      console.error("Error loading apartment photo coverage:", error);
    }
  }, [apartments]);

  useEffect(() => {
    loadPhotoCoverage();
  }, [loadPhotoCoverage]);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || !selectedApartment) return;
    if (!user) {
      toast.error(t("photosManager.authRequired"));
      return;
    }
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file_get, index) => {
        const blob = await compressToWebP(file_get);
        const file = new File([blob], `photo-${index}.webp`, {
          type: "image/webp",
        });
        await uploadApartmentPhoto(
          selectedApartment,
          photos.length + index,
          file,
        );
      });
      await Promise.all(uploadPromises);
      toast.success(t("photosManager.uploadSuccess"));
      loadPhotos();
      loadPhotoCoverage();
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error(t("photosManager.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      await deleteApartmentPhoto(photoId, imageUrl);
      toast.success(t("photosManager.deleteSuccess"));
      loadPhotos();
      loadPhotoCoverage();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error(t("photosManager.deleteError"));
    }
  };

  const duplicatePhotosToSimilarApartments = async () => {
    if (!selectedApartment || photos.length === 0) return;

    try {
      const currentApartment = apartments.find(
        (apt) => apt.id === selectedApartment,
      );
      if (!currentApartment) return;

      const currentArea = currentApartment.area;
      const currentRooms = currentApartment.rooms;

      // Находим квартиры с такой же площадью и количеством комнат
      const similarApartments = apartments.filter((apt) => {
        // Проверяем, что площадь и количество комнат совпадают, и это не та же квартира
        return (
          apt.area === currentArea &&
          apt.rooms === currentRooms &&
          apt.id !== selectedApartment
        );
      });

      const duplicatePromises = similarApartments.map(async (apartment) => {
        // Получаем существующие URL фотографий для целевой квартиры,
        // чтобы не вставлять дубликаты при повторном дублировании
        const { data: existingPhotos, error: existingError } = await supabase
          .from("apartment_photos")
          .select("image_url")
          .eq("apartment_id", apartment.id);

        if (existingError) throw existingError;

        const existingUrls = new Set(
          (existingPhotos || []).map((p) => p.image_url),
        );

        const photosToInsert = photos.filter(
          (p) => !existingUrls.has(p.image_url),
        );

        if (photosToInsert.length === 0) return;

        const insertPayload = photosToInsert.map((photo) => ({
          apartment_id: apartment.id,
          image_url: photo.image_url,
          description: photo.description,
          order_index: photo.order_index,
        }));

        const { error: insertError } = await supabase
          .from("apartment_photos")
          .insert(insertPayload);

        if (insertError) throw insertError;
      });

      await Promise.all(duplicatePromises);
      toast.success(
        t("photosManager.duplicateSuccess", {
          count: similarApartments.length,
        }),
      );
      loadPhotoCoverage();
    } catch (error) {
      console.error("Error duplicating photos:", error);
      toast.error(t("photosManager.duplicateError"));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  const apartmentsWithPhotos = apartments.filter(
    (apartment) => (photoCountsByApartment[apartment.id] || 0) > 0,
  );
  const apartmentsWithoutPhotos = apartments.filter(
    (apartment) => (photoCountsByApartment[apartment.id] || 0) === 0,
  );
  const orderedApartments = [
    ...apartmentsWithoutPhotos,
    ...apartmentsWithPhotos,
  ];
  const filteredApartments =
    coverageFilter === "with"
      ? apartmentsWithPhotos
      : coverageFilter === "without"
        ? apartmentsWithoutPhotos
        : orderedApartments;

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

              <div className="space-y-3 rounded-lg border p-4">
                <button
                  type="button"
                  className="flex w-full items-start justify-between rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/40"
                  onClick={() => setIsCoverageExpanded((prev) => !prev)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t("photosManager.coverageTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("photosManager.coverageDescription")}
                    </p>
                  </div>
                  {isCoverageExpanded ? (
                    <ChevronUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isCoverageExpanded && (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        aria-pressed={coverageFilter === "all"}
                        variant="outline"
                        className={`h-auto justify-start rounded-lg p-3 text-left transition-all ${
                          coverageFilter === "all"
                            ? "border-primary/40 bg-primary/10 shadow-sm"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setCoverageFilter("all")}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("photosManager.totalApartments")}
                          </p>
                          <p className="text-xl font-semibold">
                            {apartments.length}
                          </p>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        aria-pressed={coverageFilter === "with"}
                        variant="outline"
                        className={`h-auto justify-start rounded-md p-3 text-left ${
                          coverageFilter === "with"
                            ? "border-green-500/40 bg-green-500/15 shadow-sm"
                            : "border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                        }`}
                        onClick={() => setCoverageFilter("with")}
                      >
                        <div>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            {t("photosManager.withPhotos")}
                          </p>
                          <p className="text-xl font-semibold">
                            {apartmentsWithPhotos.length}
                          </p>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        aria-pressed={coverageFilter === "without"}
                        variant="outline"
                        className={`h-auto justify-start rounded-md p-3 text-left ${
                          coverageFilter === "without"
                            ? "border-amber-500/40 bg-amber-500/20 shadow-sm"
                            : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15"
                        }`}
                        onClick={() => setCoverageFilter("without")}
                      >
                        <div>
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            {t("photosManager.withoutPhotos")}
                          </p>
                          <p className="text-xl font-semibold">
                            {apartmentsWithoutPhotos.length}
                          </p>
                        </div>
                      </Button>
                    </div>

                    {apartments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {t("photosManager.missingFirstHint")}
                        </p>
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {filteredApartments.map((apartment) => {
                            const photoCount =
                              photoCountsByApartment[apartment.id] || 0;
                            const hasNoPhotos = photoCount === 0;

                            return (
                              <Button
                                key={apartment.id}
                                type="button"
                                variant="outline"
                                className={`w-full justify-between text-left ${
                                  selectedApartment === apartment.id
                                    ? "border-primary/40 bg-primary/10 shadow-sm"
                                    : hasNoPhotos
                                      ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                                      : "hover:bg-muted/40"
                                }`}
                                onClick={() =>
                                  setSelectedApartment(apartment.id)
                                }
                              >
                                <span>
                                  {t("photosManager.apartmentOption", {
                                    number: apartment.apartment_number,
                                    floor: apartment.floor_number,
                                  })}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    hasNoPhotos
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-green-500/15 text-green-700 dark:text-green-300"
                                  }`}
                                >
                                  {hasNoPhotos
                                    ? t("photosManager.noIndividualPhotosShort")
                                    : t("photosManager.photoCountShort", {
                                        count: photoCount,
                                      })}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedApartment && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo-upload">
                      {t("photosManager.uploadPhotos")}
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="mt-1"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("photosManager.uploadMultiple")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={duplicatePhotosToSimilarApartments}
                      disabled={photos.length === 0}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      {t("photosManager.duplicateToSimilar")}
                    </Button>
                  </div>

                  {photos.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                      <p>{t("photosManager.noPhotos")}</p>
                      <p className="text-sm">
                        {t("photosManager.noPhotosDesc")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="group relative">
                          <img
                            src={photo.image_url}
                            alt={photo.description || "Фото квартиры"}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() =>
                              handleDeletePhoto(photo.id, photo.image_url)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
