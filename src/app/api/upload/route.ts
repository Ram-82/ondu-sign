import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { uploadFile, generateS3Key } from "@/lib/s3";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Not authenticated", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided");
    }

    if (file.type !== "application/pdf") {
      return errorResponse("Only PDF files are allowed");
    }

    if (file.size > 10 * 1024 * 1024) {
      return errorResponse("File must be less than 10MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = generateS3Key(user.id, file.name);

    await uploadFile(s3Key, buffer, "application/pdf");

    return NextResponse.json({
      s3Key,
      fileName: file.name,
      size: file.size,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
