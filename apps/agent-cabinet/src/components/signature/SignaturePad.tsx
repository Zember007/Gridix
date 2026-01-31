import { useEffect, useRef, useState } from "react";
import { Button } from "@gridix/ui";

type Point = { x: number; y: number };

export function SignaturePad({
  className,
  height = 180,
  strokeWidth = 2,
  strokeColor = "#111827",
  backgroundColor = "#ffffff",
  onChange,
}: {
  className?: string;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
  onChange?: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const resizeAndReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));

    const c = canvas.getContext("2d");
    if (!c) return;
    c.scale(ratio, ratio);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.lineWidth = strokeWidth;
    c.strokeStyle = strokeColor;
    c.fillStyle = backgroundColor;
    c.fillRect(0, 0, rect.width, height);
  };

  useEffect(() => {
    // initial paint and on resize
    const onResize = () => resizeAndReset();
    resizeAndReset();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  const clear = () => {
    resizeAndReset();
    drawingRef.current = false;
    lastRef.current = null;
    setHasInk(false);
    onChange?.(null);
  };

  const getPoint = (e: PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawLine = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(to.x, to.y);
    c.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      drawingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      lastRef.current = getPoint(e);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const prev = lastRef.current;
      const next = getPoint(e);
      if (prev) drawLine(prev, next);
      lastRef.current = next;
      if (!hasInk) setHasInk(true);
    };
    const onPointerUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastRef.current = null;
      const dataUrl = toDataUrl();
      onChange?.(dataUrl);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [hasInk, onChange]);

  return (
    <div className={className}>
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <canvas ref={canvasRef} style={{ width: "100%", height }} />
      </div>
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

