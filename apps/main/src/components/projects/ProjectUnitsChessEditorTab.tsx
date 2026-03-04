import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  UnitsChessboard,
} from "@gridix/ui";
import {
  AlertTriangle,
  Building,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import type { Json } from "@gridix/types/database";
import ApartmentEditorForm from "@/components/projects/ApartmentEditorForm";
import ProjectApartmentsExcelSyncDialog from "@/components/projects/ProjectApartmentsExcelSyncDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  normalizeApartmentData,
  type Apartment,
} from "@/entities/apartment/model/types";

interface ProjectUnitsChessEditorTabProps {
  projectId: string;
}

type UnitStatusGroup = "available" | "booked" | "sold";

const convertPolygonToDb = (polygon: { x: number; y: number }[]): Json => {
  return polygon;
};

const getUnitStatusGroup = (status: string | null): UnitStatusGroup => {
  const st = String(status ?? "").toLowerCase();
  if (st === "available") return "available";
  if (st === "reserved" || st === "booked") return "booked";
  return "sold";
};

const toApartmentType = (
  type: Apartment["type"] | undefined,
): Apartment["type"] => {
  if (type === "commercial" || type === "parking" || type === "apartment") {
    return type;
  }
  return "apartment";
};

const NEW_APARTMENT_TEMPLATE: Partial<Apartment> = {
  apartment_number: "",
  floor_number: 1,
  rooms: 0,
  area: 0,
  price: null,
  status: "available",
  type: "apartment",
  polygon: [],
  custom_fields: {},
};

