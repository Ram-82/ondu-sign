import { prisma } from "./db";

interface AuditEventParams {
  action: string;
  documentId?: string;
  userId?: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        documentId: params.documentId,
        userId: params.userId,
        ip: params.ip ?? undefined,
        userAgent: params.userAgent ?? undefined,
        metadata: params.metadata as object ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}
