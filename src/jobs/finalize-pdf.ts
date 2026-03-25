import { prisma } from "@/lib/db";
import { downloadFile, uploadFile, generateFinalS3Key } from "@/lib/s3";
import { embedSignaturesIntoPdf } from "@/lib/pdf";
import { sendDocumentCompletedEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

interface FinalizePdfData {
  documentId: string;
}

export async function handleFinalizePdf(data: FinalizePdfData) {
  const document = await prisma.document.findUnique({
    where: { id: data.documentId },
    include: {
      fields: { include: { signature: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!document) {
    console.error("Document not found:", data.documentId);
    return;
  }

  const pdfBytes = await downloadFile(document.s3Key);

  const fieldsWithValues = document.fields
    .filter((f) => f.signature)
    .map((f) => ({
      type: f.type,
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      value: f.signature!.value,
      signatureType: f.signature!.type,
    }));

  const finalPdf = await embedSignaturesIntoPdf(pdfBytes, fieldsWithValues);
  const finalS3Key = generateFinalS3Key(data.documentId);

  await uploadFile(finalS3Key, Buffer.from(finalPdf), "application/pdf");

  await prisma.document.update({
    where: { id: data.documentId },
    data: { status: "COMPLETED", finalS3Key },
  });

  await logAuditEvent({
    action: "document.completed",
    documentId: data.documentId,
    metadata: { finalS3Key },
  });

  try {
    await sendDocumentCompletedEmail(
      document.user.email,
      document.user.name,
      document.title,
      data.documentId
    );
  } catch {
    console.error("Failed to send completion email");
  }
}
