import { X } from "lucide-react";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <div className="flex shrink-0 items-center gap-1 rounded border border-slate-200 bg-white py-0.5 pl-2 pr-1 text-[9px] font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-slate-300">
    <span>{label}</span>
    <button
      type="button"
      onClick={onRemove}
      className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
    >
      <X size={10} />
    </button>
  </div>
);
