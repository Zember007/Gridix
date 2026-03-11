import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Upload, Image as ImageIcon, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useAuth } from "@/contexts/AuthContext";
import { compressToWebP } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";

interface LayoutPhotosManagerProps {
  projectId: string;
  /** When provided, apartments are not fetched again (e.g. from project editor context). */
  initialApartments?: Apartment[] | null;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

interface LayoutType {
  key: string;
  rooms: number;
  type: string;
  isFreeLayout?: boolean;
}

function deriveLayoutTypesFromApartments(
  normalizedApartments: Apartment[],
): LayoutType[] {
  const roomTypeMap = new Map<
    string,
    { rooms: number; type: string; isFreeLayout?: boolean }
  >();
  normalizedApartments.forEach((apt) => {
    const key = `${apt.rooms}-${apt.type}`;
    if (!roomTypeMap.has(key)) {
      const roomsValue = apt.rooms === "free_layout" ? -1 : Number(apt.rooms);
      roomTypeMap.set(key, {
        rooms: roomsValue,
        type: apt.type,
        isFreeLayout: apt.rooms === "free_layout",
      });
    }
  });
  const uniqueRoomCounts = Array.from(roomTypeMap.values());
  return uniqueRoomCounts.map((data) => {
    if (data.type === "apartment") {
      if ((data as { isFreeLayout?: boolean }).isFreeLayout) {
        return {
          key: "free_layout",
          rooms: -1,
          type: data.type,
          isFreeLayout: true,
        };
      } else if (data.rooms === 0) {
        return { key: "studio", rooms: 0, type: data.type };
      } else {
        return {
          key: `${data.rooms}-room`,
          rooms: data.rooms,
          type: data.type,
        };
      }
    } else {
      return {
        key: data.type,
        rooms: data.rooms,
        type: data.type,
      };
    }
  });
}

const LayoutPhotosManager = ({
  projectId,
  initialApartments = null,
}: LayoutPhotosManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [layoutTypes, setLayoutTypes] = useState<LayoutType[]>([]);
  const [selectedLayoutType, setSelectedLayoutType] = useState<string>("");
  const [photos, setPhotos] = useState<LayoutPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  const loadApartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);
      const derivedLayoutTypes =
        deriveLayoutTypesFromApartments(normalizedApartments);

      setApartments(normalizedApartments);
      setLayoutTypes(derivedLayoutTypes);

      if (derivedLayoutTypes.length > 0) {
        const first = derivedLayoutTypes[0];
        if (first) setSelectedLayoutType(first.key);
      }
    } catch (error) {
      console.error("Error loading apartments:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadLayoutPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("layout_photos")
        .select("*")
        .eq("project_id", projectId)
        .eq("layout_type", selectedLayoutType)
        .order("order_index", { ascending: true });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error("Error loading layout photos:", error);
    }
  }, [projectId, selectedLayoutType]);

  useEffect(() => {
    if (initialApartments != null && Array.isArray(initialApartments)) {
      setApartments(initialApartments);
      const derivedLayoutTypes =
        deriveLayoutTypesFromApartments(initialApartments);
      setLayoutTypes(derivedLayoutTypes);
      if (derivedLayoutTypes.length > 0) {
        const first = derivedLayoutTypes[0];
        if (first) setSelectedLayoutType(first.key);
      }
      setLoading(false);
      return;
    }
    loadApartments();
  }, [loadApartments, initialApartments]);

  useEffect(() => {
    if (selectedLayoutType) {
      loadLayoutPhotos();
    }
  }, [selectedLayoutType, loadLayoutPhotos]);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || !selectedLayoutType) return;

    if (!user) {
      toast.error(t("photosManager.authRequired"));
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file_get, index) => {
        const file = await compressToWebP(file_get);

        const fileName = `${projectId}-${selectedLayoutType}-${Date.now()}-${index}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(`layouts/${fileName}`, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("project-images")
          .getPublicUrl(`layouts/${fileName}`);

        const { error: insertError } = await supabase
          .from("layout_photos")
          .insert({
            project_id: projectId,
            layout_type: selectedLayoutType,
            image_url: publicUrl,
            order_index: photos.length + index,
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      toast.success(t("photosManager.layoutUploadSuccess"));
      loadLayoutPhotos();
    } catch (error) {
      console.error("Error uploading layout photos:", error);
      toast.error(t("photosManager.layoutUploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from("layout_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("project-images")
          .remove([`layouts/${fileName}`]);
      }

      toast.success(t("photosManager.layoutDeleteSuccess"));
      loadLayoutPhotos();
    } catch (error) {
      console.error("Error deleting layout photo:", error);
      toast.error(t("photosManager.layoutDeleteError"));
    }
  };

  const getApartmentCountForLayout = (layoutKey: string) => {
    const layoutType = layoutTypes.find((lt) => lt.key === layoutKey);
    if (!layoutType) return 0;

    if (layoutKey === "commercial" || layoutKey === "parking") {
      return apartments.filter((apt) => apt.type === layoutKey).length;
    }

    if (layoutKey === "free_layout") {
      return apartments.filter(
        (apt) => apt.type === "apartment" && apt.rooms === "free_layout",
      ).length;
    }

    return apartments.filter(
      (apt) => apt.type === "apartment" && apt.rooms === layoutType.rooms,
    ).length;
  };

  const getLayoutTypeLabel = useCallback(
    (layoutType: LayoutType): string => {
      if (layoutType.type === "apartment") {
        if (layoutType.isFreeLayout || layoutType.key === "free_layout") {
          return t("photosManager.layoutType.freeLayout");
        }
        if (layoutType.rooms === 0 || layoutType.key === "studio") {
          return t("photosManager.layoutType.studio");
        }
        return t("photosManager.layoutType.room", { count: layoutType.rooms });
      }

      if (layoutType.type === "commercial") {
        return t("photosManager.layoutType.commercial");
      }
      if (layoutType.type === "parking") {
        return t("photosManager.layoutType.parking");
      }
      return layoutType.type;
    },
    [t],
  );

  const selectedLayoutLabel = useMemo(() => {
    const currentLayoutType = layoutTypes.find(
      (layoutType) => layoutType.key === selectedLayoutType,
    );
    return currentLayoutType ? getLayoutTypeLabel(currentLayoutType) : "";
  }, [layoutTypes, selectedLayoutType, getLayoutTypeLabel]);

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
      <Card>
        <CardHeader>
          <CardTitle>{t("photosManager.layoutTitle")}</CardTitle>
          <CardDescription>
            {t("photosManager.layoutDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="layout-select">
              {t("photosManager.selectLayoutType")}
            </Label>
            <Select
              value={selectedLayoutType}
              onValueChange={setSelectedLayoutType}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={t("photosManager.selectLayoutTypePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {layoutTypes.map((layoutType) => (
                  <SelectItem key={layoutType.key} value={layoutType.key}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {getLayoutTypeLabel(layoutType)} (
                      {getApartmentCountForLayout(layoutType.key)})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLayoutType && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="layout-photo-upload">
                  {t("photosManager.uploadLayoutPhotos")}
                </Label>
                <Input
                  id="layout-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("photosManager.layoutTypeInfo", {
                    type: selectedLayoutLabel,
                  })}
                </p>
              </div>

              {photos.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                  <p>{t("photosManager.layoutNoPhotos")}</p>
                  <p className="text-sm">
                    {t("photosManager.layoutNoPhotosDesc")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative">
                      <img
                        src={photo.image_url}
                        alt={
                          photo.description || t("photosManager.layoutPhotoAlt")
                        }
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
    </div>
  );
};

export default LayoutPhotosManager;
