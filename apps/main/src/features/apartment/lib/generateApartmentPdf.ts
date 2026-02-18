import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { generateApartmentPDF } from "@gridix/utils/lib";

interface GenerateApartmentPdfParams {
  apartment: Apartment;
  project: Pick<Project, "id" | "slug" | "pdf_presentation_url">;
  language: string;
}

export async function generateApartmentPdf({
  apartment,
  project,
  language,
}: GenerateApartmentPdfParams): Promise<void> {
  const projectSlug = project.slug || `id/${project.id}`;
  const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const pdfUrl = `https://${serverDomain}/${language}/project/${projectSlug}/apartment/${apartment.apartment_number}/pdf`;

  await generateApartmentPDF({
    apartment,
    pdfUrl,
    pdf_main: project.pdf_presentation_url || undefined,
    apiUrl,
  });
}
