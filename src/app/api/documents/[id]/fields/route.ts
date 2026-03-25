import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";
import type { FieldInput } from "@/types";

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
      return errorResponse("Can only edit fields on draft documents");
    }

    const body = await request.json();
    const fields: FieldInput[] = body.fields;

    if (!Array.isArray(fields)) {
      return errorResponse("Fields must be an array");
    }

    // Bulk upsert: delete existing and recreate
    const result = await prisma.$transaction(async (tx) => {
      await tx.field.deleteMany({ where: { documentId: id } });

      const created = await Promise.all(
        fields.map((field) =>
          tx.field.create({
            data: {
              type: field.type,
              page: field.page,
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
              required: field.required,
              recipientId: field.recipientId,
              documentId: id,
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json({ fields: result });
  } catch (error) {
    return handleApiError(error);
  }
}
