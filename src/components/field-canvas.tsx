"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Field {
  id?: string;
  type: "SIGNATURE" | "TEXT" | "DATE";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  recipientId?: string | null;
}

interface Recipient {
  id?: string;
  name: string;
  email: string;
  order: number;
}

interface FieldCanvasProps {
  pdfUrl: string;
  fields: Field[];
  recipients: Recipient[];
  onChange: (fields: Field[]) => void;
  disabled?: boolean;
  pageCount?: number;
}

const FIELD_COLORS: Record<string, string> = {
  SIGNATURE: "border-blue-500 bg-blue-50",
  TEXT: "border-green-500 bg-green-50",
  DATE: "border-purple-500 bg-purple-50",
};

const FIELD_LABELS: Record<string, string> = {
  SIGNATURE: "Sig",
  TEXT: "Text",
  DATE: "Date",
};

export function FieldCanvas({
  pdfUrl,
  fields,
  recipients,
  onChange,
  disabled,
  pageCount = 1,
}: FieldCanvasProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFieldType, setSelectedFieldType] = useState<"SIGNATURE" | "TEXT" | "DATE">("SIGNATURE");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(recipients[0]?.id || "");
  const containerRef = useRef<HTMLDivElement>(null);

  function handleCanvasClick(e: React.MouseEvent) {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const defaultWidth = selectedFieldType === "SIGNATURE" ? 200 : 150;
    const defaultHeight = selectedFieldType === "SIGNATURE" ? 60 : 30;

    const newField: Field = {
      type: selectedFieldType,
      page: currentPage,
      x: Math.round(x),
      y: Math.round(y),
      width: defaultWidth,
      height: defaultHeight,
      required: true,
      recipientId: selectedRecipientId || undefined,
    };

    onChange([...fields, newField]);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  const pageFields = fields.filter((f) => f.page === currentPage);

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1">
            {(["SIGNATURE", "TEXT", "DATE"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFieldType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  selectedFieldType === type
                    ? FIELD_COLORS[type] + " border-current"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {recipients.length > 0 && (
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5"
            >
              <option value="">No recipient</option>
              {recipients.map((r) => (
                <option key={r.id || r.email} value={r.id || ""}>
                  {r.order}. {r.name}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-gray-500">Click on the document to place a field</span>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            Prev
          </Button>
          <span className="text-sm text-gray-600">Page {currentPage} of {pageCount}</span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount}>
            Next
          </Button>
        </div>
      )}

      <div className="relative border rounded-lg overflow-hidden bg-white" style={{ minHeight: 600 }}>
        <iframe
          src={`${pdfUrl}#page=${currentPage}`}
          className="w-full pointer-events-none"
          style={{ height: 800 }}
          title="PDF Preview"
        />

        <div
          ref={containerRef}
          className="absolute inset-0 cursor-crosshair"
          onClick={handleCanvasClick}
        >
          {pageFields.map((field, idx) => {
            const globalIdx = fields.indexOf(field);
            const recipient = recipients.find((r) => (r.id || "") === field.recipientId);

            return (
              <div
                key={idx}
                className={`absolute border-2 rounded flex items-center justify-center text-xs font-medium cursor-default ${FIELD_COLORS[field.type]}`}
                style={{
                  left: field.x,
                  top: field.y,
                  width: field.width,
                  height: field.height,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="opacity-70">{FIELD_LABELS[field.type]}</span>
                {recipient && (
                  <span className="absolute -top-5 left-0 text-[10px] text-gray-500 whitespace-nowrap">
                    {recipient.name}
                  </span>
                )}
                {!disabled && (
                  <button
                    onClick={() => removeField(globalIdx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    x
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
