import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Building2, User, Download } from "lucide-react";

type Step = "details" | "signature" | "contracts" | "success";

type ContractTemplate = {
  id: number;
  name: string;
  lang: string | null;
  storage_path: string;
  content_html: string | null;
  url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DeveloperAssets = {
  signature_path: string | null;
  signature_url: string | null;
  stamp_path: string | null;
  stamp_url: string | null;
};

type DeveloperProfile = {
  full_name: string | null;
  company_name: string | null;
  tax_id: string | null;
  legal_address: string | null;
  phone: string | null;
  email: string | null;
};

type ProgramSettings = {
  default_commission_rate: number | null;
  lead_lock_days: number | null;
  payout_terms: string | null;
  products_description: string | null;
  territory: string | null;
  exclusivity: string | null;
  agreement_effective_date: string | null;
  agreement_end_date: string | null;
  force_majeure_weeks: number | null;
  originals_count: number | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (
      cur &&
      typeof cur === "object" &&
      p in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function renderHtmlTemplate(
  template: string,
  payload: Record<string, unknown>,
): string {
  if (!template) return "";

  // Raw: triple braces
  const withRaw = template.replace(
    /\{\{\{\s*([\w.]+)\s*\}\}\}/g,
    (_m: string, key: string) => {
      const v = resolvePath(payload, key);
      if (v === null || v === undefined) return "";
      return String(v);
    },
  );

  // Escaped: double braces
  return withRaw.replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_m: string, key: string) => {
      const v = resolvePath(payload, key);
      if (v === null || v === undefined) return "";
      return escapeHtml(String(v));
    },
  );
}

export default function AgentApplicationPage() {
  const [searchParams] = useSearchParams();
  const developerId = searchParams.get("developer_id");
  const { language, t } = useLanguage();
  const [step, setStep] = useState<Step>("details");

  const [loading, setLoading] = useState(false);

  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [developerAssets, setDeveloperAssets] = useState<DeveloperAssets>({
    signature_path: null,
    signature_url: null,
    stamp_path: null,
    stamp_url: null,
  });
  const [developerProfile, setDeveloperProfile] =
    useState<DeveloperProfile | null>(null);
  const [programSettings, setProgramSettings] =
    useState<ProgramSettings | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    company_name: "",
    tax_id: "",
    phone: "",
    legal_address: "",
    bank_details: "",
    agent_company_type: "",
    agent_registered_office: "",
    agent_representative_name: "",
    agent_representative_title: "",
  });

  const [personType, setPersonType] = useState<"company" | "individual">(
    "company",
  );

  // Existing user check (email onBlur) + password sign-in (only if user exists)
  const [authUserExists, setAuthUserExists] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailBlocked, setEmailBlocked] = useState(false);
  const lastEmailCheckRef = useRef<string>("");
  const emailCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Signature state (draw/upload)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload">(
    "draw",
  );
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [uploadedSignatureDataUrl, setUploadedSignatureDataUrl] = useState<
    string | null
  >(null);

  // Contract selection state
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedTemplateByLang, setSelectedTemplateByLang] = useState<
    Record<string, string>
  >({});
  const [acceptedAgreements, setAcceptedAgreements] = useState(false);

  // Signed contracts returned after successful submission (for download on success screen)
  const [signedContractsResult, setSignedContractsResult] = useState<
    Array<{
      contract_template_path: string;
      signed_contract_path: string;
      signed_contract_mime: string;
      signed_download_url?: string | null;
      template_lang?: string | null;
      template_name?: string | null;
    }>
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!developerId) return;
      setTemplatesLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "agent-program",
          {
            body: {
              action: "list_contract_templates_public",
              developer_id: developerId,
            },
          },
        );

        if (error) throw error;

        const nextTemplates = (
          (data?.templates ?? []) as ContractTemplate[]
        ).filter((t) => t && typeof t.storage_path === "string");
        setTemplates(nextTemplates);
        setDeveloperAssets((data?.developer_assets ?? null) as DeveloperAssets);
        setDeveloperProfile(
          (data?.developer_profile ?? null) as DeveloperProfile | null,
        );
        setProgramSettings(
          (data?.program_settings ?? null) as ProgramSettings | null,
        );

        // Initialize selection: pick 1 template per lang and preselect all langs
        const langs = Array.from(
          new Set(
            nextTemplates
              .map((t) =>
                typeof t.lang === "string" && t.lang ? t.lang : null,
              )
              .filter((x): x is string => !!x),
          ),
        ).sort();
        setSelectedLangs(langs);

        const byLang: Record<string, ContractTemplate[]> = {};
        for (const t of nextTemplates) {
          const l = typeof t.lang === "string" && t.lang ? t.lang : null;
          if (!l) continue;
          if (!byLang[l]) byLang[l] = [];
          byLang[l]!.push(t);
        }
        const defaultSelection: Record<string, string> = {};
        for (const l of langs) {
          const first = byLang[l]?.[0];
          if (first?.storage_path) defaultSelection[l] = first.storage_path;
        }
        setSelectedTemplateByLang(defaultSelection);
      } catch (e: any) {
        console.error("Error loading contract templates:", e);
        setTemplates([]);
        setDeveloperAssets({
          signature_path: null,
          signature_url: null,
          stamp_path: null,
          stamp_url: null,
        });
        setDeveloperProfile(null);
        setProgramSettings(null);
      } finally {
        setTemplatesLoading(false);
      }
    };
    void load();
  }, [developerId]);

  const checkExistingUserByEmail = async (emailValue: string) => {
    const emailNorm = emailValue.trim().toLowerCase();
    if (!emailNorm) return;
    if (lastEmailCheckRef.current === emailNorm) return;
    lastEmailCheckRef.current = emailNorm;
    try {
      setEmailCheckLoading(true);
      setEmailBlocked(false);
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "check_auth_user_exists", email: emailNorm },
      });
      if (error) throw error;
      setAuthUserExists(!!data?.exists);
      const at =
        typeof data?.account_type === "string"
          ? String(data.account_type)
          : null;
      if (data?.exists === true && at && at !== "agent") {
        setEmailBlocked(true);
        toast.error(t("agentApplication.emailAccountTypeBlocked"));
      }
    } catch (e: any) {
      console.error("check_auth_user_exists failed", e);
      // Don't block the user; treat as unknown.
      setAuthUserExists(null);
      setEmailBlocked(false);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const scheduleEmailCheck = (rawValue: string) => {
    const v = String(rawValue ?? "")
      .trim()
      .toLowerCase();
    // Cheap guard to avoid spamming the edge function on every keystroke.
    if (!v || !v.includes("@") || v.length < 6) return;
    if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
    emailCheckTimerRef.current = setTimeout(() => {
      void checkExistingUserByEmail(v);
    }, 450);
  };

  const verifyExistingUserPassword = async (): Promise<{
    valid: boolean;
    hasSignature: boolean;
  }> => {
    const emailNorm = formData.email.trim().toLowerCase();
    if (!emailNorm) {
      toast.error(t("agentApplication.enterEmail"));
      return { valid: false, hasSignature: false };
    }
    if (!password) {
      toast.error(t("agentApplication.enterPassword"));
      return { valid: false, hasSignature: false };
    }
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "verify_auth_user_password",
          email: emailNorm,
          password,
        },
      });
      if (error) throw error;
      const valid = data?.valid === true;
      if (!valid) {
        toast.error(t("agentApplication.wrongPassword"));
        setPasswordVerified(false);
        return { valid: false, hasSignature: false };
      }
      setPasswordVerified(true);

      // If the agent already has a global signature, pre-fill it
      let hasSignature = false;
      const sig = data?.agent_signature;
      if (sig && typeof sig.signature_url === "string" && sig.signature_url) {
        try {
          const resp = await fetch(sig.signature_url);
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise<string | null>((resolve) => {
            reader.onload = () =>
              resolve(typeof reader.result === "string" ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          if (dataUrl && dataUrl.startsWith("data:image/")) {
            setUploadedSignatureDataUrl(dataUrl);
            setSignatureMethod(
              typeof sig.signature_method === "string" &&
                sig.signature_method === "draw"
                ? "draw"
                : "upload",
            );
            hasSignature = true;
          }
        } catch (fetchErr) {
          console.warn(
            "Could not fetch existing agent signature image",
            fetchErr,
          );
        }
      }

      return { valid: true, hasSignature };
    } catch (e: unknown) {
      console.error("verify_auth_user_password failed", e);
      toast.error(
        e instanceof Error
          ? e.message
          : t("agentApplication.passwordCheckFailed"),
      );
      setPasswordVerified(false);
      return { valid: false, hasSignature: false };
    } finally {
      setAuthLoading(false);
    }
  };

  const availableLangs = useMemo(() => {
    const langs = new Set<string>();
    for (const t of templates) {
      if (typeof t.lang === "string" && t.lang) langs.add(t.lang);
    }
    return Array.from(langs).sort();
  }, [templates]);

  const selectedTemplates = useMemo(() => {
    const selectedPaths = selectedLangs
      .map((l) => selectedTemplateByLang[l])
      .filter((p): p is string => typeof p === "string" && !!p);
    const mapByPath = new Map(templates.map((t) => [t.storage_path, t]));
    return selectedPaths
      .map((p) => mapByPath.get(p))
      .filter((t): t is ContractTemplate => !!t);
  }, [selectedLangs, selectedTemplateByLang, templates]);

  const finalSignatureDataUrl =
    signatureMethod === "draw" ? signatureDataUrl : uploadedSignatureDataUrl;

  const displayName =
    personType === "company" ? formData.company_name : formData.full_name;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const contractPayload = useMemo(() => {
    const agentCompanyType = formData.agent_company_type || "";
    const agentRegisteredOffice = formData.agent_registered_office || "";
    const agentRepresentativeName = formData.agent_representative_name || "";
    const agentRepresentativeTitle = formData.agent_representative_title || "";

    const program = {
      default_commission_rate:
        typeof programSettings?.default_commission_rate === "number"
          ? programSettings.default_commission_rate
          : 4,
      lead_lock_days:
        typeof programSettings?.lead_lock_days === "number"
          ? programSettings.lead_lock_days
          : 30,
      payout_terms:
        typeof programSettings?.payout_terms === "string"
          ? programSettings.payout_terms
          : null,
      products_description:
        typeof programSettings?.products_description === "string"
          ? programSettings.products_description
          : null,
      territory:
        typeof programSettings?.territory === "string"
          ? programSettings.territory
          : null,
      exclusivity:
        typeof programSettings?.exclusivity === "string"
          ? programSettings.exclusivity
          : "non-exclusive",
      agreement_effective_date:
        typeof programSettings?.agreement_effective_date === "string"
          ? programSettings.agreement_effective_date
          : null,
      agreement_end_date:
        typeof programSettings?.agreement_end_date === "string"
          ? programSettings.agreement_end_date
          : null,
      force_majeure_weeks:
        typeof programSettings?.force_majeure_weeks === "number"
          ? programSettings.force_majeure_weeks
          : 8,
      originals_count:
        typeof programSettings?.originals_count === "number"
          ? programSettings.originals_count
          : 2,
    };

    const agent = {
      id: "",
      full_name: displayName || "",
      company_name: formData.company_name || "",
      person_type: personType,
      tax_id: formData.tax_id || "",
      legal_address: formData.legal_address || "",
      company_type: agentCompanyType,
      registered_office: agentRegisteredOffice,
      represented_by_name: agentRepresentativeName,
      represented_by_title: agentRepresentativeTitle,
      email: formData.email || "",
      phone: formData.phone || "",
      bank_details: formData.bank_details
        ? { details: formData.bank_details }
        : null,
    };

    const developer = {
      id: developerId || "",
      full_name: developerProfile?.full_name ?? null,
      company_name: developerProfile?.company_name ?? null,
      tax_id: developerProfile?.tax_id ?? null,
      legal_address: developerProfile?.legal_address ?? null,
      phone: developerProfile?.phone ?? null,
      email: developerProfile?.email ?? null,
    };

    const agentSigHtml = finalSignatureDataUrl
      ? `<img data-gridix-signature="agent" src="${escapeHtml(finalSignatureDataUrl)}" alt="agent signature" style="height:64px;object-fit:contain;mix-blend-mode:multiply;" />`
      : "";
    const developerSigHtml = developerAssets?.signature_url
      ? `<img data-gridix-signature="developer" src="${escapeHtml(developerAssets.signature_url)}" alt="developer signature" style="height:64px;object-fit:contain;mix-blend-mode:multiply;" />`
      : "";
    const developerStampHtml = developerAssets?.stamp_url
      ? `<img data-gridix-stamp="developer" src="${escapeHtml(developerAssets.stamp_url)}" alt="developer stamp" style="height:64px;object-fit:contain;mix-blend-mode:multiply;opacity:0.9;" />`
      : "";

    return {
      agent,
      application: { id: "", created_at: "" },
      developer,
      program,
      signatures: {
        agent: agentSigHtml,
        developer: developerSigHtml,
        developer_stamp: developerStampHtml,
      },
      date: { today: todayStr },

      // Backward-compatible aliases
      partner_id: "",
      partner_name: agent.full_name,
      company_name: agent.company_name,
      tax_id: agent.tax_id,
      address: agent.legal_address,
      date_text: todayStr,
      commission_rate: String(program.default_commission_rate ?? ""),
      sign_image: agentSigHtml,

      agent_signature: agentSigHtml,
      developer_signature: developerSigHtml,
      developer_stamp: developerStampHtml,

      // Program aliases (to keep templates simpler if needed)
      default_commission_rate: program.default_commission_rate,
      payout_terms: program.payout_terms,
      products_description: program.products_description,
      territory: program.territory,
      exclusivity: program.exclusivity,
      agreement_effective_date: program.agreement_effective_date,
      agreement_end_date: program.agreement_end_date,
      force_majeure_weeks: program.force_majeure_weeks,
      originals_count: program.originals_count,
    } satisfies Record<string, unknown>;
  }, [
    developerId,
    developerProfile,
    developerAssets,
    displayName,
    finalSignatureDataUrl,
    formData.bank_details,
    formData.agent_company_type,
    formData.agent_registered_office,
    formData.agent_representative_name,
    formData.agent_representative_title,
    formData.company_name,
    formData.email,
    formData.legal_address,
    formData.phone,
    formData.tax_id,
    personType,
    programSettings,
    todayStr,
  ]);

  const detailsValid =
    authUserExists === true
      ? !!(formData.email && password)
      : !!(
          formData.email &&
          displayName &&
          formData.tax_id &&
          formData.phone &&
          formData.legal_address
        );
  const signatureValid = !!(
    finalSignatureDataUrl && finalSignatureDataUrl.startsWith("data:image/")
  );
  const contractsValid = selectedTemplates.length > 0 && acceptedAgreements;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerId) {
      toast.error(t("agentApplication.invalidLinkMissingDeveloperId"));
      return;
    }

    if (!detailsValid) {
      toast.error(t("agentApplication.fillRequiredFields"));
      return;
    }

    if (!signatureValid) {
      toast.error(t("agentApplication.addSignature"));
      return;
    }

    if (templatesLoading) {
      toast.error(t("agentApplication.waitLoadingContracts"));
      return;
    }

    if (selectedTemplates.length === 0) {
      toast.error(t("agentApplication.selectContractLanguage"));
      return;
    }

    if (!acceptedAgreements) {
      toast.error(t("agentApplication.confirmAgreement"));
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("agent-program", {
        body: {
          action: "submit_application",
          developer_id: developerId,
          email: formData.email,
          ...(authUserExists === true
            ? {
                use_profile_defaults: true,
                password,
              }
            : {
                person_type: personType,
                full_name: displayName,
                company_name: formData.company_name || null,
                tax_id: formData.tax_id || null,
                phone: formData.phone,
                legal_address: formData.legal_address || null,
                bank_details: { details: formData.bank_details },
                agent_company_type: formData.agent_company_type || null,
                agent_registered_office:
                  formData.agent_registered_office || null,
                agent_representative_name:
                  formData.agent_representative_name || null,
                agent_representative_title:
                  formData.agent_representative_title || null,
              }),
        },
      });

      if (response.error) throw new Error(response.error.message);
      const applicationId = String((response as any)?.data?.data?.id ?? "");
      if (!applicationId) throw new Error("Failed to create application");

      // Sign multiple contracts (public flow for invite wizard).
      const signResp = await supabase.functions.invoke("agent-program", {
        body: {
          action: "sign_agreements_public",
          application_id: applicationId,
          email: formData.email,
          signature_data_url: finalSignatureDataUrl,
          signature_method: signatureMethod,
          accepted: true,
          contract_template_paths: selectedTemplates.map((t) => t.storage_path),
        },
      });
      if (signResp.error) throw new Error(signResp.error.message);

      // Capture signed contracts for download on the success screen
      const sc = signResp.data?.signed_contracts;
      if (Array.isArray(sc)) {
        setSignedContractsResult(sc);
      }

      setStep("success");
      toast.success(t("agentApplication.applicationSubmitted"));
    } catch (error: unknown) {
      console.error("Error submitting application:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("agentApplication.submitFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";

    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
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
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      const t = e.touches.item(0);
      if (!t) {
        clientX = 0;
        clientY = 0;
      } else {
        clientX = t.clientX;
        clientY = t.clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Scale from CSS pixels (rect) to canvas pixel coordinates (width/height)
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;

    return {
      offsetX: (clientX - rect.left) * scaleX,
      offsetY: (clientY - rect.top) * scaleY,
    };
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

  const ContractPreview = (props: {
    template: ContractTemplate;
    renderedHtml: string | null;
    label: string;
  }) => {
    const A4_W = 794; // px @ 96dpi
    const A4_H = 1123;
    const PAGE_PAD = 40; // similar to `p-10`
    const FOOTER_PAD_BOTTOM = 40; // similar to `bottom-10`
    const hasInlineSignatures =
      typeof props.renderedHtml === "string" &&
      (props.renderedHtml.includes("data-gridix-signature=") ||
        props.renderedHtml.includes("data-gridix-stamp="));
    const FOOTER_H = hasInlineSignatures ? 0 : 170; // reserved space for signature blocks (only if not in-template)
    const COLUMN_GAP = 48; // px between pages in column layout

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const measureRef = useRef<HTMLDivElement>(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const [exportPageIndex] = useState(0);
    void exportPageIndex; // reserved for future use

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width ?? 0;
        setContainerWidth(w);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const contentViewportH =
      A4_H - PAGE_PAD - (FOOTER_H + FOOTER_PAD_BOTTOM) - PAGE_PAD;
    const contentViewportW = A4_W - PAGE_PAD * 2;

    useLayoutEffect(() => {
      // Reset & measure pages whenever html changes
      setPageIndex(0);
      if (!props.renderedHtml) {
        setPageCount(1);
        return;
      }

      const el = measureRef.current;
      if (!el) return;

      // Use CSS multi-column layout to flow content into pages (columns).
      const sw = el.scrollWidth || 0;
      const denom = contentViewportW + COLUMN_GAP;
      const nextCount = Math.max(1, Math.ceil((sw + COLUMN_GAP) / denom));
      setPageCount(nextCount);
    }, [COLUMN_GAP, contentViewportH, contentViewportW, props.renderedHtml]);

    const targetWidth = Math.min(containerWidth || 520, 520);
    const scale = targetWidth > 0 ? targetWidth / A4_W : 1;
    const scaledHeight = Math.round(A4_H * scale);

    useEffect(() => {
      setPageIndex((p) => Math.min(Math.max(p, 0), Math.max(0, pageCount - 1)));
    }, [pageCount]);

    const visibleShiftX = pageIndex * (contentViewportW + COLUMN_GAP);

    return (
      <div ref={containerRef} className="w-[92vw] max-w-[520px] shrink-0">
        <div className="relative" style={{ height: scaledHeight || 0 }}>
          <div
            className="absolute left-0 top-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            style={{
              width: A4_W,
              height: A4_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {/* Hidden measure strip: multi-column flow */}
            <div
              ref={measureRef}
              className={[
                "absolute -left-[9999px] top-0 text-[10px] text-slate-800",
                // Restore rich typography
                "[&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:leading-tight",
                "[&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-tight",
                "[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-bold",
                "[&_strong]:font-bold",
                "[&_em]:italic",
                "[&_u]:underline",
                "[&_p]:my-2 [&_p]:leading-relaxed",
                "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
                "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
                "[&_li]:my-1",
                "[&_table]:my-2 [&_table]:w-full [&_table]:table-fixed",
                "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-1 [&_th]:font-bold",
                "[&_td]:border [&_td]:border-slate-200 [&_td]:p-1",
                "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600",
              ].join(" ")}
              style={{
                width: contentViewportW,
                height: contentViewportH,
                columnWidth: contentViewportW,
                columnGap: COLUMN_GAP,
                columnFill: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: props.renderedHtml ?? "" }}
            />

            {/* Page body (clipped viewport) */}
            <div
              className="absolute left-10 top-10 overflow-hidden text-[10px] text-slate-800"
              style={{ width: contentViewportW, height: contentViewportH }}
            >
              {props.renderedHtml ? (
                <div
                  className={[
                    "h-full",
                    // Restore rich typography
                    "[&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:leading-tight",
                    "[&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-tight",
                    "[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-bold",
                    "[&_strong]:font-bold",
                    "[&_em]:italic",
                    "[&_u]:underline",
                    "[&_p]:my-2 [&_p]:leading-relaxed",
                    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
                    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
                    "[&_li]:my-1",
                    "[&_table]:my-2 [&_table]:w-full [&_table]:table-fixed",
                    "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-1 [&_th]:font-bold",
                    "[&_td]:border [&_td]:border-slate-200 [&_td]:p-1",
                    "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600",
                  ].join(" ")}
                  style={{
                    width: contentViewportW,
                    height: contentViewportH,
                    columnWidth: contentViewportW,
                    columnGap: COLUMN_GAP,
                    columnFill: "auto",
                    transform: `translateX(-${visibleShiftX}px)`,
                    transformOrigin: "top left",
                  }}
                  dangerouslySetInnerHTML={{ __html: props.renderedHtml }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-10 text-center">
                  <div className="text-lg font-black text-slate-900">
                    {t("agentApplication.contract")}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {t("agentApplication.htmlVersionNotSet")}
                  </div>
                  {props.template.url && (
                    <a
                      href={props.template.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 text-sm font-bold underline"
                    >
                      {t("agentApplication.openFile", {
                        name: props.template.name,
                      })}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Signature area: developer + agent (only when template doesn't include inline signatures) */}
            {!hasInlineSignatures && (
              <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between border-t border-slate-200 pt-6">
                <div className="relative w-48">
                  <div className="mb-2 border-b border-slate-900" />
                  <div className="text-[11px] font-extrabold uppercase">
                    {t("agentApplication.developer")}
                  </div>
                  {developerAssets.stamp_url && (
                    <img
                      src={developerAssets.stamp_url}
                      alt="developer-stamp"
                      crossOrigin="anonymous"
                      className="absolute bottom-5 left-0 h-24 w-24 object-contain opacity-80 mix-blend-multiply"
                    />
                  )}
                  {developerAssets.signature_url && (
                    <img
                      src={developerAssets.signature_url}
                      alt="developer-signature"
                      crossOrigin="anonymous"
                      className="absolute bottom-7 left-0 h-16 w-28 object-contain mix-blend-multiply"
                    />
                  )}
                </div>

                <div className="relative w-48">
                  {finalSignatureDataUrl && (
                    <img
                      src={finalSignatureDataUrl}
                      alt="agent-signature"
                      crossOrigin="anonymous"
                      className="absolute bottom-7 left-0 h-20 w-32 object-contain mix-blend-multiply"
                      style={{ filter: "contrast(1.35)" }}
                    />
                  )}
                  <div className="mb-2 border-b border-slate-900" />
                  <div className="text-[11px] font-extrabold uppercase">
                    {t("agentApplication.agent")}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {displayName || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls under the document */}
        <div className="mt-3 text-center text-xs font-bold text-slate-600">
          {props.label}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          {pageCount > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex <= 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 disabled:opacity-40"
              >
                {t("agentApplication.pageBack")}
              </button>
              <div className="text-xs font-extrabold tabular-nums text-slate-700">
                {t("agentApplication.pageOf", {
                  current: pageIndex + 1,
                  total: pageCount,
                })}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                }
                disabled={pageIndex >= pageCount - 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 disabled:opacity-40"
              >
                {t("agentApplication.pageNext")}
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="text-xs font-bold text-slate-400">
            {t("agentApplication.pdfAvailableAfterSubmit")}
          </div>
        </div>
      </div>
    );
  };

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none bg-white/80 shadow-2xl backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold">
                {t("agentApplication.successTitle")}
              </CardTitle>
              <CardDescription>
                {t("agentApplication.successDescription")}
              </CardDescription>
            </CardHeader>
            {signedContractsResult.length > 0 && (
              <CardContent className="space-y-3 pt-0">
                <div className="text-center text-sm font-bold text-slate-700">
                  {t("agentApplication.signedContractsDownload")}
                </div>
                {signedContractsResult.map((sc, idx) => {
                  const lang = sc.template_lang
                    ? sc.template_lang.toUpperCase()
                    : null;
                  const label = sc.template_name
                    ? `${sc.template_name}${lang ? ` (${lang})` : ""}`
                    : `${t("agentApplication.contract")} ${idx + 1}${lang ? ` — ${lang}` : ""}`;
                  const isPdf = sc.signed_contract_mime === "application/pdf";
                  return (
                    <a
                      key={sc.signed_contract_path}
                      href={sc.signed_download_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Download size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isPdf ? "PDF" : sc.signed_contract_mime}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  {t("agentApplication.title")}
                </CardTitle>
                <CardDescription>
                  {t("agentApplication.description")}
                </CardDescription>
              </div>
              <div className="text-xs font-bold uppercase text-slate-400">
                {step === "details" && t("agentApplication.stepQuestionnaire")}
                {step === "signature" && t("agentApplication.stepSignature")}
                {step === "contracts" && t("agentApplication.stepContracts")}
              </div>
            </div>

            {/* Stepper */}
            <div className="mt-5 flex items-center gap-2">
              {[
                { key: "details", label: "1" },
                { key: "signature", label: "2" },
                { key: "contracts", label: "3" },
              ].map((s, idx) => {
                const active = step === (s.key as Step);
                const done =
                  (step === "signature" && s.key === "details") ||
                  (step === "contracts" &&
                    (s.key === "details" || s.key === "signature"));
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold",
                        active
                          ? "bg-black text-white"
                          : done
                            ? "bg-black text-white"
                            : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {s.label}
                    </div>
                    {idx < 2 && (
                      <div
                        className={[
                          "h-1 w-10 rounded",
                          done ? "bg-black" : "bg-slate-200",
                        ].join(" ")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              {/* Body */}
              <div className="p-6 md:p-10">
                {step === "details" && (
                  <div className="mx-auto max-w-2xl space-y-6">
                    {!developerId && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {t("agentApplication.invalidLinkDescription")}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Email is always first */}
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                          {t("agentApplication.email")}
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPasswordVerified(false);
                            setPassword("");
                            setAuthUserExists(null);
                            setEmailBlocked(false);
                            setFormData({ ...formData, email: v });
                            // Lightweight "oninput" check with debounce below is also active,
                            // but we keep immediate check for autofill/paste scenarios.
                          }}
                          onBlur={(e) =>
                            void checkExistingUserByEmail(e.target.value)
                          }
                          onInput={(e) =>
                            scheduleEmailCheck(
                              (e.target as HTMLInputElement).value,
                            )
                          }
                          placeholder={t("agentApplication.emailPlaceholder")}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                        />
                        {emailCheckLoading && (
                          <p className="mt-1 text-xs text-slate-500">
                            {t("agentApplication.checkingEmail")}
                          </p>
                        )}
                        {emailBlocked && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {t("agentApplication.emailBlockedForAgent")}
                          </p>
                        )}
                        {authUserExists === true && (
                          <p className="mt-1 text-xs text-slate-500">
                            {t("agentApplication.userExistsEnterPassword")}
                          </p>
                        )}
                      </div>

                      {/* Existing user: hide all fields, show only password */}
                      {authUserExists === true ? (
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                            {t("agentApplication.password")}
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                              setPasswordVerified(false);
                              setPassword(e.target.value);
                            }}
                            placeholder={t(
                              "agentApplication.passwordPlaceholder",
                            )}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                          />
                          {passwordVerified && (
                            <div className="mt-1 text-xs font-semibold text-green-700">
                              {t("agentApplication.passwordVerified")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Person type toggle */}
                          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-1">
                            <button
                              type="button"
                              onClick={() => setPersonType("company")}
                              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
                                personType === "company"
                                  ? "bg-slate-900 text-white shadow-md"
                                  : "text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              <Building2 size={16} />{" "}
                              {t("agentApplication.companyType")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPersonType("individual")}
                              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
                                personType === "individual"
                                  ? "bg-slate-900 text-white shadow-md"
                                  : "text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              <User size={16} />{" "}
                              {t("agentApplication.individualType")}
                            </button>
                          </div>

                          {/* Partner-like fields */}
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                              {personType === "company"
                                ? t("agentApplication.companyName")
                                : t("agentApplication.fullName")}
                            </label>
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData({
                                  ...formData,
                                  ...(personType === "company"
                                    ? { company_name: v }
                                    : { full_name: v }),
                                });
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t("agentApplication.taxId")}
                              </label>
                              <input
                                type="text"
                                value={formData.tax_id}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    tax_id: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t("agentApplication.phone")}
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    phone: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                              {t("agentApplication.legalAddress")}
                            </label>
                            <input
                              type="text"
                              value={formData.legal_address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  legal_address: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                            />
                          </div>

                          {/* Contract party details (optional, for filling agreement blanks) */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t("agentApplication.companyTypeOptional")}
                              </label>
                              <input
                                type="text"
                                value={formData.agent_company_type}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    agent_company_type: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "agentApplication.companyTypePlaceholder",
                                )}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t("agentApplication.registeredOfficeOptional")}
                              </label>
                              <input
                                type="text"
                                value={formData.agent_registered_office}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    agent_registered_office: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "agentApplication.registeredOfficePlaceholder",
                                )}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t(
                                  "agentApplication.representedByNameOptional",
                                )}
                              </label>
                              <input
                                type="text"
                                value={formData.agent_representative_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    agent_representative_name: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "agentApplication.representedByNamePlaceholder",
                                )}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                                {t(
                                  "agentApplication.representedByTitleOptional",
                                )}
                              </label>
                              <input
                                type="text"
                                value={formData.agent_representative_title}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    agent_representative_title: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  "agentApplication.representedByTitlePlaceholder",
                                )}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                              {t("agentApplication.bankDetailsOptional")}
                            </label>
                            <textarea
                              value={formData.bank_details}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bank_details: e.target.value,
                                })
                              }
                              placeholder={t(
                                "agentApplication.bankDetailsPlaceholder",
                              )}
                              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition-all focus:border-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === "signature" && (
                  <div className="mx-auto max-w-2xl space-y-6">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={
                          signatureMethod === "draw" ? "default" : "outline"
                        }
                        onClick={() => setSignatureMethod("draw")}
                      >
                        {t("agentApplication.draw")}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          signatureMethod === "upload" ? "default" : "outline"
                        }
                        onClick={() => setSignatureMethod("upload")}
                      >
                        {t("agentApplication.upload")}
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
                        <div className="pointer-events-none absolute left-4 top-4 text-xs font-bold uppercase text-slate-300">
                          {t("agentApplication.signatureArea")}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="absolute right-4 top-4"
                          onClick={clearCanvas}
                        >
                          {t("agentApplication.clear")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              void onUploadSignature(
                                e.target.files?.[0] ?? null,
                              )
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
                  </div>
                )}

                {step === "contracts" && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-black text-slate-900">
                          {t("agentApplication.contractsTitle")}
                        </div>
                        <div className="text-sm text-slate-500">
                          {t("agentApplication.contractsMultiLanguageHint")}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {availableLangs.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            {templatesLoading
                              ? t("agentApplication.loadingContracts")
                              : t("agentApplication.noContractsFound")}
                          </div>
                        ) : (
                          availableLangs.map((l) => {
                            const active = selectedLangs.includes(l);
                            return (
                              <button
                                key={l}
                                type="button"
                                onClick={() => {
                                  setSelectedLangs((prev) => {
                                    if (prev.includes(l))
                                      return prev.filter((x) => x !== l);
                                    return [...prev, l];
                                  });
                                }}
                                className={[
                                  "rounded-xl border px-3 py-2 text-sm font-extrabold transition",
                                  active
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                ].join(" ")}
                              >
                                {l}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Template selector per language (if multiple templates exist) */}
                    {selectedLangs.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {selectedLangs.map((l) => {
                          const options = templates.filter(
                            (t) => String(t.lang) === l,
                          );
                          if (options.length <= 1) return null;
                          return (
                            <div
                              key={l}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="mb-2 text-xs font-bold uppercase text-slate-500">
                                {t("agentApplication.templateLabel", {
                                  lang: l,
                                })}
                              </div>
                              <select
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none"
                                value={selectedTemplateByLang[l] ?? ""}
                                onChange={(e) =>
                                  setSelectedTemplateByLang((prev) => ({
                                    ...prev,
                                    [l]: e.target.value,
                                  }))
                                }
                              >
                                {options.map((t) => (
                                  <option
                                    key={t.storage_path}
                                    value={t.storage_path}
                                  >
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* A4 previews row */}
                    <div className="overflow-x-auto rounded-2xl bg-slate-200 p-4 md:p-8">
                      <div className="flex items-start gap-6">
                        {selectedTemplates.map((t) => (
                          <ContractPreview
                            key={t.storage_path}
                            template={t}
                            renderedHtml={
                              t.content_html
                                ? renderHtmlTemplate(
                                    t.content_html,
                                    contractPayload,
                                  )
                                : null
                            }
                            label={`${t.lang ?? "—"} · ${t.name}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={acceptedAgreements}
                          onChange={(e) =>
                            setAcceptedAgreements(e.target.checked)
                          }
                          className="mt-1 h-5 w-5"
                        />
                        <div className="text-sm text-slate-700">
                          {t("agentApplication.confirmAgreementsRead")}{" "}
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-white p-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (step === "details") return;
                    if (step === "signature") return setStep("details");
                    if (step === "contracts") return setStep("signature");
                  }}
                >
                  {t("agentApplication.backButton")}
                </Button>

                {step !== "contracts" ? (
                  <Button
                    type="button"
                    disabled={
                      loading ||
                      authLoading ||
                      emailCheckLoading ||
                      (step === "details" && (!developerId || !detailsValid)) ||
                      (step === "signature" && !signatureValid)
                    }
                    onClick={() => {
                      if (step === "details") {
                        if (!developerId) return;
                        if (!detailsValid) {
                          toast.error(
                            t("agentApplication.fillRequiredFieldsShort"),
                          );
                          return;
                        }
                        if (emailCheckLoading) {
                          toast.error(t("agentApplication.waitEmailCheck"));
                          return;
                        }
                        if (emailBlocked) {
                          toast.error(t("agentApplication.emailCannotUse"));
                          return;
                        }
                        // If user typed email but never blurred, enforce check before continuing.
                        if (authUserExists === null) {
                          void checkExistingUserByEmail(formData.email);
                          toast.error(t("agentApplication.confirmEmailFirst"));
                          return;
                        }
                        if (authUserExists === true) {
                          void (async () => {
                            const result = await verifyExistingUserPassword();
                            if (result.valid) {
                              // If agent already has a signature, skip the signature step
                              setStep(
                                result.hasSignature ? "contracts" : "signature",
                              );
                            }
                          })();
                          return;
                        }
                        setStep("signature");
                      } else if (step === "signature") {
                        if (!signatureValid) {
                          toast.error(t("agentApplication.signatureRequired"));
                          return;
                        }
                        setStep("contracts");
                      }
                    }}
                  >
                    {t("agentApplication.nextButton")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || authLoading || !contractsValid}
                  >
                    {loading
                      ? t("agentApplication.sending")
                      : t("agentApplication.signAndSubmit")}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
