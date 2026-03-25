import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";
import { generateSecureToken, generateSigningTokenExpiry } from "@/lib/tokens";
import type { RecipientInput } from "@/types";

export async function PUT(
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
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    if (document.status !== "DRAFT") {
      return errorResponse("Can only edit recipients on draft documents");
    }

    const body = await request.json();
    const recipients: RecipientInput[] = body.recipients;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return errorResponse("At least one recipient is required");
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.recipient.deleteMany({ where: { documentId: id } });

      const created = await Promise.all(
        recipients.map((r) =>
          tx.recipient.create({
            data: {
              email: r.email,
              name: r.name,
              order: r.order,
              token: generateSecureToken(),
              expiresAt: generateSigningTokenExpiry(),
              documentId: id,
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json({ recipients: result });
  } catch (error) {
    return handleApiError(error);
  }
}
