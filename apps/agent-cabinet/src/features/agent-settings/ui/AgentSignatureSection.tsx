import { useEffect, useState } from "react";
import { ADMIN_THEME } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@gridix/ui";
import { toast } from "sonner";
import { resolveSignatureUrl } from "../lib/signature-url";
import { useSignatureCanvas } from "../model/useSignatureCanvas";
import type { AgentSignatureSectionProps } from "./types";

export function AgentSignatureSection(props: AgentSignatureSectionProps) {
  const {
    canvasRef,
    clearCanvas,
    draw,
    setSignatureDataUrl,
    signatureDataUrl,
    startDrawing,
    stopDrawing,
  } = useSignatureCanvas();

  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload">(
    "draw",
  );
  const [uploadedSignatureDataUrl, setUploadedSignatureDataUrl] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [showExisting, setShowExisting] = useState(
    !!props.existingSignaturePath,
  );
  const existingSignatureUrl = props.existingSignaturePath
    ? resolveSignatureUrl(props.existingSignaturePath)
    : null;

  useEffect(() => {
    if (props.existingMethod === "draw" || props.existingMethod === "upload") {
      setSignatureMethod(props.existingMethod);
    }
  }, [props.existingMethod]);

  useEffect(() => {
    if (props.existingSignaturePath) {
      setShowExisting(true);
    }
  }, [props.existingSignaturePath]);

  const onUploadSignature = async (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      setUploadedSignatureDataUrl(url);
      setSignatureMethod("upload");
    };
    reader.readAsDataURL(file);
  };

  const finalSignatureDataUrl =
    signatureMethod === "draw" ? signatureDataUrl : uploadedSignatureDataUrl;

  const saveSignature = async () => {
    if (!props.userId) return;
    if (!finalSignatureDataUrl) {
      toast.error(props.t("common.agent.application.missingSignature"));
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "update_my_signature",
          signature_data_url: finalSignatureDataUrl,
          signature_method: signatureMethod,
        },
      });
      if (error) throw error;
      const ok = (data as any)?.success === true;
      if (!ok) throw new Error("Failed");
      toast.success(props.t("common.agent.application.signatureUpdated"));
      await props.onUpdated();
      setShowExisting(true);
      setSignatureDataUrl(null);
      setUploadedSignatureDataUrl(null);
      clearCanvas();
    } catch (e) {
      console.error("Failed to update signature", e);
      toast.error(props.t("common.agent.application.signatureUpdateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.t("common.agent.application.signature")}</CardTitle>
        <CardDescription>
          {props.t("common.settings.contractDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showExisting && existingSignatureUrl ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] p-8">
              <img
                src={existingSignatureUrl}
                alt={props.t("common.agent.application.signature")}
                className="max-h-40 w-auto object-contain mix-blend-multiply"
              />
              <p className="mt-4 text-xs font-medium text-[var(--admin-text-muted)]">
                {props.t("common.agent.application.currentSignaturePrompt")}
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExisting(false)}
                className="rounded-xl border-[var(--admin-border)]"
              >
                {props.t("common.agent.application.replaceSignature")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant={signatureMethod === "draw" ? "default" : "outline"}
                onClick={() => setSignatureMethod("draw")}
                className="min-w-[120px] flex-1 rounded-xl sm:min-w-0 sm:flex-none"
              >
                {props.t("common.agent.application.drawSignature")}
              </Button>
              <Button
                type="button"
                variant={signatureMethod === "upload" ? "default" : "outline"}
                onClick={() => setSignatureMethod("upload")}
                className="min-w-[120px] flex-1 rounded-xl sm:min-w-0 sm:flex-none"
              >
                {props.t("common.agent.application.uploadSignature")}
              </Button>
              {props.existingSignaturePath && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowExisting(true)}
                  className="w-full justify-center text-[var(--admin-text-muted)] sm:ml-auto sm:w-auto"
                >
                  {props.t("common.common.cancel")}
                </Button>
              )}
            </div>

            {signatureMethod === "draw" ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--admin-border)] bg-[var(--admin-card-background)] shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={360}
                  className="h-64 w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={(event) => draw(event, ADMIN_THEME.textPrimary)}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={(event) => draw(event, ADMIN_THEME.textPrimary)}
                  onTouchEnd={stopDrawing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-4 top-4 rounded-lg bg-[var(--admin-card-background)] backdrop-blur"
                  onClick={clearCanvas}
                >
                  {props.t("common.agent.application.clear")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-card-background)] p-12 transition-colors hover:border-[var(--admin-primary)]">
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs cursor-pointer"
                    onChange={(e) =>
                      void onUploadSignature(e.target.files?.[0] ?? null)
                    }
                  />
                  <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                    {props.t("common.agent.application.uploadHint")}
                  </p>
                  {uploadedSignatureDataUrl && (
                    <div className="mt-6 rounded-lg border border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] p-4">
                      <img
                        src={uploadedSignatureDataUrl}
                        alt={props.t(
                          "common.agent.application.signaturePreviewAlt",
                        )}
                        className="h-28 object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => void saveSignature()}
                disabled={saving || !finalSignatureDataUrl}
                className="h-11 rounded-xl bg-[var(--admin-primary)] px-8 font-bold shadow-lg hover:bg-[var(--admin-primary-hover)]"
              >
                {saving
                  ? props.t("adminSettings.saving")
                  : props.t("adminSettings.save")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
