import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500 min-h-[400px]">
    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
      <Icon size={40} className="text-slate-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 max-w-xs mb-8 leading-relaxed">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        {action.label}
      </button>
    )}
  </div>
);
