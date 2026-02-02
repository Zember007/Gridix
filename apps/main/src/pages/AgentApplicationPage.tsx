import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

export default function AgentApplicationPage() {
    const [searchParams] = useSearchParams();
    const developerId = searchParams.get("developer_id");
    const { language } = useLanguage();
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

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        bank_details: "",
    });

    // Existing user check (email onBlur) + password sign-in (only if user exists)
    const [authUserExists, setAuthUserExists] = useState<boolean | null>(null);
    const [authUserAccountType, setAuthUserAccountType] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);
    const [emailBlocked, setEmailBlocked] = useState(false);

    // Signature state (draw/upload)
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signatureMethod, setSignatureMethod] = useState<"draw" | "upload">("draw");
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [uploadedSignatureDataUrl, setUploadedSignatureDataUrl] = useState<string | null>(null);

    // Contract selection state
    const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
    const [selectedTemplateByLang, setSelectedTemplateByLang] = useState<Record<string, string>>({});
    const [acceptedAgreements, setAcceptedAgreements] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!developerId) return;
            setTemplatesLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke("agent-program", {
                    body: {
                        action: "list_contract_templates_public",
                        developer_id: developerId,
                    },
                });

                if (error) throw error;

                const nextTemplates = ((data?.templates ?? []) as ContractTemplate[]).filter(
                    (t) => t && typeof t.storage_path === "string"
                );
                setTemplates(nextTemplates);
                setDeveloperAssets((data?.developer_assets ?? null) as DeveloperAssets);

                // Initialize selection: pick 1 template per lang and preselect all langs
                const langs = Array.from(
                    new Set(
                        nextTemplates
                            .map((t) => (typeof t.lang === "string" && t.lang ? t.lang : null))
                            .filter((x): x is string => !!x)
                    )
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
                setDeveloperAssets({ signature_path: null, signature_url: null, stamp_path: null, stamp_url: null });
            } finally {
                setTemplatesLoading(false);
            }
        };
        void load();
    }, [developerId]);

    const checkExistingUserByEmail = async (emailValue: string) => {
        const emailNorm = emailValue.trim().toLowerCase();
        if (!emailNorm) return;
        try {
            setEmailCheckLoading(true);
            setEmailBlocked(false);
            const { data, error } = await supabase.functions.invoke("agent-program", {
                body: { action: "check_auth_user_exists", email: emailNorm },
            });
            if (error) throw error;
            setAuthUserExists(!!data?.exists);
            const at = typeof data?.account_type === "string" ? String(data.account_type) : null;
            setAuthUserAccountType(at);
            if (data?.exists === true && at && at !== "agent") {
                setEmailBlocked(true);
                toast.error("Этот email уже принадлежит другому типу аккаунта. Используйте другой email.");
            }
        } catch (e: any) {
            console.error("check_auth_user_exists failed", e);
            // Don't block the user; treat as unknown.
            setAuthUserExists(null);
            setAuthUserAccountType(null);
            setEmailBlocked(false);
        }
        finally {
            setEmailCheckLoading(false);
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
        return selectedPaths.map((p) => mapByPath.get(p)).filter((t): t is ContractTemplate => !!t);
    }, [selectedLangs, selectedTemplateByLang, templates]);

    const finalSignatureDataUrl =
        signatureMethod === "draw" ? signatureDataUrl : uploadedSignatureDataUrl;

    const detailsValid = !!(formData.full_name && formData.email && formData.phone);
    const signatureValid = !!(finalSignatureDataUrl && finalSignatureDataUrl.startsWith("data:image/"));
    const contractsValid = selectedTemplates.length > 0 && acceptedAgreements;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!developerId) {
            toast.error("Invalid application link. Developer ID is missing.");
            return;
        }

        if (!detailsValid) {
            toast.error("Пожалуйста, заполните обязательные поля.");
            return;
        }

        if (!signatureValid) {
            toast.error("Пожалуйста, добавьте подпись.");
            return;
        }

        if (templatesLoading) {
            toast.error("Пожалуйста, подождите — загружаем договоры...");
            return;
        }

        if (selectedTemplates.length === 0) {
            toast.error("Выберите язык(и) договора.");
            return;
        }

        if (!acceptedAgreements) {
            toast.error("Пожалуйста, подтвердите согласие с условиями договоров.");
            return;
        }

        setLoading(true);
        try {
            const response = await supabase.functions.invoke("agent-program", {
                body: {
                    action: "submit_application",
                    developer_id: developerId,
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    bank_details: { details: formData.bank_details },
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

            // NOTE: full multi-contract signing is added in the next step of this plan (sign_agreements).
            setStep("success");
            toast.success("Заявка отправлена!");
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error(error.message || "Failed to submit application");
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

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
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

        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top,
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

    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <CardTitle className="text-2xl font-bold">Thank You!</CardTitle>
                            <CardDescription>
                                Your application has been received and is currently under review.
                                We will contact you via email once it is approved.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl">
                <Card className="border-slate-200 shadow-xl bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900">Регистрация агента</CardTitle>
                                <CardDescription>
                                    Заполните данные, добавьте подпись и подпишите договор(ы).
                                </CardDescription>
                            </div>
                            <div className="text-xs font-bold uppercase text-slate-400">
                                {step === "details" && "Анкета"}
                                {step === "signature" && "Подпись"}
                                {step === "contracts" && "Договоры"}
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
                                    (step === "contracts" && (s.key === "details" || s.key === "signature"));
                                return (
                                    <div key={s.key} className="flex items-center gap-2">
                                        <div
                                            className={[
                                                "w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm",
                                                active ? "bg-blue-600 text-white" : done ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                                            ].join(" ")}
                                        >
                                            {s.label}
                                        </div>
                                        {idx < 2 && (
                                            <div className={["h-1 w-10 rounded", done ? "bg-blue-600" : "bg-slate-200"].join(" ")} />
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
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {!developerId && (
                                            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                                                Некорректная ссылка: отсутствует <strong>developer_id</strong>.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="full_name">ФИО</Label>
                                                <Input
                                                    id="full_name"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    placeholder="Иван Иванов"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        onBlur={() => void checkExistingUserByEmail(formData.email)}
                                                    placeholder="ivan@example.com"
                                                />
                                                {emailCheckLoading && (
                                                    <p className="text-xs text-slate-500">Проверяем email...</p>
                                                )}
                                                {emailBlocked && (
                                                    <p className="text-xs text-red-600 font-semibold">
                                                        Этот email нельзя использовать для регистрации агента.
                                                    </p>
                                                )}
                                                {authUserExists === true && (
                                                    <p className="text-xs text-slate-500">
                                                        Пользователь уже зарегистрирован. Введите пароль для продолжения.
                                                    </p>
                                                )}
                                                {authUserExists === false && (
                                                    <p className="text-xs text-slate-500">
                                                        Пользователь не найден. Вы сможете продолжить без пароля.
                                                    </p>
                                                )}
                                            </div>
                                            {authUserExists === true && (
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="password">Пароль</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Введите пароль"
                                                    />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Телефон</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="+995..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_details">Банковские реквизиты (опционально)</Label>
                                                <Textarea
                                                    id="bank_details"
                                                    value={formData.bank_details}
                                                    onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                                                    placeholder="IBAN / SWIFT / ..."
                                                    className="min-h-[96px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === "signature" && (
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant={signatureMethod === "draw" ? "default" : "outline"}
                                                onClick={() => setSignatureMethod("draw")}
                                            >
                                                Нарисовать
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={signatureMethod === "upload" ? "default" : "outline"}
                                                onClick={() => setSignatureMethod("upload")}
                                            >
                                                Загрузить
                                            </Button>
                                        </div>

                                        {signatureMethod === "draw" ? (
                                            <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden relative">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={900}
                                                    height={360}
                                                    className="w-full h-64 cursor-crosshair touch-none"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                />
                                                <div className="absolute top-4 left-4 text-xs font-bold uppercase text-slate-300 pointer-events-none">
                                                    Область подписи
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="absolute top-4 right-4"
                                                    onClick={clearCanvas}
                                                >
                                                    Очистить
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => void onUploadSignature(e.target.files?.[0] ?? null)}
                                                    />
                                                    {uploadedSignatureDataUrl && (
                                                        <div className="mt-4">
                                                            <img
                                                                src={uploadedSignatureDataUrl}
                                                                alt="signature"
                                                                className="h-28 object-contain mx-auto mix-blend-multiply"
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
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <div className="text-lg font-black text-slate-900">Договор(ы)</div>
                                                <div className="text-sm text-slate-500">
                                                    Если выбрано несколько языков, договоры отображаются в ряд.
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {availableLangs.length === 0 ? (
                                                    <div className="text-sm text-slate-500">
                                                        {templatesLoading ? "Загружаем договоры..." : "Договоры не найдены."}
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
                                                                        if (prev.includes(l)) return prev.filter((x) => x !== l);
                                                                        return [...prev, l];
                                                                    });
                                                                }}
                                                                className={[
                                                                    "px-3 py-2 rounded-xl text-sm font-extrabold border transition",
                                                                    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedLangs.map((l) => {
                                                    const options = templates.filter((t) => String(t.lang) === l);
                                                    if (options.length <= 1) return null;
                                                    return (
                                                        <div key={l} className="rounded-xl border border-slate-200 bg-white p-4">
                                                            <div className="text-xs font-bold uppercase text-slate-500 mb-2">Шаблон ({l})</div>
                                                            <select
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none"
                                                                value={selectedTemplateByLang[l] ?? ""}
                                                                onChange={(e) =>
                                                                    setSelectedTemplateByLang((prev) => ({ ...prev, [l]: e.target.value }))
                                                                }
                                                            >
                                                                {options.map((t) => (
                                                                    <option key={t.storage_path} value={t.storage_path}>
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
                                        <div className="rounded-2xl bg-slate-200 p-4 md:p-8 overflow-x-auto">
                                            <div className="flex gap-6 items-start">
                                                {selectedTemplates.map((t) => (
                                                    <div key={t.storage_path} className="shrink-0">
                                                        <div className="bg-white shadow-2xl w-[210mm] h-[297mm] p-10 text-[10px] text-slate-800 relative">
                                                            {t.content_html ? (
                                                                <div
                                                                    className="h-full overflow-hidden"
                                                                    dangerouslySetInnerHTML={{ __html: t.content_html }}
                                                                />
                                                            ) : (
                                                                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                                                    <div className="text-lg font-black text-slate-900">Договор</div>
                                                                    <div className="text-sm text-slate-500 mt-2">
                                                                        HTML-версия не задана. Откройте файл договора.
                                                                    </div>
                                                                    {t.url && (
                                                                        <a
                                                                            href={t.url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="mt-4 text-sm font-bold underline"
                                                                        >
                                                                            Открыть {t.name}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Signature area: developer + agent */}
                                                            <div className="absolute left-10 right-10 bottom-10 pt-6 border-t border-slate-200 flex justify-between items-end">
                                                                <div className="w-48 relative">
                                                                    <div className="border-b border-slate-900 mb-2" />
                                                                    <div className="font-extrabold uppercase text-[11px]">Developer</div>
                                                                    {developerAssets.stamp_url && (
                                                                        <img
                                                                            src={developerAssets.stamp_url}
                                                                            alt="developer-stamp"
                                                                            className="absolute bottom-5 left-0 w-24 h-24 object-contain mix-blend-multiply opacity-80"
                                                                        />
                                                                    )}
                                                                    {developerAssets.signature_url && (
                                                                        <img
                                                                            src={developerAssets.signature_url}
                                                                            alt="developer-signature"
                                                                            className="absolute bottom-7 left-0 w-28 h-16 object-contain mix-blend-multiply"
                                                                        />
                                                                    )}
                                                                </div>

                                                                <div className="w-48 relative">
                                                                    {finalSignatureDataUrl && (
                                                                        <img
                                                                            src={finalSignatureDataUrl}
                                                                            alt="agent-signature"
                                                                            className="absolute bottom-7 left-0 w-32 h-20 object-contain mix-blend-multiply"
                                                                            style={{ filter: "contrast(1.35)" }}
                                                                        />
                                                                    )}
                                                                    <div className="border-b border-slate-900 mb-2" />
                                                                    <div className="font-extrabold uppercase text-[11px]">Agent</div>
                                                                    <div className="text-slate-500 text-[10px]">{formData.full_name || "—"}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 text-xs font-bold text-slate-600 text-center">
                                                            {t.lang ?? "—"} · {t.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={acceptedAgreements}
                                                    onChange={(e) => setAcceptedAgreements(e.target.checked)}
                                                    className="mt-1 h-5 w-5"
                                                />
                                                <div className="text-sm text-slate-700">
                                                    Я подтверждаю, что ознакомился(лась) с условиями выбранных договоров и принимаю их.
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 bg-white p-5 flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (step === "details") return;
                                        if (step === "signature") return setStep("details");
                                        if (step === "contracts") return setStep("signature");
                                    }}
                                >
                                    Назад
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
                                                    toast.error("Заполните обязательные поля.");
                                                    return;
                                                }
                                                if (emailCheckLoading) {
                                                    toast.error("Дождитесь окончания проверки email.");
                                                    return;
                                                }
                                                if (emailBlocked) {
                                                    toast.error("Этот email нельзя использовать. Укажите другой email.");
                                                    return;
                                                }
                                                // If user typed email but never blurred, enforce check before continuing.
                                                if (authUserExists === null) {
                                                    void checkExistingUserByEmail(formData.email);
                                                    toast.error("Сначала подтвердите email (проверка пользователя).");
                                                    return;
                                                }
                                                if (authUserExists === true) {
                                                    if (!password) {
                                                        toast.error("Введите пароль.");
                                                        return;
                                                    }
                                                    void (async () => {
                                                        try {
                                                            setAuthLoading(true);
                                                            const { error } = await supabase.auth.signInWithPassword({
                                                                email: formData.email.trim(),
                                                                password,
                                                            });
                                                            if (error) throw error;
                                                            setStep("signature");
                                                        } catch (e: any) {
                                                            console.error("signInWithPassword failed", e);
                                                            toast.error(e?.message || "Не удалось войти. Проверьте пароль.");
                                                        } finally {
                                                            setAuthLoading(false);
                                                        }
                                                    })();
                                                    return;
                                                }
                                                setStep("signature");
                                            } else if (step === "signature") {
                                                if (!signatureValid) {
                                                    toast.error("Необходима подпись.");
                                                    return;
                                                }
                                                setStep("contracts");
                                            }
                                        }}
                                    >
                                        Далее
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={loading || authLoading || !contractsValid}>
                                        {loading ? "Отправляем..." : "Подписать и отправить"}
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
