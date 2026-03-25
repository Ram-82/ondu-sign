"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/document-upload";

interface Document {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  recipients: { id: string; name: string; email: string; status: string }[];
  _count: { fields: number };
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok) setDocuments(data.documents);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadComplete(data: { s3Key: string; fileName: string; title: string }) {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      setShowUpload(false);
      router.push(`/documents/${result.document.id}`);
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? "Cancel" : "Upload Document"}
        </Button>
      </div>

      {showUpload && (
        <div className="mb-8">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No documents yet</p>
          <p className="text-sm">Upload a PDF to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Fields</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[doc.status] || ""}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{doc.recipients.length}</td>
                  <td className="px-4 py-3 text-gray-500">{doc._count.fields}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
