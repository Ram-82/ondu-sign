"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { AuditTable } from "@/components/audit-table";

interface AuditEntry {
  id: string;
  action: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.document) {
          // We need an audit API - for now show from document
          fetchAudit();
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchAudit() {
    // The audit entries come from a separate endpoint
    // For MVP, we'll add this as an API
    try {
      const res = await fetch(`/api/documents/${id}/audit`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch {
      // Audit not available
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/documents/${id}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          &larr; Back to document
        </Link>
        <h1 className="text-2xl font-bold">Audit Log</h1>
      </div>

      <div className="bg-white rounded-xl border p-6">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <AuditTable entries={entries} />
        )}
      </div>
    </div>
  );
}
