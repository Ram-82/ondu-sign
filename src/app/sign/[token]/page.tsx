"use client";

import { useState, useEffect, use } from "react";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";

interface Field {
  id: string;
  type: "SIGNATURE" | "TEXT" | "DATE";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
}

interface SigningData {
  recipient: { id: string; name: string; email: string };
  document: { id: string; title: string };
  fields: Field[];
  pdfUrl: string;
}

interface FieldValue {
  fieldId: string;
  value: string;
  type: "DRAWN" | "TYPED";
}

export default function SigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<SigningData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fieldValues, setFieldValues] = useState<Map<string, FieldValue>>(new Map());
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      })
      .catch(() => setError("Failed to load signing session"))
      .finally(() => setLoading(false));
  }, [token]);

  function handleFieldValue(fieldId: string, value: string, type: "DRAWN" | "TYPED") {
    const updated = new Map(fieldValues);
    updated.set(fieldId, { fieldId, value, type });
    setFieldValues(updated);
    setActiveField(null);
  }

  function handleTextFieldChange(fieldId: string, value: string) {
    const updated = new Map(fieldValues);
    updated.set(fieldId, { fieldId, value, type: "TYPED" });
    setFieldValues(updated);
  }

  async function handleSubmit() {
    if (!data) return;

    const requiredFields = data.fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !fieldValues.has(f.id));

    if (missingFields.length > 0) {
      setError("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const signatures = Array.from(fieldValues.values()).map((fv) => ({
        fieldId: fv.fieldId,
        value: fv.value,
        type: fv.type,
      }));

      const res = await fetch(`/api/sign/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatures }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to submit signatures");
        return;
      }

      setCompleted(true);
    } catch {
      setError("Failed to submit signatures");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading signing session...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Document Signed</h1>
          <p className="text-gray-600">
            Thank you for signing. All parties will be notified once all signatures are collected.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const FIELD_COLORS: Record<string, string> = {
    SIGNATURE: "border-blue-500 bg-blue-50",
    TEXT: "border-green-500 bg-green-50",
    DATE: "border-purple-500 bg-purple-50",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold">Ondu Sign</span>
          </div>
          <div className="text-sm text-gray-600">
            Signing as <strong>{data.recipient.name}</strong>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold">{data.document.title}</h1>
          <p className="text-sm text-gray-500">
            Please review the document and complete all fields below.
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-4 relative" style={{ minHeight: 600 }}>
              <iframe
                src={data.pdfUrl}
                className="w-full pointer-events-none"
                style={{ height: 800 }}
                title="Document"
              />
              <div className="absolute inset-0 pointer-events-none p-4">
                {data.fields.map((field) => {
                  const hasValue = fieldValues.has(field.id);
                  return (
                    <div
                      key={field.id}
                      className={`absolute border-2 rounded pointer-events-auto cursor-pointer ${
                        hasValue ? "border-green-500 bg-green-50" : FIELD_COLORS[field.type]
                      }`}
                      style={{
                        left: field.x,
                        top: field.y,
                        width: field.width,
                        height: field.height,
                      }}
                      onClick={() => {
                        if (field.type === "SIGNATURE") {
                          setActiveField(field.id);
                        }
                      }}
                    >
                      {field.type === "SIGNATURE" && !hasValue && (
                        <span className="text-xs text-blue-500 flex items-center justify-center h-full">
                          Click to sign
                        </span>
                      )}
                      {field.type === "SIGNATURE" && hasValue && (
                        <span className="text-xs text-green-600 flex items-center justify-center h-full">
                          Signed
                        </span>
                      )}
                      {field.type === "TEXT" && (
                        <input
                          type="text"
                          className="w-full h-full px-2 text-sm bg-transparent border-none focus:outline-none"
                          placeholder="Enter text"
                          value={fieldValues.get(field.id)?.value || ""}
                          onChange={(e) => handleTextFieldChange(field.id, e.target.value)}
                        />
                      )}
                      {field.type === "DATE" && (
                        <input
                          type="date"
                          className="w-full h-full px-2 text-sm bg-transparent border-none focus:outline-none"
                          value={fieldValues.get(field.id)?.value || ""}
                          onChange={(e) => handleTextFieldChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {activeField && (
              <SignaturePad
                onSave={(value, type) => handleFieldValue(activeField, value, type)}
                onCancel={() => setActiveField(null)}
              />
            )}

            <div className="bg-white rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-medium">Fields to complete</h3>
              {data.fields.map((field) => (
                <div
                  key={field.id}
                  className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                    fieldValues.has(field.id) ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <span>{field.type}</span>
                  <span className={fieldValues.has(field.id) ? "text-green-600" : "text-gray-400"}>
                    {fieldValues.has(field.id) ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Complete Signing"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
