import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RangeInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useIsMobile,
} from "@gridix/ui";
import { cn } from "@gridix/utils/lib";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type ApartmentStatusFilter = "all" | "available" | "reserved" | "sold";

interface AdminApartmentFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedFloor: number | null;
  setSelectedFloor: (v: number | null) => void;
  selectedRooms: string | null;
  setSelectedRooms: (v: string | null) => void;
  selectedStatus: ApartmentStatusFilter;
  setSelectedStatus: (v: ApartmentStatusFilter) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  areaRange: [number, number];
  setAreaRange: (v: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  uniqueFloors: number[];
  uniqueRooms: (string | number)[];
  projectType?: "building" | "object" | null;
  currentType: "apartment" | "commercial" | "parking";
  onReset: () => void;
  hasActiveFilters: boolean;
  currencySymbol?: string;
}

export const AdminApartmentFilters = ({
  searchTerm,
  setSearchTerm,
  selectedFloor,
  setSelectedFloor,
  selectedRooms,
  setSelectedRooms,
  selectedStatus,
  setSelectedStatus,
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  uniqueFloors,
  uniqueRooms,
  projectType,
  currentType,
  onReset,
  hasActiveFilters,
  currencySymbol = "$",
}: AdminApartmentFiltersProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const [advFloor, setAdvFloor] = useState<string>(
    selectedFloor === null ? "all" : selectedFloor.toString(),
  );
  const [advRooms, setAdvRooms] = useState<string>(selectedRooms ?? "all");
  const [advStatus, setAdvStatus] =
    useState<ApartmentStatusFilter>(selectedStatus);
  const [advPrice, setAdvPrice] = useState<[number, number]>(priceRange);
  const [advArea, setAdvArea] = useState<[number, number]>(areaRange);

  useEffect(() => {
    if (!open) return;
    setAdvFloor(selectedFloor === null ? "all" : selectedFloor.toString());
    setAdvRooms(selectedRooms ?? "all");
    setAdvStatus(selectedStatus);
    setAdvPrice(priceRange);
    setAdvArea(areaRange);
  }, [
    open,
    selectedFloor,
    selectedRooms,
    selectedStatus,
    priceRange,
    areaRange,
  ]);

  const roomsOptions = useMemo(() => {
    const base = [{ value: "all", label: t("project.allRooms") }];
    const nums = uniqueRooms.map((r) => ({
      value: String(r),
      label:
        r === 0 || r === "0"
          ? t("apartment.studio")
          : r === "free_layout"
            ? t("apartment.freeLayout")
            : `${r} ${t("apartment.room")}`,
    }));
    return [...base, ...nums];
  }, [uniqueRooms, t]);

  const floorOptions = useMemo(() => {
    const base = [{ value: "all", label: t("project.allFloors") }];
    const nums = uniqueFloors.map((f) => ({
      value: f.toString(),
      label: t("apartmentsManager.floor", { floor: f }),
    }));
    return [...base, ...nums];
  }, [uniqueFloors, t]);

  const handleApply = () => {
    setSelectedFloor(advFloor === "all" ? null : parseInt(advFloor));
    setSelectedRooms(advRooms === "all" ? null : advRooms);
    setSelectedStatus(advStatus);
    setPriceRange(advPrice);
    setAreaRange(advArea);
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  const activeCount = [
    selectedFloor !== null,
    selectedRooms !== null,
    selectedStatus !== "all",
    priceRange[0] !== minPrice || priceRange[1] !== maxPrice,
    areaRange[0] !== minArea || areaRange[1] !== maxArea,
  ].filter(Boolean).length;

  const filterBody = (
    <div className="grid grid-cols-1 gap-4">
      {currentType === "apartment" && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t("project.rooms")}</div>
          <div className="flex flex-wrap gap-2">
            {roomsOptions.length < 6 ? (
              roomsOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm",
                    advRooms === o.value
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 text-gray-600",
                  )}
                  onClick={() => setAdvRooms(o.value)}
                >
                  {o.label}
                </button>
              ))
            ) : (
              <Select value={advRooms} onValueChange={setAdvRooms}>
                <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="h-[200px]">
                  {roomsOptions.map((o) => (
                    <SelectItem
                      className="mb-1 rounded-full border py-2 text-sm"
                      key={o.value}
                      value={o.value}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {projectType !== "object" && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t("project.floor")}</div>
          <div className="flex flex-wrap gap-2">
            <Select value={advFloor} onValueChange={setAdvFloor}>
              <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="h-[200px]">
                {floorOptions.map((o) => (
                  <SelectItem
                    className="mb-1 rounded-full border py-2 text-sm"
                    key={o.value}
                    value={o.value}
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {maxPrice > 0 && (
        <RangeInput
          label={t("project.price")}
          min={minPrice}
          max={maxPrice}
          value={advPrice}
          onChange={(next) => setAdvPrice(next)}
          unit={currencySymbol}
          clamp
        />
      )}

      {maxArea > 0 && (
        <RangeInput
          label={t("project.area")}
          min={minArea}
          max={maxArea}
          value={advArea}
          onChange={(next) => setAdvArea(next)}
          unit="m²"
          clamp
        />
      )}
    </div>
  );

  const filterFooter = (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        className={cn(
          advStatus === "available"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-gray-200 bg-white text-gray-700",
        )}
        onClick={() =>
          setAdvStatus(advStatus === "available" ? "all" : "available")
        }
      >
        {t("project.onlyAvailable")}
      </Button>
      <Button onClick={handleApply}>{t("projectEditor.apply")}</Button>
    </div>
  );

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      className="relative h-9 shrink-0 basis-9 rounded-full border-gray-200 bg-white p-0 [&_svg]:size-4"
      aria-label={t("project.filters")}
      title={t("project.filters")}
      onClick={() => isMobile && setOpen(true)}
    >
      <SlidersHorizontal className="h-4 w-4 text-gray-700" />
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
          {activeCount}
        </span>
      )}
    </Button>
  );

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t("apartmentsManager.searchByNameAreaPrice")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isMobile ? (
        <>
          {triggerButton}
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle>{t("project.filters")}</DrawerTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("project.resetFilters")}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-4">{filterBody}</div>
              <DrawerFooter className="border-t border-gray-100 bg-gray-50">
                {filterFooter}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            align="end"
            className="relative max-h-[calc(100vh-150px)] max-w-[500px] overflow-y-auto p-0"
          >
            <div className="p-4 pb-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">
                  {t("project.filters")}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("project.resetFilters")}
                </Button>
              </div>
              {filterBody}
              <div className="sticky bottom-0 -mx-4 mt-4 border-t border-gray-100 bg-gray-50 p-4 pt-2">
                {filterFooter}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
