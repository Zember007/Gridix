import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@gridix/utils/react";

interface ApartmentPhotosDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceApartment: Apartment | null;
  targetApartments: Apartment[];
  selectedApartmentIds: Set<string>;
  photoCountsByApartment: Record<string, number>;
  isSubmitting: boolean;
  onApartmentToggle: (apartmentId: string) => void;
  onSelectAll: () => void;
  onConfirm: () => Promise<void>;
}

const ApartmentPhotosDuplicateDialog = ({
  open,
  onOpenChange,
  sourceApartment,
  targetApartments,
  selectedApartmentIds,
  photoCountsByApartment,
  isSubmitting,
  onApartmentToggle,
  onSelectAll,
  onConfirm,
}: ApartmentPhotosDuplicateDialogProps) => {
  const { t } = useLanguage();

  if (!sourceApartment) {
    return null;
  }

  const sourcePhotoCount = photoCountsByApartment[sourceApartment.id] ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden p-0">
        <div className="border-b px-5 py-4 sm:px-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg leading-tight">
              {t("photosManager.duplicateToSimilar")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-4">
            <div className="rounded-xl border p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("photosManager.selectApartment")}
                  </div>
                  <div className="text-base font-semibold leading-tight">
                    {t("photosManager.apartmentOption", {
                      number: sourceApartment.apartment_number,
                      floor: sourceApartment.floor_number,
                    })}
                  </div>
                </div>
                <Badge className="bg-sky-100 text-sky-800">
                  {sourcePhotoCount > 0
                    ? t("photosManager.photoCountShort", {
                        count: sourcePhotoCount,
                      })
                    : t("photosManager.noIndividualPhotosShort")}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                {t("apartmentsManager.syncDialog.targetsTitle", {
                  selected: selectedApartmentIds.size,
                  total: targetApartments.length,
                })}
              </div>
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                {selectedApartmentIds.size === targetApartments.length
                  ? t("apartmentsManager.syncDialog.deselectAll")
                  : t("apartmentsManager.syncDialog.selectAll")}
              </Button>
            </div>

            <div className="space-y-2 rounded-xl border p-3">
              {targetApartments.map((apartment) => {
                const apartmentPhotoCount =
                  photoCountsByApartment[apartment.id] ?? 0;

                return (
                  <label
                    key={apartment.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedApartmentIds.has(apartment.id)}
                      onCheckedChange={() => onApartmentToggle(apartment.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium leading-tight">
                        {t("photosManager.apartmentOption", {
                          number: apartment.apartment_number,
                          floor: apartment.floor_number,
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>
                          {apartmentPhotoCount > 0
                            ? t("photosManager.photoCountShort", {
                                count: apartmentPhotoCount,
                              })
                            : t("photosManager.noIndividualPhotosShort")}
                        </span>
                        <span>
                          {t("apartmentsManager.areaValue", {
                            area: apartment.area,
                          })}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t bg-background px-5 py-4 sm:px-6">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                void onConfirm();
              }}
              disabled={selectedApartmentIds.size === 0 || isSubmitting}
            >
              {t("photosManager.duplicateToSimilar")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("apartmentsManager.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentPhotosDuplicateDialog;
