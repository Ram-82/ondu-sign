import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
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

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    const entries = await prisma.auditLog.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    return handleApiError(error);
  }
}
