import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// Custom Event for dispatching toasts from anywhere
export const showToast = (type: ToastType, title: string, message?: string) => {
  const event = new CustomEvent("gridix-toast", {
    detail: { type, title, message },
  });
  window.dispatchEvent(event);
};

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...detail, id }]);

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("gridix-toast", handleToastEvent);
    return () => window.removeEventListener("gridix-toast", handleToastEvent);
  }, []);

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg duration-300"
        >
          <div
            className={`mt-0.5 ${
              toast.type === "success"
                ? "text-green-500"
                : toast.type === "error"
                  ? "text-red-500"
                  : "text-blue-500"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 size={18} />}
            {toast.type === "error" && <AlertCircle size={18} />}
            {toast.type === "info" && <Info size={18} />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
            {toast.message && (
              <p className="mt-1 text-xs text-slate-500">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
