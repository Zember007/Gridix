import { useState } from "react";
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
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";

interface ApartmentSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceApartment: Apartment | null;
  targetApartments: Apartment[];
  onSyncComplete: (updatedApartments: Apartment[]) => void;
  getStatusColor?: (status: string) => string;
  getStatusLabel?: (status: string) => string;
}

const ApartmentSyncDialog = ({
  open,
  onOpenChange,
  sourceApartment,
  targetApartments,
  onSyncComplete,
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
  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(
    new Set(targetApartments.map((apt) => apt.id)),
  );
  const [isSyncing, setIsSyncing] = useState(false);

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
        rooms:
          typeof sourceApartment.rooms === "number"
            ? String(sourceApartment.rooms)
            : sourceApartment.rooms,
        area: sourceApartment.area,
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
        `Данные синхронизированы с ${selectedApartments.size} квартирами`,
      );
    } catch (error) {
      console.error("Error syncing apartment data:", error);
      toast.error("Ошибка при синхронизации данных квартир");
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
          <DialogTitle>Синхронизация данных квартиры</DialogTitle>
          <DialogDescription>
            Выберите квартиры для синхронизации данных
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Исходная квартира */}
          <div className="rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-800">
              Исходная квартира:
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Номер:</strong> {sourceApartment.apartment_number}
              </p>
              <p>
                <strong>Этаж:</strong> {sourceApartment.floor_number}
              </p>
              <p>
                <strong>Комнаты:</strong>{" "}
                {sourceApartment.rooms == 0 ? "Студия" : sourceApartment.rooms}
              </p>
              <p>
                <strong>Площадь:</strong> {sourceApartment.area} м²
              </p>
              <p>
                <strong>Цена:</strong>{" "}
                {sourceApartment.price
                  ? sourceApartment.price.toLocaleString() + " ₽"
                  : "Не указана"}
              </p>
              <p>
                <strong>Статус:</strong>{" "}
                <Badge className={getStatusColor(sourceApartment.status)}>
                  {getStatusLabel(sourceApartment.status)}
                </Badge>
              </p>
            </div>
          </div>

          {/* Выбор квартир для синхронизации */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">
                Квартиры для синхронизации ({selectedApartments.size} из{" "}
                {targetApartments.length}):
              </h4>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedApartments.size === targetApartments.length
                  ? "Снять все"
                  : "Выбрать все"}
              </Button>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
              {targetApartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="flex items-start gap-4 rounded border bg-gray-50 p-3 transition-colors hover:bg-gray-100"
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
                      <strong>Квартира {apartment.apartment_number}</strong>{" "}
                      (Этаж {apartment.floor_number})
                    </label>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>
                          Текущая цена:{" "}
                          {apartment.price
                            ? apartment.price.toLocaleString() + " ₽"
                            : "Не указана"}
                        </span>
                        {apartment.price !== sourceApartment.price && (
                          <span className="text-blue-600">
                            →{" "}
                            {sourceApartment.price
                              ? sourceApartment.price.toLocaleString() + " ₽"
                              : "Не указана"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>
                          Статус:{" "}
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
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="mb-2 font-semibold text-yellow-800">
              Будут синхронизированы:
            </h4>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Цена</li>
              <li>• Статус продажи</li>
              <li>• Пользовательские поля</li>
            </ul>
            <p className="mt-2 text-xs text-yellow-600">
              Номер квартиры, этаж, площадь и количество комнат останутся без
              изменений
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirmSync}
              disabled={selectedApartments.size === 0 || isSyncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing
                ? "Синхронизация..."
                : `Синхронизировать ${selectedApartments.size} квартир`}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSyncing}
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentSyncDialog;
