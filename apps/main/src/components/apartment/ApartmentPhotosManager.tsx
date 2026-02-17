import { useEffect, useState } from "react";
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
import { Copy, Home, Image as ImageIcon, Layout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadApartments();
  }, [projectId]);

  useEffect(() => {
    if (selectedApartment) {
      loadPhotos();
    }
  }, [selectedApartment]);

  const loadApartments = async () => {
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
  };

  const loadPhotos = async () => {
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
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || !selectedApartment) return;

    // Проверяем аутентификацию пользователя
    if (!user) {
      toast.error(t("photosManager.authRequired"));
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file_get, index) => {
        const file = await compressToWebP(file_get);

        const fileName = `${selectedApartment}-${Date.now()}-${index}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(`apartments/${fileName}`, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("project-images")
          .getPublicUrl(`apartments/${fileName}`);

        const { error: insertError } = await supabase
          .from("apartment_photos")
          .insert({
            apartment_id: selectedApartment,
            image_url: publicUrl,
            order_index: photos.length + index,
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      toast.success(t("photosManager.uploadSuccess"));
      loadPhotos();
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error(t("photosManager.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from("apartment_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("project-images")
          .remove([`apartments/${fileName}`]);
      }

      toast.success(t("photosManager.deleteSuccess"));
      loadPhotos();
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
          <LayoutPhotosManager projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApartmentPhotosManager;
