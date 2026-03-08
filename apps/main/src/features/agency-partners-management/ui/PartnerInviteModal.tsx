import React, { useState, useEffect } from "react";
import {
  Copy,
  CheckCircle2,
  Mail,
  QrCode,
  Shield,
  X,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/shared/api/supabase";
import { type Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PartnerInviteModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const languageOptions = Object.keys(LANGUAGE_CONFIG) as Language[];
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteLanguage, setInviteLanguage] = useState<Language>(language);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setInviteLanguage(language);
  }, [language, isOpen]);

  const developerId = user?.id;
  const inviteLink = `${baseUrl}/${inviteLanguage}/agent/apply?developer_id=${developerId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("partners.inviteModal.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      toast.error(t("partners.inviteModal.inviteFailed"));
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "notifications-send-email",
        {
          body: {
            template_key: "partner_invite",
            to_email: trimmed,
            payload: { invite_link: inviteLink },
            locale: inviteLanguage,
          },
        },
      );
      if (error) throw error;
      if (data?.success) {
        toast.success(t("partners.inviteModal.inviteSent"));
        setEmail("");
        setShowEmailForm(false);
      } else {
        toast.error(
          (data?.error as string) || t("partners.inviteModal.inviteFailed"),
        );
      }
    } catch (err) {
      console.error("Send partner invite:", err);
      toast.error(t("partners.inviteModal.inviteFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleDownloadQr = () => {
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = "partner-invite-qr.png";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t("partners.inviteModal.qrDownload"));
  };

  return (
    <>
      {/* QR overlay */}
      {showQr && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              {t("partners.inviteModal.qrTitle")}
            </h3>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <img src={qrImageUrl} alt="QR code" className="h-48 w-48" />
            </div>
            <p className="mb-4 px-4 text-center text-xs text-slate-500">
              {t("partners.inviteModal.qrDescription")}
            </p>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Download size={16} /> {t("partners.inviteModal.qrDownload")}
            </button>
          </div>
        </div>
      )}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("partners.inviteModal.title")}</DialogTitle>
          </DialogHeader>
          <div className="min-w-0 space-y-6 overflow-hidden py-4">
            <div className="flex gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-4">
              <div className="h-fit rounded-full bg-[var(--admin-background-hover)] p-2 text-[var(--admin-primary)]">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--admin-text-primary)]">
                  {t("partners.inviteModal.leadLockProtocol")}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-secondary)]">
                  {t("partners.inviteModal.leadLockDescription")}
                </p>
              </div>
            </div>

            {/* Invite Link */}
            <div className="min-w-0 space-y-2 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  {t("partners.inviteModal.registrationLinkLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {t("partners.inviteModal.linkLanguageLabel")}
                  </span>
                  <select
                    value={inviteLanguage}
                    onChange={(e) =>
                      setInviteLanguage(e.target.value as Language)
                    }
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none transition-colors focus:border-[var(--admin-primary)]"
                  >
                    {languageOptions.map((code) => (
                      <option key={code} value={code}>
                        {LANGUAGE_CONFIG[code].flag}{" "}
                        {LANGUAGE_CONFIG[code].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex min-w-0 gap-2">
                <div className="min-w-0 flex-1 overflow-hidden truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-600">
                  {inviteLink}
                </div>
                <button
                  onClick={() => handleCopy(inviteLink)}
                  className={`rounded-lg border p-2.5 transition-all ${copied ? "border-green-200 bg-green-50 text-green-600" : "border-slate-200 bg-white text-slate-500 shadow-sm hover:text-[var(--admin-primary)]"}`}
                >
                  {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {t("partners.inviteModal.linkHint")}
              </p>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="flex flex-col justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Mail size={16} /> {t("partners.inviteModal.emailInvite")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQr(true);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <QrCode size={16} /> {t("partners.inviteModal.qrCode")}
              </button>
            </div>

            {showEmailForm && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <label className="text-xs font-bold uppercase text-slate-500">
                  {t("partners.inviteModal.emailPlaceholder")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  disabled={sending}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={sending || !email.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? t("partners.inviteModal.sending")
                      : t("partners.inviteModal.sendInvite")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmail("");
                    }}
                    disabled={sending}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {t("partners.generalConditions.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
