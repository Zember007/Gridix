import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Save, X } from "lucide-react";
import ApartmentCustomFields from "@/entities/apartment/ui/ApartmentCustomFields";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Apartment } from "@/entities/apartment/model/types";
import { ADMIN_THEME } from "@gridix/utils/lib";

type ApartmentType = "apartment" | "commercial" | "parking";
type ApartmentStatus = Apartment["status"];

interface ApartmentEditorFormProps {
  apartment: Partial<Apartment>;
  projectId: string;
  projectType?: "building" | "object" | null;
  currentType: ApartmentType;
  customFieldsData: Record<string, unknown>;
  onCustomFieldsChange: (value: Record<string, unknown>) => void;
  onApartmentChange: (value: Partial<Apartment>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const toApartmentStatus = (value: string): ApartmentStatus => {
  if (value === "available" || value === "sold" || value === "reserved") {
    return value;
  }
  return "available";
};

const ApartmentEditorForm = ({
  apartment,
  projectId,
  projectType,
  currentType,
  customFieldsData,
  onCustomFieldsChange,
  onApartmentChange,
  onSave,
  onCancel,
}: ApartmentEditorFormProps) => {
  const { t } = useLanguage();

  return (
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
            onChange={(e) =>
              onApartmentChange({
                ...apartment,
                apartment_number: e.target.value,
              })
            }
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
              onChange={(e) =>
                onApartmentChange({
                  ...apartment,
                  floor_number: parseInt(e.target.value, 10),
                })
              }
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
              onValueChange={(value) =>
                onApartmentChange({
                  ...apartment,
                  rooms: value || 0,
                })
              }
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
            onChange={(e) =>
              onApartmentChange({
                ...apartment,
                area: parseFloat(e.target.value) || 0,
              })
            }
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
            onChange={(e) =>
              onApartmentChange({
                ...apartment,
                price: parseInt(e.target.value, 10) || null,
              })
            }
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="status">{t("apartmentsManager.status")}</Label>
          <Select
            value={apartment.status ?? "available"}
            onValueChange={(value) => {
              onApartmentChange({
                ...apartment,
                status: toApartmentStatus(value),
              });
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
          onCustomFieldsChange={onCustomFieldsChange}
        />
      )}

      <div className="flex gap-2 border-t pt-4">
        <Button
          style={{ backgroundColor: ADMIN_THEME.primary }}
          onClick={onSave}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {t("apartmentsManager.save")}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          {t("apartmentsManager.cancel")}
        </Button>
      </div>
    </div>
  );
};

export default ApartmentEditorForm;
