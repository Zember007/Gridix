import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

export function useSignatureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const getPoint = (
    e: ReactMouseEvent | ReactTouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e
        ? (e.touches[0]?.clientX ?? 0)
        : (e as ReactMouseEvent).clientX;
    const clientY =
      "touches" in e
        ? (e.touches[0]?.clientY ?? 0)
        : (e as ReactMouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: ReactMouseEvent | ReactTouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const p = getPoint(e, canvas);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (
    e: ReactMouseEvent | ReactTouchEvent,
    strokeStyle: string,
    lineWidth = 3,
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getPoint(e, canvas);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  return {
    canvasRef,
    clearCanvas,
    draw,
    isDrawing,
    setSignatureDataUrl,
    signatureDataUrl,
    startDrawing,
    stopDrawing,
  };
}
