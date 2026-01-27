import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Link, Mail, QrCode, Shield } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const PartnerInviteModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const developerId = user?.id;
    const inviteLink = `${baseUrl}/${language}/agent/apply?developer_id=${developerId}`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Ссылка скопирована');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Приглашение партнеров</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <div className="bg-blue-100 p-2 rounded-full h-fit text-blue-600"><Shield size={18} /></div>
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Lead Lock Protocol</h4>
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                Партнеры, зарегистрированные по этой ссылке, автоматически подписывают ваш стандартный агентский договор (оферту). Все их лиды будут защищены системой.
                            </p>
                        </div>
                    </div>

                    {/* Invite Link */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Ссылка для регистрации агента</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 font-mono truncate">
                                {inviteLink}
                            </div>
                            <button
                                onClick={() => handleCopy(inviteLink)}
                                className={`p-2.5 rounded-lg border transition-all ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm'}`}
                            >
                                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400">Отправьте эту ссылку агенту или руководителю агентства недвижимости.</p>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white">
                            <Mail size={16} /> Email приглашение
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm bg-white">
                            <QrCode size={16} /> QR-код
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
