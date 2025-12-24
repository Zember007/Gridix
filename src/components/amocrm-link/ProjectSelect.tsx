import type { Project } from '@/entities/project/queries/useProjectsManager';

export function ProjectSelect({
  projects,
  value,
  onChange,
  disabled,
  error,
}: {
  projects: Project[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-2">
      <select
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
      >
        <option value="">Выберите проект…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.slug || p.id}
          </option>
        ))}
      </select>
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  );
}












