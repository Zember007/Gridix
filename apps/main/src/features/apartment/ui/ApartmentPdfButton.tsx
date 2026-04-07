import { Button } from "@gridix/ui";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { generateApartmentPdf } from "@/features/apartment/lib/generateApartmentPdf";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";

interface ApartmentPdfButtonProps {
  apartment: Apartment;
  project: Pick<Project, "id" | "slug" | "pdf_presentation_url">;
  language: string;
  /** При дубликатах номеров между подпроектами — slug из `/p/:subSlug/`. */
  subProjectSlug?: string | null;
  label?: string;
}

export function ApartmentPdfButton({
  apartment,
  project,
  language,
  subProjectSlug,
  label = "PDF",
}: ApartmentPdfButtonProps) {
  const { run, isRunning } = useAsyncAction(generateApartmentPdf, {
    onError: (error) => {
      console.error("PDF generation failed", error);
    },
  });

  const handleClick = async () => {
    await run({ apartment, project, language, subProjectSlug });
  };

  return (
    <Button type="button" onClick={handleClick} disabled={isRunning}>
      {isRunning ? `${label}...` : label}
    </Button>
  );
}
