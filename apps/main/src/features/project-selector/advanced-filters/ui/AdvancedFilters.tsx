import {
  Button,
  Input,
  RangeInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { cn, getCurrencySymbolSafe } from "@gridix/utils/lib";
import { RotateCcw } from "lucide-react";
import { CurrencyToggle } from "@/shared/ui/currency-toggle";
import {
  AdvancedFiltersProps,
  useAdvancedFiltersState,
} from "../model/useAdvancedFiltersState";

export const AdvancedFilters = (props: AdvancedFiltersProps) => {
  const {
    project,
    themeColor = "#000000",
    minArea,
    maxArea,
    viewMode,
    formatPrice,
    visibleFilterFields,
    hasAnyVisibleFilter,
  } = props;

  const {
    t,
    roomsOptions,
    floorOptions,
    typeOptions,
    advType,
    setAdvType,
    advRooms,
    setAdvRooms,
    advFloor,
    setAdvFloor,
    advPrice,
    setAdvPrice,
    advArea,
    setAdvArea,
    advAvailable,
    setAdvAvailable,
    advSearch,
    setAdvSearch,
    advCurrency,
    advMinPrice,
    advMaxPrice,
    handleCurrencyChange,
    handleApplyFilters,
    handleResetFilters,
  } = useAdvancedFiltersState(props);

  return (
    <div className="relative grid min-w-[320px] grid-cols-1 gap-4 p-4 pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">
          {t("project.filters")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleResetFilters}
        >
          <RotateCcw className="h-4 w-4" />
          {t("project.resetFilters")}
        </Button>
      </div>

      {visibleFilterFields.price && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t("project.currency")}</div>
          <CurrencyToggle
            projectCurrency={project?.currency || null}
            selectedCurrency={advCurrency}
            onChange={handleCurrencyChange}
            themeColor={themeColor}
          />
        </div>
      )}

      {visibleFilterFields.type &&
        (project?.has_commercial || project?.has_parking) && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">{t("project.type")}</div>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm",
                    advType === o.value
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 text-gray-600",
                  )}
                  onClick={() => setAdvType(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

      {visibleFilterFields.rooms && project?.project_type !== "object" && (
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
                  {" "}
                  {o.label}
                </button>
              ))
            ) : (
              <Select value={advRooms} onValueChange={setAdvRooms}>
                <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                  <SelectValue placeholder={t("project.parameters")} />
                </SelectTrigger>
                <SelectContent className={"h-[200px]"}>
                  {roomsOptions.map((o) => (
                    <SelectItem
                      className={"mb-1 rounded-full border py-2 text-sm"}
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

      {visibleFilterFields.floor &&
        viewMode !== "floor-plan" &&
        project?.project_type !== "object" && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">{t("project.floor")}</div>
            <div className="flex flex-wrap gap-2">
              <Select value={advFloor} onValueChange={setAdvFloor}>
                <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                  <SelectValue placeholder={t("project.parameters")} />
                </SelectTrigger>
                <SelectContent className={"h-[200px]"}>
                  {floorOptions.map((o) => (
                    <SelectItem
                      className={"mb-1 rounded-full border py-2 text-sm"}
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

      {visibleFilterFields.price && (
        <RangeInput
          label={t("project.price")}
          min={advMinPrice}
          max={advMaxPrice}
          value={advPrice}
          onChange={(next) => setAdvPrice(next)}
          formatHint={formatPrice}
          unit={getCurrencySymbolSafe(advCurrency)}
          clamp={true}
        />
      )}

      {visibleFilterFields.area && (
        <RangeInput
          label={t("project.area")}
          min={minArea}
          max={maxArea}
          value={advArea}
          onChange={(next) => setAdvArea(next)}
          unit={t("apartment.sqm")}
          clamp={true}
        />
      )}

      {visibleFilterFields.number && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            {t("project.apartmentNumber")}
          </div>
          <Input
            value={advSearch}
            onChange={(e) => setAdvSearch(e.target.value)}
          />
        </div>
      )}

      {!hasAnyVisibleFilter && (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
          {t("filters.noFiltersAvailable")}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 p-4 pt-2">
        {visibleFilterFields.status && (
          <Button
            variant="outline"
            className={cn(
              advAvailable
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700",
            )}
            onClick={() => setAdvAvailable(!advAvailable)}
          >
            {t("project.onlyAvailable")}
          </Button>
        )}
        {hasAnyVisibleFilter && (
          <Button
            onClick={handleApplyFilters}
            style={{ backgroundColor: themeColor, color: "#fff" }}
          >
            {t("filters.applyFilters")}
          </Button>
        )}
      </div>
    </div>
  );
};
