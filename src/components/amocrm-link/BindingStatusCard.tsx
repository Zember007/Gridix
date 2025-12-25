import { Button } from '@/shared/ui/button';

type BoundStatus = {
  bound: true;
  project: { id: string; slug: string | null; name: string | null; project_type: string | null } | null;
  apartment: { id: string; apartment_number: string | null } | null;
};

export function BindingStatusCard({
  status,
  openProjectHref,
}: {
  status: BoundStatus;
  openProjectHref: string | null;
}) {
  const projectName = status.project?.name || 'Проект';
  const apartmentNumber = status.apartment?.apartment_number ? `№${status.apartment.apartment_number}` : null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="text-xl font-semibold">Лид уже привязан</div>
      <div className="mt-2 text-sm text-muted-foreground">
        {projectName}
        {apartmentNumber ? ` · ${apartmentNumber}` : ''}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {openProjectHref ? (
          <Button asChild>
            <a href={openProjectHref} target="_blank" rel="noreferrer">
              Открыть проект
            </a>
          </Button>
        ) : (
          <Button disabled>Открыть проект</Button>
        )}

        <div className="text-xs text-muted-foreground">
          Если нужно изменить привязку — открепите/перепривяжите лид в Gridix (или напишите в поддержку).
        </div>
      </div>
    </div>
  );
}















