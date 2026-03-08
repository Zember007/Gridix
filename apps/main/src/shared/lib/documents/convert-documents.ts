import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function extractPdfToHtml(
  arrayBuffer: ArrayBuffer,
): Promise<string> {
  const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = (textContent.items as Array<any>)
      .map((it) => {
        const str = String(it.str ?? "").trimEnd();
        const t = Array.isArray(it.transform) ? it.transform : null;
        const x = t ? Number(t[4]) : 0;
        const y = t ? Number(t[5]) : 0;
        return { str, x, y };
      })
      .filter((it) => it.str.length > 0);

    items.sort((a, b) => b.y - a.y || a.x - b.x);

    const lines: Array<{
      y: number;
      parts: Array<{ x: number; str: string }>;
    }> = [];
    const yTolerance = 2.5;

    for (const it of items) {
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.y - it.y) > yTolerance) {
        lines.push({ y: it.y, parts: [{ x: it.x, str: it.str }] });
      } else {
        last.parts.push({ x: it.x, str: it.str });
      }
    }

    const htmlLines = lines
      .map((ln) => {
        ln.parts.sort((a, b) => a.x - b.x);
        const text = ln.parts
          .map((p) => p.str)
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim();
        return text ? `<p>${escapeHtml(text)}</p>` : `<p><br/></p>`;
      })
      .join("");

    pages.push(htmlLines || `<p><br/></p>`);
  }

  return pages.join("<hr/>");
}

export function getGoogleDocId(link: string): string | null {
  const trimmed = link.trim();
  const match = trimmed.match(
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
  );
  return match?.[1] ?? null;
}

export function getGoogleDocExportUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/export?format=docx`;
}
