import type { Apartment } from "@/entities/apartment/model/types";

type ApartmentGridProps = {
  floorApartments: Apartment[];
  selectedApartmentId: string | null;
  onSelect: (apartment: Apartment) => void;
};

export function ApartmentGrid({
  floorApartments,
  selectedApartmentId,
  onSelect,
}: ApartmentGridProps) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> доступно
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> бронь
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400" /> продано
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
        }}
      >
        {floorApartments.map((apt) => {
          const isSelected = apt.id === selectedApartmentId;
          const isAvailable = apt.status === "available";
          const statusColor =
            apt.status === "available"
              ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
              : apt.status === "reserved"
                ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                : "border-gray-200 bg-gray-50";

          return (
            <button
              key={apt.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(apt)}
              className={[
                "rounded-lg border px-2 py-3 text-left transition",
                statusColor,
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "",
                !isAvailable ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
              title={!isAvailable ? "Недоступно для привязки" : "Выбрать"}
            >
              <div className="text-sm font-semibold leading-none">
                №{apt.apartment_number}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {apt.area ? `${Math.round(apt.area)}м²` : "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
