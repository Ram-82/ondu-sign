import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Not authenticated", 401);
    }
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
