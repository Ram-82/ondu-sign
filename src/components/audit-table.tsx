"use client";

interface AuditEntry {
  id: string;
  action: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface AuditTableProps {
  entries: AuditEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  "document.created": "Document created",
  "document.sent": "Sent for signing",
  "document.viewed": "Document viewed",
  "document.completed": "All signatures collected",
  "recipient.signed": "Recipient signed",
};

export function AuditTable({ entries }: AuditTableProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No audit events yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">Action</th>
            <th className="pb-2 pr-4 font-medium">Details</th>
            <th className="pb-2 pr-4 font-medium">IP</th>
            <th className="pb-2 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                {ACTION_LABELS[entry.action] || entry.action}
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {entry.metadata && typeof entry.metadata === "object"
                  ? (entry.metadata as Record<string, unknown>).recipientEmail?.toString() || "-"
                  : "-"}
              </td>
              <td className="py-3 pr-4 text-gray-400 font-mono text-xs">
                {entry.ip || "-"}
              </td>
              <td className="py-3 text-gray-500">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
