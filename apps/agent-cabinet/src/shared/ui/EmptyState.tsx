interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      {message}
    </div>
  );
}
