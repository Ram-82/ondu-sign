import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signJwt } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";
import { logAuditEvent, getClientIp } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return errorResponse("Email, password, and name are required");
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = signJwt({ userId: user.id, email: user.email });

    await logAuditEvent({
      action: "user.registered",
      userId: user.id,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const response = NextResponse.json({ user, token }, { status: 201 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
