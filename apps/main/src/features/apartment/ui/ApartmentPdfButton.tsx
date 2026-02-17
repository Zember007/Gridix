import { Button } from "@gridix/ui";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { generateApartmentPdf } from "@/features/apartment/lib/generateApartmentPdf";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";

interface ApartmentPdfButtonProps {
  apartment: Apartment;
  project: Pick<Project, "id" | "slug" | "pdf_presentation_url">;
  language: string;
  label?: string;
}

export function ApartmentPdfButton({
  apartment,
  project,
  language,
  label = "PDF",
}: ApartmentPdfButtonProps) {
  const { run, isRunning } = useAsyncAction(generateApartmentPdf, {
    onError: (error) => {
      console.error("PDF generation failed", error);
    },
  });

  const handleClick = async () => {
    await run({ apartment, project, language });
  };

  return (
    <Button type="button" onClick={handleClick} disabled={isRunning}>
      {isRunning ? "PDF..." : label}
    </Button>
  );
}
