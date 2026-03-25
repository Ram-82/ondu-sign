import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }
  return resendClient;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = "Ondu Sign <noreply@ondusign.com>";

export async function sendSigningRequestEmail(
  recipientEmail: string,
  recipientName: string,
  documentTitle: string,
  signingToken: string
): Promise<void> {
  const signingUrl = `${APP_URL}/sign/${signingToken}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `Please sign: ${documentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Ondu Sign</h2>
        <p>Hello ${recipientName},</p>
        <p>You have been requested to sign the document: <strong>${documentTitle}</strong></p>
        <p>
          <a href="${signingUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Review &amp; Sign Document
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link: ${signingUrl}
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Ondu Sign — One Platform. Secure Signatures.
        </p>
      </div>
    `,
  });
}

export async function sendDocumentCompletedEmail(
  ownerEmail: string,
  ownerName: string,
  documentTitle: string,
  documentId: string
): Promise<void> {
  const documentUrl = `${APP_URL}/documents/${documentId}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `Document signed: ${documentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Ondu Sign</h2>
        <p>Hello ${ownerName},</p>
        <p>All recipients have signed: <strong>${documentTitle}</strong></p>
        <p>
          <a href="${documentUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px;">
            View Signed Document
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Ondu Sign — One Platform. Secure Signatures.
        </p>
      </div>
    `,
  });
}
