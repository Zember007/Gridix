import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Mail, QrCode, Shield, X, Download } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@gridix/ui";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@gridix/utils/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PartnerInviteModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [showQr, setShowQr] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const developerId = user?.id;
    const inviteLink = `${baseUrl}/${language}/agent/apply?developer_id=${developerId}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(t('partners.inviteModal.linkCopied'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvite = async () => {
        const trimmed = email.trim();
        if (!EMAIL_REGEX.test(trimmed)) {
            toast.error(t('partners.inviteModal.inviteFailed'));
            return;
        }
        setSending(true);
        try {
            const { data, error } = await supabase.functions.invoke('notifications-send-email', {
                body: {
                    template_key: 'partner_invite',
                    to_email: trimmed,
                    payload: { invite_link: inviteLink },
                    locale: language,
                },
            });
            if (error) throw error;
            if (data?.success) {
                toast.success(t('partners.inviteModal.inviteSent'));
                setEmail('');
                setShowEmailForm(false);
            } else {
                toast.error((data?.error as string) || t('partners.inviteModal.inviteFailed'));
            }
        } catch (err) {
            console.error('Send partner invite:', err);
            toast.error(t('partners.inviteModal.inviteFailed'));
        } finally {
            setSending(false);
        }
    };

    const handleDownloadQr = () => {
        const a = document.createElement('a');
        a.href = qrImageUrl;
        a.download = 'partner-invite-qr.png';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(t('partners.inviteModal.qrDownload'));
    };

    return (
        <>
         {/* QR overlay */}
         {showQr && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowQr(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center relative border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowQr(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            {t('partners.inviteModal.qrTitle')}
                        </h3>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm mb-4">
                            <img
                                src={qrImageUrl}
                                alt="QR code"
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-xs text-slate-500 text-center mb-4 px-4">
                            {t('partners.inviteModal.qrDescription')}
                        </p>
                        <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                            <Download size={16} /> {t('partners.inviteModal.qrDownload')}
                        </button>
                    </div>
                </div>
            )}
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('partners.inviteModal.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4 min-w-0 overflow-hidden">
                        <div className="bg-[var(--admin-background-secondary)] border border-[var(--admin-border)] rounded-xl p-4 flex gap-3">
                            <div className="bg-[var(--admin-background-hover)] p-2 rounded-full h-fit text-[var(--admin-primary)]"><Shield size={18} /></div>
                            <div>
                                <h4 className="font-bold text-[var(--admin-text-primary)] text-sm">{t('partners.inviteModal.leadLockProtocol')}</h4>
                                <p className="text-xs text-[var(--admin-text-secondary)] mt-1 leading-relaxed">
                                    {t('partners.inviteModal.leadLockDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Invite Link */}
                        <div className="space-y-2 min-w-0 overflow-hidden">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t('partners.inviteModal.registrationLinkLabel')}</label>
                            <div className="flex gap-2 min-w-0">
                                <div className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 font-mono truncate overflow-hidden">
                                    {inviteLink}
                                </div>
                                <button
                                    onClick={() => handleCopy(inviteLink)}
                                    className={`p-2.5 rounded-lg border transition-all ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-500 hover:text-[var(--admin-primary)] shadow-sm'}`}
                                >
                                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400">{t('partners.inviteModal.linkHint')}</p>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        <div className="flex justify-between flex-col gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowEmailForm(true)}
                                className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white"
                            >
                                <Mail size={16} /> {t('partners.inviteModal.emailInvite')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {setShowQr(true); onClose();}}
                                className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white"
                            >
                                <QrCode size={16} /> {t('partners.inviteModal.qrCode')}
                            </button>
                        </div>

                        {showEmailForm && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('partners.inviteModal.emailPlaceholder')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="partner@example.com"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white"
                                    disabled={sending}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSendInvite}
                                        disabled={sending || !email.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[var(--admin-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? t('partners.inviteModal.sending') : t('partners.inviteModal.sendInvite')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowEmailForm(false); setEmail(''); }}
                                        disabled={sending}
                                        className="py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    >
                                        {t('partners.generalConditions.cancel')}
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
