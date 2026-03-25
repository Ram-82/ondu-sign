import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface FieldData {
  type: "SIGNATURE" | "TEXT" | "DATE";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  signatureType?: "DRAWN" | "TYPED";
}

export async function embedSignaturesIntoPdf(
  pdfBytes: Buffer,
  fields: FieldData[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const pages = pdfDoc.getPages();
    const page = pages[field.page - 1];
    if (!page) continue;

    const pageHeight = page.getHeight();
    // Convert from top-left origin (web) to bottom-left origin (PDF)
    const pdfY = pageHeight - field.y - field.height;

    if (field.type === "SIGNATURE" && field.signatureType === "DRAWN") {
      // Drawn signature: value is base64 PNG
      const base64Data = field.value.replace(/^data:image\/png;base64,/, "");
      const imageBytes = Buffer.from(base64Data, "base64");
      const image = await pdfDoc.embedPng(imageBytes);
      page.drawImage(image, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
      });
    } else if (field.type === "SIGNATURE" && field.signatureType === "TYPED") {
      // Typed signature
      const fontSize = Math.min(field.height * 0.6, 24);
      page.drawText(field.value, {
        x: field.x + 4,
        y: pdfY + field.height * 0.3,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0.5),
      });
    } else if (field.type === "TEXT" || field.type === "DATE") {
      const fontSize = Math.min(field.height * 0.6, 14);
      page.drawText(field.value, {
        x: field.x + 4,
        y: pdfY + field.height * 0.3,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
    }
  }

  return pdfDoc.save();
}

export async function getPdfPageCount(pdfBytes: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}
