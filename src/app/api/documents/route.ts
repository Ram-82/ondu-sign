import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";
import { logAuditEvent, getClientIp } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      include: {
        recipients: {
          select: { id: true, email: true, name: true, status: true, order: true },
          orderBy: { order: "asc" },
        },
        _count: { select: { fields: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const body = await request.json();
    const { title, fileName, s3Key } = body;

    if (!title || !fileName || !s3Key) {
      return errorResponse("Title, fileName, and s3Key are required");
    }

    const document = await prisma.document.create({
      data: {
        title,
        fileName,
        s3Key,
        userId: user.id,
      },
    });

    await logAuditEvent({
      action: "document.created",
      documentId: document.id,
      userId: user.id,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
