import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, handleApiError } from "@/lib/errors";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import { sendSigningRequestEmail, sendDocumentCompletedEmail } from "@/lib/email";
import { downloadFile, uploadFile, generateFinalS3Key } from "@/lib/s3";
import { embedSignaturesIntoPdf } from "@/lib/pdf";
import type { SignatureInput } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const recipient = await prisma.recipient.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            recipients: { orderBy: { order: "asc" } },
            fields: { include: { signature: true } },
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!recipient) {
      return errorResponse("Invalid signing link", 404);
    }

    if (recipient.status === "SIGNED") {
      return errorResponse("You have already signed this document", 400);
    }

    if (!["SENT", "VIEWED"].includes(recipient.status)) {
      return errorResponse("This signing link is not active", 403);
    }

    if (recipient.expiresAt && recipient.expiresAt < new Date()) {
      return errorResponse("This signing link has expired", 403);
    }

    const body = await request.json();
    const signatures: SignatureInput[] = body.signatures;

    if (!Array.isArray(signatures) || signatures.length === 0) {
      return errorResponse("Signatures are required");
    }

    // Validate all fields belong to this recipient
    const recipientFieldIds = recipient.document.fields
      .filter((f) => f.recipientId === recipient.id)
      .map((f) => f.id);

    for (const sig of signatures) {
      if (!recipientFieldIds.includes(sig.fieldId)) {
        return errorResponse("Invalid field ID");
      }
    }

    // Save signatures
    await prisma.$transaction(async (tx) => {
      for (const sig of signatures) {
        await tx.signature.create({
          data: {
            fieldId: sig.fieldId,
            recipientId: recipient.id,
            value: sig.value,
            type: sig.type,
          },
        });
      }

      await tx.recipient.update({
        where: { id: recipient.id },
        data: { status: "SIGNED", signedAt: new Date() },
      });
    });

    await logAuditEvent({
      action: "recipient.signed",
      documentId: recipient.documentId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      metadata: { recipientEmail: recipient.email },
    });

    // Check if there's a next recipient
    const nextRecipient = recipient.document.recipients.find(
      (r) => r.order > recipient.order && r.status === "PENDING"
    );

    if (nextRecipient) {
      // Send email to next recipient
      await prisma.recipient.update({
        where: { id: nextRecipient.id },
        data: { status: "SENT" },
      });

      try {
        await sendSigningRequestEmail(
          nextRecipient.email,
          nextRecipient.name,
          recipient.document.title,
          nextRecipient.token
        );
      } catch (emailError) {
        console.error("Failed to send next signing email:", emailError);
      }
    } else {
      // All recipients signed - finalize PDF
      try {
        await finalizePdf(recipient.document.id);
      } catch (pdfError) {
        console.error("Failed to finalize PDF:", pdfError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

async function finalizePdf(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      fields: { include: { signature: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!document) return;

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
  const finalS3Key = generateFinalS3Key(documentId);

  await uploadFile(finalS3Key, Buffer.from(finalPdf), "application/pdf");

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "COMPLETED", finalS3Key },
  });

  await logAuditEvent({
    action: "document.completed",
    documentId,
    metadata: { finalS3Key },
  });

  try {
    await sendDocumentCompletedEmail(
      document.user.email,
      document.user.name,
      document.title,
      documentId
    );
  } catch {
    console.error("Failed to send completion email");
  }
}
