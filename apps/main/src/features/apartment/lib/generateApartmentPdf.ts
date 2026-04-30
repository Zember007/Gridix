import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { supabase } from "@/shared/api/supabase";

interface GenerateApartmentPdfParams {
  apartment: Apartment;
  project: Pick<Project, "id" | "slug" | "pdf_presentation_url">;
  language: string;
  /** Обязателен при дублирующихся номерах квартир между подпроектами. */
  subProjectSlug?: string | null;
}

const FUNCTION_NAME = "project-selector";

function downloadPdfBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFileNameFromResponse(response?: Response): string | null {
  const contentDisposition = response?.headers.get("Content-Disposition");
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

export async function generateApartmentPdf({
  apartment,
  project,
  language,
  subProjectSlug,
}: GenerateApartmentPdfParams): Promise<void> {
  const { data, error, response } = await supabase.functions.invoke<Blob>(
    FUNCTION_NAME,
    {
      body: {
        action: "generate-apartment-pdf",
        apartment,
        project,
        language,
        ...(subProjectSlug ? { subProjectSlug } : {}),
      },
    },
  );

  if (error) throw error;
  if (!(data instanceof Blob)) {
    throw new Error("PDF generation returned an invalid response");
  }

  const fileName =
    getFileNameFromResponse(response) ??
    `apartment_${apartment.apartment_number ?? "apartment"}_details.pdf`;
  downloadPdfBlob(data, fileName);
}
