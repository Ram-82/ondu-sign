import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { errorResponse, handleApiError } from "@/lib/errors";
import { logAuditEvent, getClientIp } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const recipient = await prisma.recipient.findUnique({
      where: { token },
      include: {
        document: {
          include: {
            fields: true,
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

    if (recipient.status === "PENDING") {
      return errorResponse("This signing link is not yet active", 403);
    }

    if (recipient.expiresAt && recipient.expiresAt < new Date()) {
      return errorResponse("This signing link has expired", 403);
    }

    // Mark as viewed
    if (recipient.status === "SENT") {
      await prisma.recipient.update({
        where: { id: recipient.id },
        data: { status: "VIEWED" },
      });

      await logAuditEvent({
        action: "document.viewed",
        documentId: recipient.documentId,
        ip: getClientIp(_request),
        userAgent: _request.headers.get("user-agent"),
        metadata: { recipientEmail: recipient.email },
      });
    }

    const pdfUrl = await getPresignedDownloadUrl(recipient.document.s3Key);

    // Only return fields assigned to this recipient
    const recipientFields = recipient.document.fields.filter(
      (f) => f.recipientId === recipient.id
    );

    return NextResponse.json({
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
      },
      document: {
        id: recipient.document.id,
        title: recipient.document.title,
      },
      fields: recipientFields,
      pdfUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
