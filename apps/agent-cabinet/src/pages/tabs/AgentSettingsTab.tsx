import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  GlobalAccountSecuritySection,
  GlobalNotificationSettingsSection,
} from "@gridix/utils/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Button,
} from "@gridix/ui";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

type UserProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  preferred_locale: string;
  person_type: string | null;
  tax_id: string | null;
  legal_address: string | null;
  bank_name: string | null;
  iban: string | null;
  billing_currency: string | null;
  is_vat_payer: boolean | null;
  company_type: string | null;
  registered_office: string | null;
  representative_name: string | null;
  representative_title: string | null;
  signature_path: string | null;
  signature_method: string | null;
  signature_meta: unknown;
};

interface AgentApplicationSettings {
  id: string;
  full_name: string | null;
  company_name: string | null;
  type: string | null;
  tax_id: string | null;
  legal_address: unknown;
  phone: string | null;
  bank_details: unknown;
  agent_company_type: string | null;
  agent_registered_office: string | null;
  agent_representative_name: string | null;
  agent_representative_title: string | null;
  status: string | null;
  agreement_signed_at: unknown;
  commission_rate: unknown;
}

function useMyUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-user-profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserProfileRow | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          [
            "id",
            "email",
            "full_name",
            "company_name",
            "phone",
            "preferred_locale",
            "person_type",
            "tax_id",
            "legal_address",
            "bank_name",
            "iban",
            "billing_currency",
            "is_vat_payer",
            "company_type",
            "registered_office",
            "representative_name",
            "representative_title",
            "signature_path",
            "signature_method",
            "signature_meta",
          ].join(", "),
        )
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as unknown as UserProfileRow;
    },
  });
}

function useAgentContractSettings(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["agent-settings", applicationId],
    queryFn: async (): Promise<AgentApplicationSettings | null> => {
      if (!applicationId) return null;
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "get_agent_settings", application_id: applicationId },
      });
      if (error) throw error;
      const resp = data as {
        success?: boolean;
        application?: AgentApplicationSettings;
      };
      if (!resp?.success || !resp.application) return null;
      return resp.application;
    },
    enabled: !!applicationId,
  });
}

function useMySignedContracts(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["my-signed-contracts", applicationId],
    enabled: !!applicationId,
    queryFn: async (): Promise<
      Array<{
        id: string;
        signed_at: string | null;
        signed_download_url: string | null;
        signed_contract_mime: string | null;
        template_lang: string | null;
      }>
    > => {
      if (!applicationId) return [];
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "list_my_signed_contracts",
          application_id: applicationId,
        },
      });
      if (error) throw error;
      const resp = data as { success?: boolean; contracts?: unknown };
      const list = Array.isArray(resp?.contracts)
        ? (resp.contracts as any[])
        : [];
      return list.map((c) => ({
        id: String(c.id),
        signed_at: c.signed_at ? String(c.signed_at) : null,
        signed_download_url: c.signed_download_url
          ? String(c.signed_download_url)
          : null,
        signed_contract_mime: c.signed_contract_mime
          ? String(c.signed_contract_mime)
          : null,
        template_lang: c.template_lang ? String(c.template_lang) : null,
      }));
    },
  });
}

