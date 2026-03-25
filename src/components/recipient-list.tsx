"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Recipient {
  id?: string;
  email: string;
  name: string;
  order: number;
}

interface RecipientListProps {
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  disabled?: boolean;
}

export function RecipientList({ recipients, onChange, disabled }: RecipientListProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  function addRecipient() {
    if (!email || !name) return;

    const newRecipient: Recipient = {
      email,
      name,
      order: recipients.length + 1,
    };

    onChange([...recipients, newRecipient]);
    setEmail("");
    setName("");
  }

  function removeRecipient(index: number) {
    const updated = recipients
      .filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, order: i + 1 }));
    onChange(updated);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...recipients];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated.map((r, i) => ({ ...r, order: i + 1 })));
  }

  function moveDown(index: number) {
    if (index === recipients.length - 1) return;
    const updated = [...recipients];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated.map((r, i) => ({ ...r, order: i + 1 })));
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Recipients (signing order)</h3>

      {recipients.length > 0 && (
        <div className="space-y-2">
          {recipients.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-400 w-6">{r.order}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-gray-500 truncate">{r.email}</p>
              </div>
              {!disabled && (
                <div className="flex gap-1">
                  <button onClick={() => moveUp(i)} className="p-1 text-gray-400 hover:text-gray-600" title="Move up">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveDown(i)} className="p-1 text-gray-400 hover:text-gray-600" title="Move down">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => removeRecipient(i)} className="p-1 text-red-400 hover:text-red-600" title="Remove">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" size="md" onClick={addRecipient} disabled={!email || !name}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
