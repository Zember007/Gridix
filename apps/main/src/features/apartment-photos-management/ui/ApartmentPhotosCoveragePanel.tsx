import { Button } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Apartment } from "@/entities/apartment/model/types";
import { CoverageFilter } from "../model/useApartmentPhotosManager";

interface ApartmentPhotosCoveragePanelProps {
  apartments: Apartment[];
  selectedApartment: string;
  setSelectedApartment: (id: string) => void;
  isCoverageExpanded: boolean;
  setIsCoverageExpanded: (
    value: boolean | ((prev: boolean) => boolean),
  ) => void;
  coverageFilter: CoverageFilter;
  setCoverageFilter: (value: CoverageFilter) => void;
  apartmentsWithPhotos: Apartment[];
  apartmentsWithoutPhotos: Apartment[];
  filteredApartments: Apartment[];
  photoCountsByApartment: Record<string, number>;
}

const ApartmentPhotosCoveragePanel = ({
  apartments,
  selectedApartment,
  setSelectedApartment,
  isCoverageExpanded,
  setIsCoverageExpanded,
  coverageFilter,
  setCoverageFilter,
  apartmentsWithPhotos,
  apartmentsWithoutPhotos,
  filteredApartments,
  photoCountsByApartment,
}: ApartmentPhotosCoveragePanelProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3 rounded-lg border px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-between">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md text-left transition-colors hover:bg-muted/40 sm:flex-1"
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
            <ChevronUp className="h-6 w-6 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          )}
        </button>

        <Button
          type="button"
          aria-pressed={coverageFilter === "without"}
          variant="outline"
          className={`h-auto w-full items-center justify-start rounded-lg border-amber-500/30 px-4 py-3 text-left text-foreground transition-all sm:w-auto sm:min-w-[200px] ${
            coverageFilter === "without"
              ? "bg-amber-500/20 shadow-sm hover:bg-amber-500/25"
              : "bg-amber-500/10 hover:bg-amber-500/15"
          }`}
          onClick={() => {
            setCoverageFilter("without");
            setIsCoverageExpanded(true);
          }}
        >
          <div className="flex flex-col items-start justify-center gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {t("photosManager.withoutPhotos")}
            </p>
            <p className="text-s font-semibold leading-none">
              {apartmentsWithoutPhotos.length}
            </p>
          </div>
        </Button>
      </div>

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
                <p className="text-xl font-semibold">{apartments.length}</p>
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
                  const photoCount = photoCountsByApartment[apartment.id] || 0;
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
                      onClick={() => setSelectedApartment(apartment.id)}
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
  );
};

export default ApartmentPhotosCoveragePanel;
