import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@gridix/ui";
import { Checkbox } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AgentApplicationPage() {
    const [searchParams] = useSearchParams();
    const developerId = searchParams.get("developer_id");
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [contractsLoading, setContractsLoading] = useState(false);
    const [contracts, setContracts] = useState<Array<{ name: string; url: string; path: string }>>([]);
    const [accepted, setAccepted] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        bank_details: "",
    });

    useEffect(() => {
        const load = async () => {
            if (!developerId) return;
            setContractsLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke("agent-program", {
                    body: {
                        action: "list_contracts",
                        developer_id: developerId,
                        lang: language,
                    },
                });

                if (error) throw error;
                const list = (data?.contracts ?? []) as Array<{ name: string; url: string | null; path: string }>;
                const normalized = list
                    .filter((c) => typeof c.url === "string" && !!c.url)
                    .map((c) => ({ name: c.name, url: c.url as string, path: c.path }));

                setContracts(normalized);
                setAccepted((prev) => {
                    const next: Record<string, boolean> = { ...prev };
                    for (const c of normalized) {
                        if (next[c.path] === undefined) next[c.path] = false;
                    }
                    return next;
                });
            } catch (e: any) {
                console.error("Error loading contracts:", e);
                setContracts([]);
            } finally {
                setContractsLoading(false);
            }
        };
        void load();
    }, [developerId, language]);

    const allContractsAccepted = useMemo(() => {
        if (contracts.length === 0) return false;
        return contracts.every((c) => accepted[c.path] === true);
    }, [accepted, contracts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!developerId) {
            toast.error("Invalid application link. Developer ID is missing.");
            return;
        }

        if (contractsLoading) {
            toast.error("Пожалуйста, подождите — загружаем договоры...");
            return;
        }

        if (contracts.length === 0) {
            toast.error("Договоры не загружены. Пожалуйста, свяжитесь с администратором.");
            return;
        }

        if (!allContractsAccepted) {
            toast.error("Пожалуйста, подтвердите, что вы ознакомились и приняли договоры.");
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

            setSubmitted(true);
            toast.success("Application submitted successfully!");
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error(error.message || "Failed to submit application");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full"
            >
                <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold tracking-tight">Become an Agent</CardTitle>
                        <CardDescription>
                            Submit your details to start collaborating and earning rewards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    placeholder="John Doe"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-black transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-black transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 234 567 890"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-black transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bank_details">Bank Details (Optional)</Label>
                                <Textarea
                                    id="bank_details"
                                    placeholder="IBAN, Swift, etc."
                                    value={formData.bank_details}
                                    onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                                    className="bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-black transition-all min-h-[100px]"
                                />
                                <p className="text-xs text-gray-500">
                                    These details may be used for settlements, if needed.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold text-gray-900">
                                    Agreements
                                </div>
                                {contractsLoading ? (
                                    <div className="text-xs text-gray-500">Loading agreements...</div>
                                ) : contracts.length === 0 ? (
                                    <div className="text-xs text-red-600">
                                        Agreements are not available right now.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {contracts.map((c) => (
                                            <div key={c.path} className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={accepted[c.path] === true}
                                                    onCheckedChange={(v) => {
                                                        setAccepted((prev) => ({
                                                            ...prev,
                                                            [c.path]: v === true,
                                                        }));
                                                    }}
                                                />
                                                <div className="text-sm text-gray-700 leading-snug">
                                                    I confirm that I have read and accept{" "}
                                                    <a
                                                        href={c.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="underline font-semibold text-black hover:text-gray-700"
                                                    >
                                                        {c.name}
                                                    </a>
                                                    .
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-semibold bg-black hover:bg-gray-800 text-white transition-all transform hover:scale-[1.02]"
                                disabled={loading || contractsLoading || (contracts.length > 0 && !allContractsAccepted)}
                            >
                                {loading ? "Submitting..." : "Submit Application"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
