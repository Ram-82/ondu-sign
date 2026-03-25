import { prisma } from "@/lib/db";
import { sendSigningRequestEmail } from "@/lib/email";

interface SendSigningEmailData {
  recipientId: string;
  documentTitle: string;
}

export async function handleSendSigningEmails(data: SendSigningEmailData) {
  const recipient = await prisma.recipient.findUnique({
    where: { id: data.recipientId },
  });

  if (!recipient) {
    console.error("Recipient not found:", data.recipientId);
    return;
  }

  await sendSigningRequestEmail(
    recipient.email,
    recipient.name,
    data.documentTitle,
    recipient.token
  );

  await prisma.recipient.update({
    where: { id: recipient.id },
    data: { status: "SENT" },
  });
}
