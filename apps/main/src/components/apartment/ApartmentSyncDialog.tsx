import { useEffect, useState } from "react";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Checkbox } from "@gridix/ui";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { ADMIN_THEME } from "@gridix/utils/lib";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface ApartmentSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceApartment: Apartment | null;
  targetApartments: Apartment[];
  onSyncComplete: (updatedApartments: Apartment[]) => void;
  getStatusColor?: (status: string) => string;
  getStatusLabel?: (status: string) => string;
  currencySymbol?: string;
}

const ApartmentSyncDialog = ({
  open,
  onOpenChange,
  sourceApartment,
  targetApartments,
  onSyncComplete,
  currencySymbol = "",
  getStatusColor = (status: string) => {
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
  },
  getStatusLabel = (status: string) => {
    switch (status) {
      case "sold":
        return "Продано";
      case "reserved":
        return "Забронировано";
      case "available":
        return "Доступно";
      default:
        return status;
    }
  },
}: ApartmentSyncDialogProps) => {
  const { t } = useLanguage();
  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(
    new Set(targetApartments.map((apt) => apt.id)),
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
  }, [targetApartments]);

  const formatPrice = (price: number | null | undefined) => {
    if (price == null)
      return t("apartmentsManager.syncDialog.priceNotSpecified");
    return `${price.toLocaleString()}${currencySymbol ? ` ${currencySymbol}` : ""}`;
  };

  const handleApartmentToggle = (apartmentId: string) => {
    const newSelected = new Set(selectedApartments);
    if (newSelected.has(apartmentId)) {
      newSelected.delete(apartmentId);
    } else {
      newSelected.add(apartmentId);
    }
    setSelectedApartments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedApartments.size === targetApartments.length) {
      setSelectedApartments(new Set());
    } else {
      setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
    }
  };

  const handleConfirmSync = async () => {
    if (!sourceApartment || selectedApartments.size === 0) return;

    setIsSyncing(true);
    try {
      // Подготовить данные для синхронизации (исключаем уникальные поля)
      const syncData = {
        price: sourceApartment.price,
        status: sourceApartment.status,
        custom_fields: sourceApartment.custom_fields,
        updated_at: new Date().toISOString(),
      };

      // Получить выбранные квартиры для синхронизации
      const apartmentsToSync = targetApartments.filter((apt) =>
        selectedApartments.has(apt.id),
      );

      // Обновить все выбранные квартиры
      const updatePromises = apartmentsToSync.map((apartment) =>
        supabase
          .from("apartments")
          .update(syncData)
          .eq("id", apartment.id)
          .select()
          .single(),
      );

      const results = await Promise.all(updatePromises);

      // Проверить наличие ошибок
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw new Error(`Ошибка при обновлении ${errors.length} квартир`);
      }

      // Обновить локальное состояние
      const updatedApartments = results.map((result) =>
        normalizeApartmentData(result.data),
      );
      onSyncComplete(updatedApartments);

      onOpenChange(false);
      toast.success(
        t("apartmentsManager.syncDialog.success", {
          count: selectedApartments.size,
        }),
      );
    } catch (error) {
      console.error("Error syncing apartment data:", error);
      toast.error(t("apartmentsManager.syncDialog.error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Сбросить выбор при закрытии
    setSelectedApartments(new Set(targetApartments.map((apt) => apt.id)));
  };

  if (!sourceApartment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("apartmentsManager.syncDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("apartmentsManager.syncDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Исходная квартира */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: ADMIN_THEME.backgroundSecondary,
              borderColor: ADMIN_THEME.info,
            }}
          >
            <h4
              className="mb-2 font-semibold"
              style={{ color: ADMIN_THEME.info }}
            >
              {t("apartmentsManager.syncDialog.sourceApartment")}
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>
                  {t("apartmentsManager.syncDialog.apartmentNumber")}:
                </strong>{" "}
                {sourceApartment.apartment_number}
              </p>
              <p>
                <strong>{t("apartmentsManager.syncDialog.floor")}:</strong>{" "}
                {sourceApartment.floor_number}
              </p>
              <p>
                <strong>{t("apartmentsManager.syncDialog.rooms")}:</strong>{" "}
                {sourceApartment.rooms == 0
                  ? t("apartment.studio")
                  : sourceApartment.rooms}
              </p>
              <p>
                <strong>{t("apartmentsManager.syncDialog.area")}:</strong>{" "}
                {sourceApartment.area} м²
              </p>
              <p>
                <strong>{t("apartmentsManager.price")}:</strong>{" "}
                {formatPrice(sourceApartment.price)}
              </p>
              <p>
                <strong>{t("apartmentsManager.status")}:</strong>{" "}
                <Badge className={getStatusColor(sourceApartment.status)}>
                  {getStatusLabel(sourceApartment.status)}
                </Badge>
              </p>
            </div>
          </div>

          {/* Выбор квартир для синхронизации */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4
                className="font-semibold"
                style={{ color: ADMIN_THEME.textPrimary }}
              >
                {t("apartmentsManager.syncDialog.targetsTitle", {
                  selected: selectedApartments.size,
                  total: targetApartments.length,
                })}
              </h4>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedApartments.size === targetApartments.length
                  ? t("apartmentsManager.syncDialog.deselectAll")
                  : t("apartmentsManager.syncDialog.selectAll")}
              </Button>
            </div>

            <div
              className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3"
              style={{ borderColor: ADMIN_THEME.border }}
            >
              {targetApartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="flex items-start gap-4 rounded border p-3 transition-colors"
                  style={{
                    backgroundColor: ADMIN_THEME.backgroundSecondary,
                    borderColor: ADMIN_THEME.borderLight,
                  }}
                >
                  <Checkbox
                    id={`apartment-${apartment.id}`}
                    checked={selectedApartments.has(apartment.id)}
                    onCheckedChange={() => handleApartmentToggle(apartment.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={`apartment-${apartment.id}`}
                      className="cursor-pointer text-sm font-medium"
                    >
                      <strong>
                        {t("apartmentsManager.apartment", {
                          number: apartment.apartment_number,
                        })}
                      </strong>{" "}
                      (
                      {t("apartmentsManager.floor", {
                        floor: apartment.floor_number,
                      })}
                      )
                    </label>
                    <div
                      className="space-y-1 text-xs"
                      style={{ color: ADMIN_THEME.textSecondary }}
                    >
                      <div className="flex justify-between">
                        <span>
                          {t("apartmentsManager.syncDialog.currentPrice")}:{" "}
                          {formatPrice(apartment.price)}
                        </span>
                        {apartment.price !== sourceApartment.price && (
                          <span style={{ color: ADMIN_THEME.info }}>
                            → {formatPrice(sourceApartment.price)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>
                          {t("apartmentsManager.status")}:{" "}
                          <Badge className={getStatusColor(apartment.status)}>
                            {getStatusLabel(apartment.status)}
                          </Badge>
                        </span>
                        {apartment.status !== sourceApartment.status && (
                          <span>
                            →{" "}
                            <Badge
                              className={getStatusColor(sourceApartment.status)}
                            >
                              {getStatusLabel(sourceApartment.status)}
                            </Badge>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Информация о синхронизации */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: ADMIN_THEME.backgroundSecondary,
              borderColor: ADMIN_THEME.warning,
            }}
          >
            <h4
              className="mb-2 font-semibold"
              style={{ color: ADMIN_THEME.warning }}
            >
              {t("apartmentsManager.syncDialog.syncedTitle")}
            </h4>
            <ul
              className="space-y-1 text-sm"
              style={{ color: ADMIN_THEME.textSecondary }}
            >
              <li>• {t("apartmentsManager.syncDialog.syncedPrice")}</li>
              <li>• {t("apartmentsManager.syncDialog.syncedStatus")}</li>
              <li>• {t("apartmentsManager.syncDialog.syncedCustomFields")}</li>
            </ul>
            <p
              className="mt-2 text-xs"
              style={{ color: ADMIN_THEME.textMuted }}
            >
              {t("apartmentsManager.syncDialog.notChangedHint")}
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirmSync}
              disabled={selectedApartments.size === 0 || isSyncing}
              style={{
                backgroundColor: ADMIN_THEME.primary,
                color: ADMIN_THEME.textOnPrimary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  ADMIN_THEME.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
              }}
            >
              {isSyncing
                ? t("apartmentsManager.syncDialog.syncing")
                : t("apartmentsManager.syncDialog.syncButton", {
                    count: selectedApartments.size,
                  })}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSyncing}
            >
              {t("apartmentsManager.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentSyncDialog;
