import React from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center duration-500 animate-in fade-in">
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 shadow-sm">
      <Icon size={40} className="text-slate-400" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
    <p className="mb-8 max-w-xs leading-relaxed text-slate-500">
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        className="transform rounded-lg bg-slate-900 px-6 py-2.5 font-bold text-white shadow-md transition-colors hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
      >
        {action.label}
      </button>
    )}
  </div>
);