export function AgentSettingsTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const [saving, setSaving] = useState(false);
  const notificationSaveFnRef = useRef<(() => Promise<void>) | null>(null);

  const onNotificationReady = useCallback(
    (api: { saveNotificationPreferences: () => Promise<void> }) => {
      notificationSaveFnRef.current = api.saveNotificationPreferences;
    },
    [],
  );

  const {
    data: contractData,
    isLoading: contractLoading,
    error: contractError,
  } = useAgentContractSettings(activeWorkspaceId ?? undefined);

  const myProfileQuery = useMyUserProfile(user?.id);
  const [profileForm, setProfileForm] = useState<Partial<UserProfileRow>>({});

  useEffect(() => {
    if (!myProfileQuery.data) return;
    setProfileForm(myProfileQuery.data);
  }, [myProfileQuery.data]);

  const contractsQuery = useMySignedContracts(activeWorkspaceId ?? undefined);

  const saveUserProfile = useCallback(async () => {
    if (!user?.id) return;
    const payload = {
      full_name: profileForm.full_name ?? null,
      company_name: profileForm.company_name ?? null,
      phone: profileForm.phone ?? null,
      preferred_locale: profileForm.preferred_locale ?? "en",
      person_type: profileForm.person_type ?? null,
      tax_id: profileForm.tax_id ?? null,
      legal_address: profileForm.legal_address ?? null,
      bank_name: profileForm.bank_name ?? null,
      iban: profileForm.iban ?? null,
      billing_currency: profileForm.billing_currency ?? null,
      is_vat_payer:
        typeof profileForm.is_vat_payer === "boolean"
          ? profileForm.is_vat_payer
          : null,
      company_type: profileForm.company_type ?? null,
      registered_office: profileForm.registered_office ?? null,
      representative_name: profileForm.representative_name ?? null,
      representative_title: profileForm.representative_title ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("id", user.id);
    if (error) throw error;
    await myProfileQuery.refetch();
  }, [user?.id, profileForm, myProfileQuery]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveUserProfile();
      if (notificationSaveFnRef.current) {
        await notificationSaveFnRef.current();
      }
      toast.success(t("common.settings.profileSaved"));
    } catch (e) {
      console.error("Failed to save settings:", e);
      toast.error(t("common.settings.profileSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const profileLoading = myProfileQuery.isLoading;

  return (
    <>
      <ModuleHeader
        title={t("common.settings.title")}
        subtitle={t("common.settings.subtitle")}
        hideSearch
        primaryAction={{
          label: saving
            ? t("common.settings.savingProfile")
            : t("common.settings.saveAll"),
          icon: <Save size={18} />,
          onClick: handleSaveAll,
        }}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Editable agent profile (user_profiles) */}
        <AgentUserProfileSection
          loading={profileLoading}
          value={profileForm}
          onChange={setProfileForm}
          onSave={async () => {
            try {
              await saveUserProfile();
              toast.success(t("common.settings.profileSaved"));
            } catch (e) {
              console.error("Failed to save profile", e);
              toast.error(t("common.settings.profileSaveError"));
            }
          }}
          t={t}
        />

        {/* Global account security */}
        <GlobalAccountSecuritySection userEmail={user?.email ?? ""} />

        {/* Notification preferences */}
        <GlobalNotificationSettingsSection
          userId={user?.id}
          userEmail={user?.email ?? ""}
          onReady={onNotificationReady}
        />

        {/* Signature (user_profiles.signature_*) */}
        <AgentSignatureSection
          userId={user?.id ?? null}
          existingSignaturePath={myProfileQuery.data?.signature_path ?? null}
          existingMethod={myProfileQuery.data?.signature_method ?? null}
          onUpdated={async () => {
            await myProfileQuery.refetch();
          }}
          t={t}
        />

        {/* Signed contracts (download only) */}
        <AgentSignedContractsSection
          applicationId={activeWorkspaceId ?? null}
          loading={contractsQuery.isLoading}
          error={contractsQuery.error as Error | null}
          contracts={contractsQuery.data ?? []}
          onRefresh={() => void contractsQuery.refetch()}
          t={t}
        />

        {/* Agent contract data (read-only) — only when workspace selected */}
        {activeWorkspaceId ? (
          <AgentContractCard
            data={contractData ?? null}
            loading={contractLoading}
            error={contractError}
            t={t}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="text-base font-medium">
                {t("common.workspace.noActiveTitle")}
              </p>
              <p className="mt-1 text-sm">
                {t("common.workspace.pickInSidebar")}
              </p>
              <p className="mt-4 text-xs">
                {t("common.settings.contractTitle")}{" "}
                {t("common.settings.contractDesc").toLowerCase()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function AgentUserProfileSection(props: {
  loading: boolean;
  value: Partial<UserProfileRow>;
  onChange: (next: Partial<UserProfileRow>) => void;
  onSave: () => Promise<void>;
  t: (key: string) => string;
}) {
  const v = props.value;

  const personType =
    v.person_type === "company" || v.person_type === "individual"
      ? v.person_type
      : "company";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.t("adminSettings.profileInfo")}</CardTitle>
        <CardDescription>
          {props.t("adminSettings.profileInfoDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Person type</Label>
                <Select
                  value={personType}
                  onValueChange={(val) =>
                    props.onChange({ ...v, person_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_locale">Language</Label>
                <Select
                  value={v.preferred_locale ?? "en"}
                  onValueChange={(val) =>
                    props.onChange({ ...v, preferred_locale: val })
                  }
                >
                  <SelectTrigger id="preferred_locale">
                    <SelectValue placeholder="en" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="ru">RU</SelectItem>
                    <SelectItem value="ka">KA</SelectItem>
                    <SelectItem value="he">HE</SelectItem>
                    <SelectItem value="ar">AR</SelectItem>
                    <SelectItem value="tr">TR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {props.t("adminSettings.fullName")}
                </Label>
                <Input
                  id="full_name"
                  value={v.full_name ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  {props.t("adminSettings.companyName")}
                </Label>
                <Input
                  id="company_name"
                  value={v.company_name ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, company_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{props.t("adminSettings.phone")}</Label>
                <Input
                  id="phone"
                  value={v.phone ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">{props.t("adminSettings.taxId")}</Label>
                <Input
                  id="tax_id"
                  value={v.tax_id ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, tax_id: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_address">
                {props.t("adminSettings.companyAddress")}
              </Label>
              <Input
                id="legal_address"
                value={v.legal_address ?? ""}
                onChange={(e) =>
                  props.onChange({ ...v, legal_address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_type">
                  {props.t("common.settings.agentCompanyType")}
                </Label>
                <Input
                  id="company_type"
                  value={v.company_type ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, company_type: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registered_office">
                  {props.t("common.settings.agentRegisteredOffice")}
                </Label>
                <Input
                  id="registered_office"
                  value={v.registered_office ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, registered_office: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rep_name">
                  {props.t("common.settings.agentRepresentativeName")}
                </Label>
                <Input
                  id="rep_name"
                  value={v.representative_name ?? ""}
                  onChange={(e) =>
                    props.onChange({
                      ...v,
                      representative_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rep_title">
                  {props.t("common.settings.agentRepresentativeTitle")}
                </Label>
                <Input
                  id="rep_title"
                  value={v.representative_title ?? ""}
                  onChange={(e) =>
                    props.onChange({
                      ...v,
                      representative_title: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">
                  {props.t("adminSettings.bankName")}
                </Label>
                <Input
                  id="bank_name"
                  value={v.bank_name ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, bank_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">{props.t("adminSettings.iban")}</Label>
                <Input
                  id="iban"
                  value={v.iban ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, iban: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Billing currency</Label>
                <Input
                  value={v.billing_currency ?? ""}
                  onChange={(e) =>
                    props.onChange({ ...v, billing_currency: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">
                    {props.t("adminSettings.vatPayer")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {props.t("adminSettings.billingInfoDesc")}
                  </div>
                </div>
                <Switch
                  checked={Boolean(v.is_vat_payer)}
                  onCheckedChange={(checked) =>
                    props.onChange({ ...v, is_vat_payer: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void props.onSave()}>
                {props.t("adminSettings.save")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AgentSignatureSection(props: {
  userId: string | null;
  existingSignaturePath: string | null;
  existingMethod: string | null;
  onUpdated: () => Promise<void>;
  t: (key: string) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload">(
    "draw",
  );
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [uploadedSignatureDataUrl, setUploadedSignatureDataUrl] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (props.existingMethod === "draw" || props.existingMethod === "upload") {
      setSignatureMethod(props.existingMethod);
    }
  }, [props.existingMethod]);

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
    return { x: clientX - rect.left, y: clientY - rect.top };
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

  const draw = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getPoint(e, canvas);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
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
      toast.error("Missing signature");
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
      toast.success("Signature updated");
      await props.onUpdated();
    } catch (e) {
      console.error("Failed to update signature", e);
      toast.error("Failed to update signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.t("agent.application.signature")}</CardTitle>
        <CardDescription>
          {props.t("common.settings.contractDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant={signatureMethod === "draw" ? "default" : "outline"}
            onClick={() => setSignatureMethod("draw")}
          >
            {props.t("agent.application.drawSignature")}
          </Button>
          <Button
            type="button"
            variant={signatureMethod === "upload" ? "default" : "outline"}
            onClick={() => setSignatureMethod("upload")}
          >
            {props.t("agent.application.uploadSignature")}
          </Button>
        </div>

        {signatureMethod === "draw" ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
            <canvas
              ref={canvasRef}
              width={900}
              height={360}
              className="h-64 w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <Button
              type="button"
              variant="outline"
              className="absolute right-4 top-4"
              onClick={clearCanvas}
            >
              {props.t("agent.application.clear")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  void onUploadSignature(e.target.files?.[0] ?? null)
                }
              />
              {uploadedSignatureDataUrl && (
                <div className="mt-4">
                  <img
                    src={uploadedSignatureDataUrl}
                    alt="signature"
                    className="mx-auto h-28 object-contain mix-blend-multiply"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => void saveSignature()} disabled={saving}>
            {saving
              ? props.t("adminSettings.saving")
              : props.t("adminSettings.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentSignedContractsSection(props: {
  applicationId: string | null;
  loading: boolean;
  error: Error | null;
  contracts: Array<{
    id: string;
    signed_at: string | null;
    signed_download_url: string | null;
    signed_contract_mime: string | null;
    template_lang: string | null;
  }>;
  onRefresh: () => void;
  t: (key: string) => string;
}) {
  if (!props.applicationId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed contracts</CardTitle>
        <CardDescription>
          Download the contracts generated during signing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={props.onRefresh}>
            Refresh
          </Button>
        </div>

        {props.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : props.error ? (
          <div className="text-sm text-destructive">
            Failed to load contracts
          </div>
        ) : props.contracts.length === 0 ? (
          <div className="text-sm text-muted-foreground">No contracts yet.</div>
        ) : (
          <div className="space-y-2">
            {props.contracts.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    Contract{" "}
                    {c.template_lang
                      ? `(${c.template_lang.toUpperCase()})`
                      : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.signed_at ?? "—"}{" "}
                    {c.signed_contract_mime
                      ? `• ${c.signed_contract_mime}`
                      : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" disabled={!c.signed_download_url}>
                    <a
                      href={c.signed_download_url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentContractCard({
  data,
  loading,
  error,
  t,
}: {
  data: AgentApplicationSettings | null;
  loading: boolean;
  error: Error | null;
  t: (key: string) => string;
}) {
  const formatValue = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {t("common.settings.loadError")}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const fields: Array<{ label: string; value: unknown }> = [
    { label: t("common.settings.fullName"), value: data.full_name },
    { label: t("common.settings.companyName"), value: data.company_name },
    { label: t("common.settings.type"), value: data.type },
    { label: t("common.settings.taxId"), value: data.tax_id },
    { label: t("common.settings.legalAddress"), value: data.legal_address },
    { label: t("common.settings.phone"), value: data.phone },
    {
      label: t("common.settings.agentCompanyType"),
      value: data.agent_company_type,
    },
    {
      label: t("common.settings.agentRegisteredOffice"),
      value: data.agent_registered_office,
    },
    {
      label: t("common.settings.agentRepresentativeName"),
      value: data.agent_representative_name,
    },
    {
      label: t("common.settings.agentRepresentativeTitle"),
      value: data.agent_representative_title,
    },
    { label: t("common.settings.status"), value: data.status },
    {
      label: t("common.settings.agreementSignedAt"),
      value: data.agreement_signed_at,
    },
    { label: t("common.settings.commissionRate"), value: data.commission_rate },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.settings.contractTitle")}</CardTitle>
        <CardDescription>{t("common.settings.contractDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-sm font-medium text-muted-foreground">
                {f.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatValue(f.value) ?? "—"}
              </dd>
            </div>
          ))}
        </div>

        {data.bank_details !== null && data.bank_details !== undefined && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-muted-foreground">
              {t("common.settings.bankDetails")}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-foreground">
              {formatValue(data.bank_details) ?? "—"}
            </dd>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
