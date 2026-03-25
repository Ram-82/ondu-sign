import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import { sendSigningRequestEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
      include: {
        recipients: { orderBy: { order: "asc" } },
        fields: true,
      },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    if (document.status !== "DRAFT") {
      return errorResponse("Document has already been sent");
    }

    if (document.recipients.length === 0) {
      return errorResponse("At least one recipient is required");
    }

    if (document.fields.length === 0) {
      return errorResponse("At least one field is required");
    }

    // Update document status
    await prisma.document.update({
      where: { id },
      data: { status: "SENT" },
    });

    // Send email to first recipient (sequential signing)
    const firstRecipient = document.recipients[0];
    await prisma.recipient.update({
      where: { id: firstRecipient.id },
      data: { status: "SENT" },
    });

    // Send email (fire and forget for MVP, ideally use queue)
    try {
      await sendSigningRequestEmail(
        firstRecipient.email,
        firstRecipient.name,
        document.title,
        firstRecipient.token
      );
    } catch (emailError) {
      console.error("Failed to send signing email:", emailError);
    }

    await logAuditEvent({
      action: "document.sent",
      documentId: id,
      userId: user.id,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      metadata: { recipientEmail: firstRecipient.email },
    });

    return NextResponse.json({ success: true, status: "SENT" });
  } catch (error) {
    return handleApiError(error);
  }
}
