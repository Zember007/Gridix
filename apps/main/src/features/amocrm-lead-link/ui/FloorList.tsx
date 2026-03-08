type FloorListProps = {
  floors: number[];
  selectedFloor: number | null;
  floorCounts: Record<number, number>;
  onSelectFloor: (floor: number) => void;
};

export function FloorList({
  floors,
  selectedFloor,
  floorCounts,
  onSelectFloor,
}: FloorListProps) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
        Этаж
      </div>
      <div className="max-h-[420px] overflow-auto">
        {floors.map((f) => {
          const count = floorCounts[f] ?? 0;
          const isActive = f === selectedFloor;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onSelectFloor(f)}
              className={[
                "w-full rounded-md px-3 py-2 text-left text-sm transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span>Этаж {f}</span>
                <span
                  className={
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