const ProjectUnitsChessEditorTab = ({
  projectId,
}: ProjectUnitsChessEditorTabProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null,
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [excelSyncDialogOpen, setExcelSyncDialogOpen] = useState(false);
  const [floorManagementOpen, setFloorManagementOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(1);
  const [customFieldsData, setCustomFieldsData] = useState<
    Record<string, unknown>
  >({});
  const [newApartment, setNewApartment] = useState<Partial<Apartment>>(
    NEW_APARTMENT_TEMPLATE,
  );

  const loadApartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      setApartments((data ?? []).map(normalizeApartmentData));
    } catch (error) {
      console.error("Error loading units:", error);
      toast.error(t("apartmentsManager.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    void loadApartments();
  }, [loadApartments]);

  const apartmentsByFloor = useMemo(() => {
    const map = new Map<number, Apartment[]>();
    for (const apartment of apartments) {
      const list = map.get(apartment.floor_number) ?? [];
      list.push(apartment);
      map.set(apartment.floor_number, list);
    }
    return map;
  }, [apartments]);

  const uniqueFloors = useMemo(
    () => Array.from(apartmentsByFloor.keys()).sort((a, b) => a - b),
    [apartmentsByFloor],
  );

  const openEditor = (apartment: Apartment) => {
    setEditingApartment(apartment);
    if (
      apartment.custom_fields &&
      typeof apartment.custom_fields === "object"
    ) {
      setCustomFieldsData(apartment.custom_fields as Record<string, unknown>);
      return;
    }
    setCustomFieldsData({});
  };

  const handleSave = async () => {
    if (!editingApartment) return;
    if (!editingApartment.apartment_number?.trim()) {
      toast.error(t("apartmentsManager.numberRequired"));
      return;
    }
    if (
      editingApartment.floor_number === undefined ||
      editingApartment.floor_number < 0
    ) {
      toast.error(t("apartmentsManager.floorRequired"));
      return;
    }

    try {
      const saveData = {
        apartment_number: editingApartment.apartment_number.trim(),
        floor_number: editingApartment.floor_number,
        rooms:
          editingApartment.type === "apartment"
            ? String(editingApartment.rooms || 0)
            : editingApartment.type,
        area: editingApartment.area || 0,
        price: editingApartment.price ?? null,
        status: editingApartment.status || "available",
        polygon: convertPolygonToDb(editingApartment.polygon || []),
        custom_fields: customFieldsData as Json,
        updated_at: new Date().toISOString(),
        type: editingApartment.type,
      };

      const { data, error } = await supabase
        .from("apartments")
        .update(saveData)
        .eq("id", editingApartment.id)
        .select()
        .single();

      if (error) throw error;

      const updated = normalizeApartmentData(data);
      setApartments((prev) =>
        prev.map((apt) => (apt.id === updated.id ? updated : apt)),
      );
      setEditingApartment(updated);
      toast.success(t("apartmentsManager.updateSuccess"));
    } catch (error) {
      console.error("Error saving apartment:", error);
      toast.error(t("apartmentsManager.saveError"));
    }
  };

  const handleSaveNew = async () => {
    if (!newApartment.apartment_number?.trim()) {
      toast.error(t("apartmentsManager.numberRequired"));
      return;
    }
    if (
      newApartment.floor_number === undefined ||
      newApartment.floor_number < 0
    ) {
      toast.error(t("apartmentsManager.floorRequired"));
      return;
    }

    try {
      const saveData = {
        apartment_number: newApartment.apartment_number.trim(),
        floor_number: newApartment.floor_number,
        rooms: String(newApartment.rooms || 0),
        area: newApartment.area || 0,
        price: newApartment.price ?? null,
        status: newApartment.status || "available",
        polygon: convertPolygonToDb(newApartment.polygon || []),
        custom_fields: customFieldsData as Json,
        project_id: projectId,
        updated_at: new Date().toISOString(),
        type: toApartmentType(newApartment.type),
      };

      const { data, error } = await supabase
        .from("apartments")
        .insert(saveData)
        .select()
        .single();
      if (error) throw error;

      const created = normalizeApartmentData(data);
      setApartments((prev) => [...prev, created]);
      setIsAddingNew(false);
      setEditingApartment(created);
      setCustomFieldsData({});
      setNewApartment(NEW_APARTMENT_TEMPLATE);
      toast.success(t("apartmentsManager.saveSuccess"));
    } catch (error) {
      console.error("Error creating apartment:", error);
      toast.error(t("apartmentsManager.saveError"));
    }
  };

  const handleDeleteFloor = async (floorNumber: number) => {
    const apartmentsOnFloor = apartmentsByFloor.get(floorNumber) ?? [];

    if (
      apartmentsOnFloor.length > 0 &&
      !confirm(
        t("floorManagement.deleteFloorWithApartmentsConfirm", {
          floor: floorNumber,
          count: apartmentsOnFloor.length,
        }),
      )
    ) {
      return;
    }
    if (
      apartmentsOnFloor.length === 0 &&
      !confirm(t("floorManagement.deleteFloorConfirm", { floor: floorNumber }))
    ) {
      return;
    }

    try {
      if (apartmentsOnFloor.length > 0) {
        const { error: apartmentsError } = await supabase
          .from("apartments")
          .delete()
          .eq("project_id", projectId)
          .eq("floor_number", floorNumber);
        if (apartmentsError) throw apartmentsError;
      }

      const [buildingFloorsResult, floorPlansResult] = await Promise.all([
        supabase
          .from("building_floors")
          .delete()
          .eq("project_id", projectId)
          .eq("floor_number", floorNumber),
        supabase
          .from("floor_plans")
          .delete()
          .eq("project_id", projectId)
          .eq("floor_number", floorNumber),
      ]);

      if (buildingFloorsResult.error) throw buildingFloorsResult.error;
      if (floorPlansResult.error) throw floorPlansResult.error;

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
    if (newFloorNumber < 0) {
      toast.error(t("floorManagement.invalidFloorNumber"));
      return;
    }
    if (uniqueFloors.includes(newFloorNumber)) {
      toast.error(
        t("floorManagement.floorAlreadyExists", { floor: newFloorNumber }),
      );
      return;
    }
    try {
      const { error } = await supabase.from("building_floors").insert({
        project_id: projectId,
        floor_number: newFloorNumber,
        polygon: [],
        color: "#3b82f6",
      });
      if (error) throw error;
      toast.success(
        t("floorManagement.addFloorSuccess", { floor: newFloorNumber }),
      );
      setNewFloorNumber(newFloorNumber + 1);
    } catch (error) {
      console.error("Error adding floor:", error);
      toast.error(t("floorManagement.addFloorError"));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h3 className="text-4 font-semibold text-slate-900">
          {t("apartmentsManager.title")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("apartmentsManager.description")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setExcelSyncDialogOpen(true)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t("excel.sync.button")}
        </Button>
        <Button variant="outline" onClick={() => setFloorManagementOpen(true)}>
          <Building className="mr-2 h-4 w-4" />
          {t("floorManagement.manageFloors")}
        </Button>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("apartmentsManager.addApartment")}
        </Button>
      </div>

      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>{t("apartmentsManager.newApartment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ApartmentEditorForm
              apartment={newApartment}
              projectId={projectId}
              projectType="building"
              currentType="apartment"
              customFieldsData={customFieldsData}
              onCustomFieldsChange={setCustomFieldsData}
              onApartmentChange={setNewApartment}
              onSave={() => void handleSaveNew()}
              onCancel={() => {
                setIsAddingNew(false);
                setCustomFieldsData({});
              }}
            />
          </CardContent>
        </Card>
      )}

      <UnitsChessboard
        units={apartments}
        loading={loading}
        loadingText={t("apartmentsManager.loading")}
        emptyText={t("apartmentsManager.noApartments")}
        labels={{
          available: t("common.drawer.units.legend.available"),
          booked: t("common.drawer.units.legend.booked"),
          sold: t("common.drawer.units.legend.sold"),
        }}
        selectedUnitId={editingApartment?.id ?? null}
        onUnitClick={openEditor}
        getUnitStatusGroup={getUnitStatusGroup}
      />

      {editingApartment && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("apartmentsManager.apartment", {
                number: editingApartment.apartment_number,
              })}
            </CardTitle>
            <CardDescription>
              {t("apartmentsManager.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApartmentEditorForm
              apartment={editingApartment}
              projectId={projectId}
              projectType="building"
              currentType={editingApartment.type}
              customFieldsData={customFieldsData}
              onCustomFieldsChange={setCustomFieldsData}
              onApartmentChange={(value) =>
                setEditingApartment(value as Apartment)
              }
              onSave={() => void handleSave()}
              onCancel={() => {
                setEditingApartment(null);
                setCustomFieldsData({});
              }}
            />
          </CardContent>
        </Card>
      )}

      <ProjectApartmentsExcelSyncDialog
        open={excelSyncDialogOpen}
        onClose={() => setExcelSyncDialogOpen(false)}
        projectId={projectId}
        projectType="building"
        onSyncDone={() => void loadApartments()}
      />

      <Dialog open={floorManagementOpen} onOpenChange={setFloorManagementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("floorManagement.title")}</DialogTitle>
            <DialogDescription>
              {t("floorManagement.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {t("floorManagement.addFloor")}
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={newFloorNumber}
                  onChange={(e) =>
                    setNewFloorNumber(parseInt(e.target.value, 10) || 0)
                  }
                  placeholder={t("floorManagement.floorNumber")}
                  className="flex-1"
                />
                <Button onClick={handleAddFloor}>
                  {t("floorManagement.add")}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {t("floorManagement.existingFloors")}
              </h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {uniqueFloors.map((floorNumber) => {
                  const apartmentsOnFloor =
                    apartmentsByFloor.get(floorNumber) ?? [];
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
                        onClick={() => void handleDeleteFloor(floorNumber)}
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
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectUnitsChessEditorTab;
