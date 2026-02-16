import React, { useState } from "react";
import { AgencyPartner } from "./types";
import { Wallet, Building2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: AgencyPartner | null;
  onPayout: (amount: number) => void;
}

export const PartnerPayoutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  partner,
  onPayout,
}) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");

  if (!partner) return null;

  const maxAmount = partner.stats.commissionPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (val > 0 && val <= maxAmount) {
      onPayout(val);
      onClose();
      setAmount("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("partners.payoutModal.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
              <Building2 size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">{partner.name}</div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">
                {partner.bankDetails?.details ||
                  t("partners.drawer.noBankDetails")}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {t("partners.payoutModal.availableToPayout")}
              </span>
              <span className="font-bold text-slate-900">
                ${maxAmount.toLocaleString()}
              </span>
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                {t("partners.payoutModal.amountLabel")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-4 font-mono text-lg font-bold outline-none transition-all focus:ring-green-500"
                  placeholder={t("partners.payoutModal.amountPlaceholder")}
                  autoFocus
                  max={maxAmount}
                />
              </div>
            </div>

            {maxAmount === 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                <AlertCircle size={14} className="mt-0.5" />
                {t("partners.payoutModal.noCommissions")}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                !amount || Number(amount) <= 0 || Number(amount) > maxAmount
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-6 font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 disabled:opacity-50"
            >
              <Wallet size={18} /> {t("partners.payoutModal.confirmPayout")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
