import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@gridix/ui";
import {
  AlertTriangle,
  Building,
  Copy,
  Edit2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import ApartmentCustomFields from "@/components/apartment/ApartmentCustomFields";
import ApartmentSyncDialog from "@/components/apartment/ApartmentSyncDialog";
import ProjectApartmentsExcelSyncDialog from "@/components/projects/ProjectApartmentsExcelSyncDialog";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import type { Json } from "@gridix/types/database";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { useProjectInEditorScope } from "@/features/projectEditor/hooks/useProjectInEditorScope";
import { ADMIN_THEME, cn, getCurrencySymbolSafe } from "@gridix/utils/lib";
import { trackUsertourEvent } from "@gridix/utils/integrations";
import {
  AdminApartmentFilters,
  type ApartmentStatusFilter,
} from "@/components/projects/AdminApartmentFilters";

interface ProjectApartmentsManagerProps {
  projectId: string;
  projectType?: "building" | "object" | null;
}

// Helper function to convert our polygon type to database type
const convertPolygonToDb = (polygon: { x: number; y: number }[]): Json => {
  return polygon as Json;
};

const ProjectApartmentsManager = ({
  projectId,
  projectType,
}: ProjectApartmentsManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null,
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<ApartmentStatusFilter>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 0]);
  const [customFieldsData, setCustomFieldsData] = useState<
    Record<string, unknown>
  >({});
  const [currentType, setCurrentType] = useState<
    "apartment" | "commercial" | "parking"
  >("apartment");
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSourceApartment, setSyncSourceApartment] =
    useState<Apartment | null>(null);
  const [syncTargetApartments, setSyncTargetApartments] = useState<Apartment[]>(
    [],
  );
  const [floorManagementOpen, setFloorManagementOpen] = useState(false);
  const [excelSyncDialogOpen, setExcelSyncDialogOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(1);
  const { t } = useLanguage();
  const { project } = useProjectInEditorScope(projectId);
  const editorData = useProjectEditorDataContext();

  const [newApartment, setNewApartment] = useState<Partial<Apartment>>({
    apartment_number: "",
    floor_number: 1,
    rooms: 0,
    area: 0,
    price: null,
    status: "available",
    type: "apartment",
    polygon: [],
    custom_fields: {},
  });

  const loadApartments = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId)
        .order("apartment_number");

      if (error) throw error;

      const formattedApartments = (data ?? []).map(normalizeApartmentData);
      setApartments(formattedApartments);
    } catch (error) {
      console.error("Error loading apartments:", error);
      toast.error(t("apartmentsManager.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

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
      const formatted = editorData.data.apartments.map(normalizeApartmentData);
      setApartments(formatted);
      setLoading(false);
      return;
    }
    loadApartments();
  }, [editorData, editorData?.data?.apartments, loadApartments]);

  useEffect(() => {
    // Update newApartment type when currentType changes
    setNewApartment((prev) => ({ ...prev, type: currentType }));
  }, [currentType]);

  const { minPrice, maxPrice, minArea, maxArea } = useMemo(() => {
    const prices = apartments
      .filter((a) => a.price !== null && a.price > 0)
      .map((a) => a.price as number);
    const areas = apartments.filter((a) => a.area > 0).map((a) => a.area);
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      minArea: areas.length ? Math.min(...areas) : 0,
      maxArea: areas.length ? Math.max(...areas) : 0,
    };
  }, [apartments]);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setAreaRange([minArea, maxArea]);
  }, [minArea, maxArea]);

  const currencySymbol = getCurrencySymbolSafe(project?.currency ?? "USD");

  useEffect(() => {
    const filtered = apartments.filter((apartment) => {
      const matchesType = apartment.type === currentType;

      const matchesFloor =
        selectedFloor === null || apartment.floor_number === selectedFloor;

      const matchesRooms =
        selectedRooms === null || String(apartment.rooms) === selectedRooms;

      const matchesStatus =
        selectedStatus === "all" || apartment.status === selectedStatus;

      const matchesPrice =
        (priceRange[0] === minPrice && priceRange[1] === maxPrice) ||
        (apartment.price !== null &&
          apartment.price >= priceRange[0] &&
          apartment.price <= priceRange[1]);

      const matchesArea =
        (areaRange[0] === minArea && areaRange[1] === maxArea) ||
        (apartment.area >= areaRange[0] && apartment.area <= areaRange[1]);

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        apartment.apartment_number.toLowerCase().includes(searchLower) ||
        apartment.status.toLowerCase().includes(searchLower) ||
        apartment.area.toString().includes(searchTerm) ||
        (apartment.price !== null &&
          apartment.price.toString().includes(searchTerm));

      return (
        matchesType &&
        matchesFloor &&
        matchesRooms &&
        matchesStatus &&
        matchesPrice &&
        matchesArea &&
        matchesSearch
      );
    });
    setFilteredApartments(filtered);
  }, [
    apartments,
    searchTerm,
    currentType,
    selectedFloor,
    selectedRooms,
    selectedStatus,
    priceRange,
    areaRange,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
  ]);

  const handleSaveApartment = async (
    apartmentData: Partial<Apartment>,
    isNew: boolean = false,
  ) => {
    if (!apartmentData.apartment_number?.trim()) {
      toast.error(t("apartmentsManager.numberRequired"));

      return;
    }

    if (
      apartmentData.floor_number === undefined ||
      apartmentData.floor_number < 0
    ) {
      toast.error(t("apartmentsManager.floorRequired"));
      return;
    }

    const isFirstApartmentForProject = isNew && apartments.length === 0;

    try {
      const saveData = {
        apartment_number: apartmentData.apartment_number.trim(),
        floor_number: apartmentData.floor_number,
        rooms:
          currentType === "apartment"
            ? String(apartmentData.rooms || 0)
            : currentType,
        area: apartmentData.area || 0,
        price: apartmentData.price ?? null,
        status: apartmentData.status || "available",
        polygon: convertPolygonToDb(apartmentData.polygon || []),
        custom_fields: customFieldsData as Json,
        project_id: projectId,
        updated_at: new Date().toISOString(),
        type: currentType,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("apartments")
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;

        // Use normalizeApartmentData to ensure proper type casting
        const newApt = normalizeApartmentData(data);
        setApartments((prev) => [...prev, newApt]);
        setIsAddingNew(false);
        setNewApartment({
          apartment_number: "",
          floor_number: 1,
          rooms: 0,
          area: 0,
          price: null,
          status: "available",
          polygon: [],
          custom_fields: {},
        });
        toast.success(t("apartmentsManager.saveSuccess"));

        if (isFirstApartmentForProject) {
          void trackUsertourEvent({
            eventName: "gridix_project_first_apartment_created",
            properties: { project_id: projectId, apartment_id: newApt.id },
            onceKey: "gridix_project_first_apartment_created",
          });
        }
      } else if (editingApartment) {
        const { data, error } = await supabase
          .from("apartments")
          .update(saveData)
          .eq("id", editingApartment.id)
          .select()
          .single();

        if (error) throw error;

        // Use normalizeApartmentData to ensure proper type casting
        const updatedApt = normalizeApartmentData(data);
        setApartments((prev) =>
          prev.map((apt) =>
            apt.id === editingApartment.id ? updatedApt : apt,
          ),
        );
        setEditingApartment(null);
        toast.success(t("apartmentsManager.updateSuccess"));
      }

      setCustomFieldsData({});
    } catch (error) {
      console.error("Error saving apartment:", error);
      toast.error(t("apartmentsManager.saveError"));
    }
  };

  const handleDeleteApartment = async (apartmentId: string) => {
    if (!confirm(t("apartmentsManager.deleteConfirm"))) return;

    try {
      const { error } = await supabase
        .from("apartments")
        .delete()
        .eq("id", apartmentId);

      if (error) throw error;

      setApartments((prev) => prev.filter((apt) => apt.id !== apartmentId));
      toast.success(t("apartmentsManager.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting apartment:", error);
      toast.error(t("apartmentsManager.deleteError"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "available":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sold":
        return t("apartmentsManager.sold");
      case "reserved":
        return t("apartmentsManager.reserved");
      case "available":
        return t("apartmentsManager.available");
      default:
        return status;
    }
  };

  const openSyncDialog = (sourceApartment: Apartment) => {
    // Найти все квартиры с такой же площадью и количеством комнат
    const targetApartments = apartments.filter(
      (apt) =>
        apt.id !== sourceApartment.id &&
        apt.area === sourceApartment.area &&
        apt.rooms === sourceApartment.rooms &&
        apt.type === sourceApartment.type,
    );

    if (targetApartments.length === 0) {
      toast.error(t("apartmentsManager.syncError"));
      return;
    }

    setSyncSourceApartment(sourceApartment);
    setSyncTargetApartments(targetApartments);
    setSyncDialogOpen(true);
  };

  const handleSyncComplete = (updatedApartments: Apartment[]) => {
    // Обновить локальное состояние
    setApartments((prev) =>
      prev.map((apt) => {
        const updated = updatedApartments.find(
          (updApt) => updApt.id === apt.id,
        );
        return updated || apt;
      }),
    );

    // Сбросить состояние диалога
    setSyncSourceApartment(null);
    setSyncTargetApartments([]);
  };

  const handleDuplicateApartment = async (apartment: Apartment) => {
    try {
      // Генерируем новый номер квартиры с префиксом "Копия"
      const duplicateNumber = `Copy ${apartment.apartment_number}`;

      // Проверяем, существует ли уже квартира с таким номером
      let finalNumber = duplicateNumber;
      let counter = 1;
      while (apartments.some((apt) => apt.apartment_number === finalNumber)) {
        finalNumber = `${duplicateNumber} (${counter})`;
        counter++;
      }

      const duplicateData = {
        apartment_number: finalNumber,
        floor_number: apartment.floor_number,
        rooms: String(apartment.rooms),
        area: apartment.area,
        price: apartment.price,
        status: apartment.status,
        polygon: convertPolygonToDb(apartment.polygon || []),
        custom_fields: apartment.custom_fields as Json,
        project_id: projectId,
        type: apartment.type,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("apartments")
        .insert(duplicateData)
        .select()
        .single();

      if (error) throw error;

      // Добавляем новую квартиру в локальное состояние
      const newApt = normalizeApartmentData(data);
      setApartments((prev) => [...prev, newApt]);

      toast.success(`Квартира продублирована как "${finalNumber}"`);
    } catch (error) {
      console.error("Error duplicating apartment:", error);
      toast.error("Ошибка при дублировании квартиры");
    }
  };

  const getUniqueFloors = useCallback(() => {
    return [...new Set(apartments.map((apt) => apt.floor_number))].sort(
      (a, b) => a - b,
    );
  }, [apartments]);

  const getUniqueRooms = useCallback(() => {
    const rooms = apartments
      .filter((apt) => apt.type === "apartment")
      .map((apt) => apt.rooms);
    const unique = [...new Set(rooms.map(String))];
    const numeric = unique
      .filter((r) => r !== "free_layout" && !isNaN(Number(r)))
      .map(Number)
      .sort((a, b) => a - b)
      .map(String);
    if (unique.includes("free_layout")) numeric.push("free_layout");
    return numeric;
  }, [apartments]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedFloor(null);
    setSelectedRooms(null);
    setSelectedStatus("all");
    setPriceRange([minPrice, maxPrice]);
    setAreaRange([minArea, maxArea]);
  }, [minPrice, maxPrice, minArea, maxArea]);

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedFloor !== null ||
    selectedRooms !== null ||
    selectedStatus !== "all" ||
    priceRange[0] !== minPrice ||
    priceRange[1] !== maxPrice ||
    areaRange[0] !== minArea ||
    areaRange[1] !== maxArea;

  const handleDeleteFloor = async (floorNumber: number) => {
    const apartmentsOnFloor = apartments.filter(
      (apt) => apt.floor_number === floorNumber,
    );

    if (apartmentsOnFloor.length > 0) {
      if (
        !confirm(
          t("floorManagement.deleteFloorWithApartmentsConfirm", {
            floor: floorNumber,
            count: apartmentsOnFloor.length,
          }),
        )
      ) {
        return;
      }
    } else {
      if (
        !confirm(
          t("floorManagement.deleteFloorConfirm", { floor: floorNumber }),
        )
      ) {
        return;
      }
    }

    try {
      // Delete all apartments on this floor
      if (apartmentsOnFloor.length > 0) {
        const { error: apartmentsError } = await supabase
          .from("apartments")
          .delete()
          .eq("project_id", projectId)
          .eq("floor_number", floorNumber);

        if (apartmentsError) throw apartmentsError;
      }

      // Delete building floor visualization
      const { error: buildingFloorError } = await supabase
        .from("building_floors")
        .delete()
        .eq("project_id", projectId)
        .eq("floor_number", floorNumber);

      if (buildingFloorError) throw buildingFloorError;

      // Delete floor plan
      const { error: floorPlanError } = await supabase
        .from("floor_plans")
        .delete()
        .eq("project_id", projectId)
        .eq("floor_number", floorNumber);

      if (floorPlanError) throw floorPlanError;

      // Update project floors count if this was the highest floor
      const maxFloor = Math.max(
        ...getUniqueFloors().filter((f) => f !== floorNumber),
      );
      if (project && floorNumber === project.floors) {
        const { error: projectError } = await supabase
          .from("projects")
          .update({ floors: maxFloor || 1 })
          .eq("id", projectId);

        if (projectError) throw projectError;
      }

      // Update local state
      setApartments((prev) =>
        prev.filter((apt) => apt.floor_number !== floorNumber),
      );

      toast.success(
        t("floorManagement.deleteFloorSuccess", { floor: floorNumber }),
      );
    } catch (error) {
      console.error("Error deleting floor:", error);
      toast.error(t("floorManagement.deleteFloorError"));
    }
  };

  const handleAddFloor = async () => {
    if (newFloorNumber === undefined || newFloorNumber < 0) {
      toast.error(t("floorManagement.invalidFloorNumber"));
      return;
    }

    const existingFloors = getUniqueFloors();
    if (existingFloors.includes(newFloorNumber)) {
      toast.error(
        t("floorManagement.floorAlreadyExists", { floor: newFloorNumber }),
      );
      return;
    }

    try {
      // Create building floor for visualization
      const { error: buildingFloorError } = await supabase
        .from("building_floors")
        .insert({
          project_id: projectId,
          floor_number: newFloorNumber,
          polygon: [],
          color: "#3b82f6",
        });

      if (buildingFloorError) throw buildingFloorError;

      // Update project floors count if this is higher than current max
      const maxFloor = Math.max(...existingFloors, newFloorNumber);
      if (project && maxFloor > project.floors) {
        const { error: projectError } = await supabase
          .from("projects")
          .update({ floors: maxFloor })
          .eq("id", projectId);

        if (projectError) throw projectError;
      }

      setNewFloorNumber(maxFloor + 1);
      toast.success(
        t("floorManagement.addFloorSuccess", { floor: newFloorNumber }),
      );
    } catch (error) {
      console.error("Error adding floor:", error);
      toast.error(t("floorManagement.addFloorError"));
    }
  };

  const renderApartmentForm = (
    apartment: Partial<Apartment>,
    isNew: boolean = false,
  ) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="apartment_number">
            {projectType === "object"
              ? "Object Number *"
              : currentType === "apartment"
                ? t("apartmentsManager.apartmentNumber")
                : t("apartmentsManager.name")}
          </Label>
          <Input
            id="apartment_number"
            value={apartment.apartment_number || ""}
            onChange={(e) => {
              if (isNew) {
                setNewApartment((prev) => ({
                  ...prev,
                  apartment_number: e.target.value,
                }));
              } else {
                setEditingApartment((prev) =>
                  prev ? { ...prev, apartment_number: e.target.value } : null,
                );
              }
            }}
          />
        </div>
        {projectType !== "object" && (
          <div>
            <Label htmlFor="floor_number">
              {t("apartmentsManager.floorNumber")}
            </Label>
            <Input
              id="floor_number"
              type="number"
              value={apartment.floor_number}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (isNew) {
                  setNewApartment((prev) => ({ ...prev, floor_number: value }));
                } else {
                  setEditingApartment((prev) =>
                    prev ? { ...prev, floor_number: value } : null,
                  );
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {currentType === "apartment" && (
          <div>
            <Label htmlFor="rooms">{t("apartmentsManager.rooms")}</Label>
            <Select
              value={apartment.rooms?.toString() || "0"}
              onValueChange={(value) => {
                const roomsValue = value || 0;
                if (isNew) {
                  setNewApartment((prev) => ({ ...prev, rooms: roomsValue }));
                } else {
                  setEditingApartment((prev) =>
                    prev ? { ...prev, rooms: roomsValue } : null,
                  );
                }
              }}
            >
              <SelectTrigger id="rooms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("apartment.studio")}</SelectItem>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
                <SelectItem value="free_layout">
                  {t("apartment.freeLayout")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="area">{t("apartmentsManager.area")}</Label>
          <Input
            id="area"
            type="number"
            step="0.1"
            value={apartment.area || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              if (isNew) {
                setNewApartment((prev) => ({ ...prev, area: value }));
              } else {
                setEditingApartment((prev) =>
                  prev ? { ...prev, area: value } : null,
                );
              }
            }}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="price">{t("apartmentsManager.price")}</Label>
          <Input
            id="price"
            type="number"
            value={apartment.price || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              if (isNew) {
                setNewApartment((prev) => ({ ...prev, price: value }));
              } else {
                setEditingApartment((prev) =>
                  prev ? { ...prev, price: value } : null,
                );
              }
            }}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="status">{t("apartmentsManager.status")}</Label>
          <Select
            value={apartment.status ?? "available"}
            onValueChange={(value: string) => {
              const validStatus = ["available", "sold", "reserved"].includes(
                value,
              )
                ? (value as "available" | "sold" | "reserved")
                : "available";
              if (isNew) {
                setNewApartment((prev) => ({ ...prev, status: validStatus }));
              } else {
                setEditingApartment((prev) =>
                  prev ? { ...prev, status: validStatus } : null,
                );
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">
                {t("apartmentsManager.available")}
              </SelectItem>
              <SelectItem value="reserved">
                {t("apartmentsManager.reserved")}
              </SelectItem>
              <SelectItem value="sold">
                {t("apartmentsManager.sold")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentType !== "parking" && (
        <ApartmentCustomFields
          projectId={projectId}
          apartmentId={apartment.id ?? ""}
          customFieldsData={customFieldsData}
          onCustomFieldsChange={setCustomFieldsData}
        />
      )}

      <div className="flex gap-2 border-t pt-4">
        <Button
          style={{ backgroundColor: ADMIN_THEME.primary }}
          onClick={() => handleSaveApartment(apartment, isNew)}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {t("apartmentsManager.save")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (isNew) {
              setIsAddingNew(false);
              setNewApartment({
                apartment_number: "",
                floor_number: 1,
                rooms: 1,
                area: 0,
                price: null,
                status: "available",
                polygon: [],
                custom_fields: {},
              });
            } else {
              setEditingApartment(null);
            }
            setCustomFieldsData({});
          }}
        >
          <X className="mr-2 h-4 w-4" />
          {t("apartmentsManager.cancel")}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 text-center">{t("apartmentsManager.loading")}</div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>{t("apartmentsManager.title")}</CardTitle>
            <CardDescription>
              {t("apartmentsManager.description")}
            </CardDescription>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setExcelSyncDialogOpen(true)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t("excel.sync.button")}
            </Button>
            {projectType !== "object" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFloorManagementOpen(true)}
              >
                <Building className="mr-2 h-4 w-4" />
                {t("floorManagement.manageFloors")}
              </Button>
            )}
            <Button
              style={{ backgroundColor: ADMIN_THEME.primary }}
              onClick={() => setIsAddingNew(true)}
              className="w-full bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {projectType === "object"
                ? t("buildingImage.object.addNew")
                : t("apartmentsManager.addApartment")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminApartmentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          selectedRooms={selectedRooms}
          setSelectedRooms={setSelectedRooms}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          areaRange={areaRange}
          setAreaRange={setAreaRange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minArea={minArea}
          maxArea={maxArea}
          uniqueFloors={getUniqueFloors()}
          uniqueRooms={getUniqueRooms()}
          projectType={projectType}
          currentType={currentType}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          currencySymbol={currencySymbol}
        />

        {/* Type selector tabs */}
        {(project?.has_commercial || project?.has_parking) && (
          <Tabs
            value={currentType}
            onValueChange={(value) =>
              setCurrentType(value as "apartment" | "commercial" | "parking")
            }
          >
            <TabsList className="flex w-full">
              <TabsTrigger className="w-full" value="apartment">
                {t("apartmentsManager.typeApartment")}
              </TabsTrigger>
              {project?.has_commercial && (
                <TabsTrigger className="w-full" value="commercial">
                  {t("apartmentsManager.typeCommercial")}
                </TabsTrigger>
              )}
              {project?.has_parking && (
                <TabsTrigger className="w-full" value="parking">
                  {t("apartmentsManager.typeParking")}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}

        {/* Форма добавления новой квартиры */}
        {isAddingNew && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("apartmentsManager.newApartment")}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderApartmentForm(newApartment, true)}</CardContent>
          </Card>
        )}

        {/* Список существующих квартир */}
        <div className="space-y-4">
          {(() => {
            // Group apartments by floor
            const groupedByFloor = filteredApartments.reduce(
              (acc, apartment) => {
                const floor = apartment.floor_number;
                if (!acc[floor]) {
                  acc[floor] = [];
                }
                acc[floor].push(apartment);
                return acc;
              },
              {} as Record<number, Apartment[]>,
            );

            // Sort floors in descending order (highest first)
            const sortedFloors = Object.keys(groupedByFloor)
              .map(Number)
              .sort((a, b) => b - a);

            if (sortedFloors.length === 0) {
              return null;
            }

            return sortedFloors.map((floorNumber) => {
              const floorApartments = groupedByFloor[floorNumber];
              if (!floorApartments || floorApartments.length === 0) {
                return null;
              }

              return (
                <div key={floorNumber} className="space-y-2">
                  {/* Floor header */}
                  {projectType !== "object" && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-4">
                        <span className="text-lg font-semibold text-gray-700">
                          {t("apartmentsManager.floor", { floor: floorNumber })}
                        </span>
                      </div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  {/* Apartments on this floor */}
                  {floorApartments.map((apartment) => (
                    <Card key={apartment.id} className="relative">
                      {editingApartment?.id === apartment.id ? (
                        <CardContent className="p-4">
                          {renderApartmentForm(editingApartment)}
                        </CardContent>
                      ) : (
                        <CardContent className="relative p-4 pt-8 sm:pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-1 flex-col items-center gap-3 sm:flex-row">
                              <div className="flex items-center gap-4 max-sm:w-full">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 sm:min-w-[300px]">
                                    <h3 className="min-w-[150px] text-lg font-semibold">
                                      {projectType === "object"
                                        ? t(
                                            "buildingImage.object.objectNumber",
                                            {
                                              number:
                                                apartment.apartment_number,
                                            },
                                          )
                                        : currentType === "apartment"
                                          ? t("apartmentsManager.apartment", {
                                              number:
                                                apartment.apartment_number,
                                            })
                                          : apartment.apartment_number}
                                    </h3>
                                    <Badge
                                      className={cn(
                                        getStatusColor(apartment.status),
                                        "max-sm:absolute max-sm:left-2 max-sm:top-2",
                                      )}
                                    >
                                      {getStatusLabel(apartment.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {projectType !== "object" && (
                                      <>
                                        {t("apartmentsManager.floor", {
                                          floor: apartment.floor_number,
                                        })}{" "}
                                        •
                                      </>
                                    )}
                                    {apartment.type === "apartment"
                                      ? apartment.rooms == 0
                                        ? t("apartment.studio")
                                        : apartment.rooms === "free_layout"
                                          ? t("apartment.freeLayout")
                                          : t("apartmentsManager.roomsShort", {
                                              rooms: apartment.rooms,
                                            })
                                      : apartment.type === "commercial"
                                        ? t("apartmentsManager.typeCommercial")
                                        : t("apartmentsManager.typeParking")}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 lg:flex-row">
                                  <div className="text-sm">
                                    <span className="text-gray-600">
                                      {t("apartmentsManager.area")}:{" "}
                                    </span>
                                    <span>
                                      {t("apartmentsManager.areaValue", {
                                        area: apartment.area,
                                      })}
                                    </span>
                                  </div>
                                  {apartment.price && (
                                    <div className="text-sm">
                                      <span className="text-gray-600">
                                        {t("apartmentsManager.price")}:{" "}
                                      </span>
                                      <span>
                                        {t("apartmentsManager.priceValue", {
                                          price:
                                            apartment.price.toLocaleString(),
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="grid shrink-0 grid-cols-4 gap-2 max-sm:w-full sm:ml-auto sm:grid-cols-2 lg:grid-cols-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDuplicateApartment(apartment)
                                  }
                                  title="Дублировать квартиру"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSyncDialog(apartment)}
                                  title="Синхронизировать данные с квартирами той же площади и планировки"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingApartment(apartment);
                                    // Загружаем кастомные поля для редактирования
                                    if (
                                      apartment.custom_fields &&
                                      typeof apartment.custom_fields ===
                                        "object"
                                    ) {
                                      setCustomFieldsData(
                                        apartment.custom_fields as Record<
                                          string,
                                          unknown
                                        >,
                                      );
                                    }
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteApartment(apartment.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              );
            });
          })()}
        </div>

        {filteredApartments.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            {searchTerm ? (
              <p>{t("apartmentsManager.noSearchResults")}</p>
            ) : (
              <>
                <p>{t("apartmentsManager.noApartments")}</p>
                <p className="text-sm">
                  {t("apartmentsManager.noApartmentsDesc")}
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Диалог синхронизации */}
      <ApartmentSyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        sourceApartment={syncSourceApartment}
        targetApartments={syncTargetApartments}
        onSyncComplete={handleSyncComplete}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      {/* Диалог синхронизации через Excel */}
      <ProjectApartmentsExcelSyncDialog
        open={excelSyncDialogOpen}
        onClose={() => setExcelSyncDialogOpen(false)}
        projectId={projectId}
        projectType={projectType ?? null}
        onSyncDone={() => {
          if (editorData) {
            void editorData.refresh();
            return;
          }
          loadApartments();
        }}
      />

      {/* Диалог управления этажами */}
      <Dialog open={floorManagementOpen} onOpenChange={setFloorManagementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("floorManagement.title")}</DialogTitle>
            <DialogDescription>
              {t("floorManagement.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Добавление этажа */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {t("floorManagement.addFloor")}
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(parseInt(e.target.value))}
                  placeholder={t("floorManagement.floorNumber")}
                  className="flex-1"
                />
                <Button onClick={handleAddFloor}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("floorManagement.add")}
                </Button>
              </div>
            </div>

            {/* Список существующих этажей */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {t("floorManagement.existingFloors")}
              </h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {getUniqueFloors().map((floorNumber) => {
                  const apartmentsOnFloor = apartments.filter(
                    (apt) => apt.floor_number === floorNumber,
                  );
                  return (
                    <div
                      key={floorNumber}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="font-medium">
                            {t("floorManagement.floor")} {floorNumber}
                          </span>
                          <p className="text-sm text-gray-500">
                            {apartmentsOnFloor.length}{" "}
                            {apartmentsOnFloor.length === 1
                              ? t("floorManagement.apartment")
                              : t("floorManagement.apartments")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFloor(floorNumber)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {apartmentsOnFloor.length > 0 && (
                          <AlertTriangle className="mr-1 h-4 w-4" />
                        )}
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {getUniqueFloors().length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <Building className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p>{t("floorManagement.noFloors")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectApartmentsManager;
