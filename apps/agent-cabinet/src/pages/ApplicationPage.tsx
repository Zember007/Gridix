import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Textarea,
} from "@gridix/ui";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { setActiveApplicationId } from "@/shared/lib/agentContext";

type ContractFile = { name: string; url: string; path: string };

type AgentApplication = {
  id: string;
  developer_user_id: string | null;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  agreement_signed: boolean | null;
  signature_url?: string | null;
  signed_contract_url?: string | null;
  contract_template_path?: string | null;
};

export default function ApplicationPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const inviteDeveloperId = searchParams.get("developer_id");
  const explicitApplicationId = searchParams.get("application_id");

  const [developerId, setDeveloperId] = useState(inviteDeveloperId ?? "");
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    bank_details: "",
  });

  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload">("draw");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractFile | null>(null);
  const [renderedContractUrl, setRenderedContractUrl] = useState<string | null>(null);
  const [renderedContractMime, setRenderedContractMime] = useState<string | null>(null);
  const [renderingContract, setRenderingContract] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const myAppsQuery = useQuery({
    queryKey: ["my_applications"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_my_applications" },
      });
      if (error) throw error;
      return (data?.applications ?? []) as AgentApplication[];
    },
  });

  const currentApplication = useMemo(() => {
    const list = myAppsQuery.data ?? [];
    if (explicitApplicationId) return list.find((a) => a.id === explicitApplicationId) ?? null;
    if (developerId) return list.find((a) => String(a.developer_user_id) === developerId) ?? null;
    return list[0] ?? null;
  }, [myAppsQuery.data, explicitApplicationId, developerId]);

  useEffect(() => {
    if (!currentApplication) return;
    setForm((prev) => ({
      ...prev,
      full_name: currentApplication.full_name ?? prev.full_name,
      email: currentApplication.email ?? prev.email,
      phone: currentApplication.phone ?? prev.phone,
    }));
  }, [currentApplication]);

  const contractsQuery = useQuery({
    queryKey: ["contracts", developerId],
    enabled: !!developerId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_contracts", developer_id: developerId },
      });
      if (error) throw error;
      return (data?.contracts ?? []) as ContractFile[];
    },
  });

  const ensureApplication = async (): Promise<string> => {
    if (!developerId) throw new Error("developer_id is required");
    const { data, error } = await supabase.functions.invoke("agent-program", {
      body: {
        action: "submit_application",
        developer_id: developerId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        bank_details: { details: form.bank_details },
      },
    });
    if (error) throw error;
    if (!data?.success || !data?.data?.id) throw new Error(data?.error || "Failed to submit application");
    const id = String(data.data.id);
    setActiveApplicationId(id);
    await myAppsQuery.refetch();
    return id;
  };

  const onUploadSignature = async (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      setUploadPreview(url);
      setSignatureDataUrl(url);
      setSignatureMethod("upload");
    };
    reader.readAsDataURL(file);
  };

  const canSign = signatureDataUrl && signatureDataUrl.startsWith("data:image/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t("common.nav.application")}</h1>
        <p className="text-sm text-slate-500">{t("common.agent.application.title")}</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{t("common.agent.selectDeveloper")}</CardTitle>
          <CardDescription>Paste developer_id from invite link if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={developerId} onChange={(e) => setDeveloperId(e.target.value)} placeholder="developer_id" />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{t("common.agent.application.title")}</CardTitle>
          <CardDescription>
            Status:{" "}
            <strong>
              {currentApplication
                ? String(currentApplication.status)
                : "—"}
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("common.agent.application.fullName")}</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.auth.email")}</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.agent.application.phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.agent.application.bankDetails")}</Label>
              <Textarea
                value={form.bank_details}
                onChange={(e) => setForm({ ...form, bank_details: e.target.value })}
              />
            </div>
          </div>

          <Button
            disabled={submitting || !developerId || !form.full_name || !form.email || !form.phone}
            onClick={async () => {
              try {
                setSubmitting(true);
                const id = await ensureApplication();
                toast.success("Saved", { description: `Application ID: ${id}` });
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || "Failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? t("common.common.loading") : t("common.agent.application.submit")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{t("common.agent.application.agreements")}</CardTitle>
          <CardDescription>Choose a template and preview it with your data before signing.</CardDescription>
        </CardHeader>
        <CardContent>
          {contractsQuery.isLoading ? (
            <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
          ) : (contractsQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No contracts found.</div>
          ) : (
            <ul className="space-y-2">
              {(contractsQuery.data ?? []).map((c) => (
                <li key={c.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.path}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={selectedContract?.path === c.path ? "default" : "outline"}
                      onClick={() => {
                        setSelectedContract(c);
                        setRenderedContractUrl(null);
                        setRenderedContractMime(null);
                        setAccepted(false);
                      }}
                    >
                      {selectedContract?.path === c.path ? "Selected" : "Select"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(c.url, "_blank", "noopener,noreferrer")}
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={renderingContract || !selectedContract}
                onClick={async () => {
                  if (!selectedContract) return;
                  try {
                    setRenderingContract(true);
                    const applicationId = currentApplication?.id ?? (await ensureApplication());
                    const { data, error } = await supabase.functions.invoke("agent-program", {
                      body: {
                        action: "render_contract",
                        application_id: applicationId,
                        contract_path: selectedContract.path,
                      },
                    });
                    if (error) throw error;
                    if (!data?.success) throw new Error(data?.error || "Failed to render contract");
                    setRenderedContractUrl(typeof data?.url === "string" ? data.url : null);
                    setRenderedContractMime(typeof data?.mime === "string" ? data.mime : null);
                    toast.success("Contract preview generated");
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message || "Failed to render contract");
                  } finally {
                    setRenderingContract(false);
                  }
                }}
              >
                {renderingContract ? t("common.common.loading") : "Preview with my data"}
              </Button>

              {renderedContractUrl ? (
                <Button
                  variant="outline"
                  onClick={() => window.open(renderedContractUrl, "_blank", "noopener,noreferrer")}
                >
                  Open preview
                </Button>
              ) : null}
            </div>

            {renderedContractUrl && renderedContractMime === "application/pdf" ? (
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <iframe title="Contract preview" src={renderedContractUrl} className="h-[520px] w-full" />
              </div>
            ) : null}

            {currentApplication?.signed_contract_url ? (
              <div className="text-sm">
                Signed contract:{" "}
                <a
                  className="font-bold underline"
                  href={currentApplication.signed_contract_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{t("common.agent.application.signature")}</CardTitle>
          <CardDescription>Draw your signature or upload an image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="accept-agreement"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
            />
            <Label htmlFor="accept-agreement">
              I have read and accept the agreement (variables will be filled with my data).
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              variant={signatureMethod === "draw" ? "default" : "outline"}
              onClick={() => {
                setSignatureMethod("draw");
                setUploadPreview(null);
                setSignatureDataUrl(null);
              }}
            >
              {t("common.agent.application.drawSignature")}
            </Button>
            <Button
              variant={signatureMethod === "upload" ? "default" : "outline"}
              onClick={() => {
                setSignatureMethod("upload");
                setSignatureDataUrl(null);
              }}
            >
              {t("common.agent.application.uploadSignature")}
            </Button>
          </div>

          {signatureMethod === "draw" ? (
            <SignaturePad onChange={(url) => setSignatureDataUrl(url)} />
          ) : (
            <div className="space-y-2">
              <Input type="file" accept="image/png,image/jpeg" onChange={(e) => void onUploadSignature(e.target.files?.[0] ?? null)} />
              {uploadPreview ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <img src={uploadPreview} alt="Signature preview" className="max-h-40 w-auto" />
                </div>
              ) : null}
            </div>
          )}

          <Button
            disabled={signing || !canSign || !accepted || !selectedContract}
            onClick={async () => {
              try {
                setSigning(true);
                const applicationId = currentApplication?.id ?? (await ensureApplication());
                const { data, error } = await supabase.functions.invoke("agent-program", {
                  body: {
                    action: "sign_agreement",
                    application_id: applicationId,
                    signature_method: signatureMethod,
                    signature_data_url: signatureDataUrl,
                    accepted: true,
                    contract_template_path: selectedContract?.path ?? null,
                  },
                });
                if (error) throw error;
                if (!data?.success) throw new Error(data?.error || "Failed to sign");
                await myAppsQuery.refetch();
                toast.success("Signed");
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || "Failed to sign");
              } finally {
                setSigning(false);
              }
            }}
          >
            {signing ? t("common.common.loading") : t("common.agent.application.sign")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

