import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { generateApartmentPDF } from "@gridix/utils/lib";

interface GenerateApartmentPdfParams {
  apartment: Apartment;
  project: Pick<Project, "id" | "slug" | "pdf_presentation_url">;
  language: string;
  /** Обязателен при дублирующихся номерах квартир между подпроектами. */
  subProjectSlug?: string | null;
}

export async function generateApartmentPdf({
  apartment,
  project,
  language,
  subProjectSlug,
}: GenerateApartmentPdfParams): Promise<void> {
  const projectSlug = project.slug || `id/${project.id}`;
  const apartmentNumber = encodeURIComponent(
    String(apartment.apartment_number ?? ""),
  );
  const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const subSeg =
    subProjectSlug != null && subProjectSlug !== ""
      ? `p/${encodeURIComponent(subProjectSlug)}/`
      : "";
  const pdfUrl = `https://${serverDomain}/${language}/project/${projectSlug}/${subSeg}apartment/${apartmentNumber}/pdf`;

  await generateApartmentPDF({
    apartment,
    pdfUrl,
    pdf_main: project.pdf_presentation_url || undefined,
    apiUrl,
  });
}
