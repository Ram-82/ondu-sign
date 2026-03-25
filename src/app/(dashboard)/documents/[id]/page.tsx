"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldCanvas } from "@/components/field-canvas";
import { RecipientList } from "@/components/recipient-list";

interface DocumentData {
  id: string;
  title: string;
  fileName: string;
  status: string;
  s3Key: string;
  finalS3Key: string | null;
  recipients: {
    id: string;
    email: string;
    name: string;
    order: number;
    status: string;
    signedAt: string | null;
  }[];
  fields: {
    id: string;
    type: "SIGNATURE" | "TEXT" | "DATE";
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    recipientId: string | null;
  }[];
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fields, setFields] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDocument(data.document);
        setPdfUrl(data.pdfUrl);
        setFinalPdfUrl(data.finalPdfUrl);
        setFields(data.document.fields);
        setRecipients(data.document.recipients);
      } else {
        setError(data.error || "Failed to load document");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveFieldsAndRecipients() {
    setSaving(true);
    setError("");

    try {
      const [fieldsRes, recipientsRes] = await Promise.all([
        fetch(`/api/documents/${id}/fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        }),
        fetch(`/api/documents/${id}/recipients`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients }),
        }),
      ]);

      if (!fieldsRes.ok || !recipientsRes.ok) {
        const fieldsData = await fieldsRes.json();
        const recipientsData = await recipientsRes.json();
        setError(fieldsData.error || recipientsData.error || "Failed to save");
        return;
      }

      await fetchDocument();
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function sendForSigning() {
    setSending(true);
    setError("");

    try {
      // Save first
      await saveFieldsAndRecipients();

      const res = await fetch(`/api/documents/${id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }

      await fetchDocument();
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this document?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/documents");
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!document) return <div className="text-red-600">{error || "Document not found"}</div>;

  const isDraft = document.status === "DRAFT";
  const isCompleted = document.status === "COMPLETED";

  const recipientStatusColors: Record<string, string> = {
    PENDING: "text-gray-500",
    SENT: "text-yellow-600",
    VIEWED: "text-blue-600",
    SIGNED: "text-green-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            &larr; Back to documents
          </Link>
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <p className="text-sm text-gray-500">{document.fileName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDraft ? "bg-gray-100 text-gray-700" :
            isCompleted ? "bg-green-100 text-green-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {document.status}
          </span>
          <Link href={`/documents/${id}/audit`}>
            <Button variant="ghost" size="sm">Audit Log</Button>
          </Link>
          {isDraft && (
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Document Preview & Fields</h2>
            {pdfUrl && (
              <FieldCanvas
                pdfUrl={pdfUrl}
                fields={fields}
                recipients={recipients}
                onChange={setFields}
                disabled={!isDraft}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <RecipientList
              recipients={recipients}
              onChange={setRecipients}
              disabled={!isDraft}
            />

            {!isDraft && document.recipients.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase">Signing Status</h4>
                {document.recipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>{r.name}</span>
                    <span className={`font-medium ${recipientStatusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isDraft && (
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <Button className="w-full" variant="secondary" onClick={saveFieldsAndRecipients} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                className="w-full"
                onClick={sendForSigning}
                disabled={sending || recipients.length === 0 || fields.length === 0}
              >
                {sending ? "Sending..." : "Send for Signing"}
              </Button>
              {(recipients.length === 0 || fields.length === 0) && (
                <p className="text-xs text-gray-500">
                  Add at least one recipient and one field to send.
                </p>
              )}
            </div>
          )}

          {isCompleted && finalPdfUrl && (
            <div className="bg-white rounded-xl border p-4">
              <a
                href={finalPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Download Signed PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
