import { X } from "lucide-react";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 py-1 pl-2.5 pr-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="rounded-full p-0.5 hover:bg-slate-300/50"
    >
      <X size={12} />
    </button>
  </div>
);
