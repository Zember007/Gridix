import React, { useState } from 'react';
import { AgencyPartner } from './types';
import { Wallet, Building2, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    partner: AgencyPartner | null;
    onPayout: (amount: number) => void;
}

export const PartnerPayoutModal: React.FC<Props> = ({ isOpen, onClose, partner, onPayout }) => {
    const { t } = useLanguage();
    const [amount, setAmount] = useState('');

    if (!partner) return null;

    const maxAmount = partner.stats.commissionPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = Number(amount);
        if (val > 0 && val <= maxAmount) {
            onPayout(val);
            onClose();
            setAmount('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('partners.payoutModal.title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{partner.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{partner.bankDetails?.details || t('partners.drawer.noBankDetails')}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">{t('partners.payoutModal.availableToPayout')}</span>
                            <span className="font-bold text-slate-900">${maxAmount.toLocaleString()}</span>
                        </div>

                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">{t('partners.payoutModal.amountLabel')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none focus:ring-green-500 transition-all font-mono"
                                    placeholder={t('partners.payoutModal.amountPlaceholder')}
                                    autoFocus
                                    max={maxAmount}
                                />
                            </div>
                        </div>

                        {maxAmount === 0 && (
                            <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-lg flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5" />
                                {t('partners.payoutModal.noCommissions')}
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={!amount || Number(amount) <= 0 || Number(amount) > maxAmount}
                            className="w-full py-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Wallet size={18} /> {t('partners.payoutModal.confirmPayout')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
