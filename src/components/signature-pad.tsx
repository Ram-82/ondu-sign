"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (value: string, type: "DRAWN" | "TYPED") => void;
  onCancel?: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedValue, setTypedValue] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    isDrawingRef.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    isDrawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  }

  function handleSave() {
    if (mode === "type") {
      if (!typedValue.trim()) return;
      onSave(typedValue.trim(), "TYPED");
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl, "DRAWN");
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("draw")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            mode === "draw" ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode("type")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            mode === "type" ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <div>
          <canvas
            ref={canvasRef}
            className="w-full h-32 border rounded-lg cursor-crosshair bg-white touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <button onClick={clearCanvas} className="mt-1 text-xs text-gray-500 hover:text-gray-700">
            Clear
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={typedValue}
          onChange={(e) => setTypedValue(e.target.value)}
          placeholder="Type your signature"
          className="w-full px-3 py-3 border rounded-lg text-xl italic font-serif focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        )}
        <Button size="sm" onClick={handleSave}>Apply Signature</Button>
      </div>
    </div>
  );
}
