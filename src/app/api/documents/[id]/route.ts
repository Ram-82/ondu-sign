import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(
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
        recipients: {
          orderBy: { order: "asc" },
          include: {
            signatures: true,
          },
        },
        fields: true,
      },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    const pdfUrl = await getPresignedDownloadUrl(document.s3Key);
    let finalPdfUrl: string | null = null;
    if (document.finalS3Key) {
      finalPdfUrl = await getPresignedDownloadUrl(document.finalS3Key);
    }

    return NextResponse.json({ document, pdfUrl, finalPdfUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
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

    if (document.status === "SENT") {
      return errorResponse("Cannot delete a document that has been sent for signing");
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
