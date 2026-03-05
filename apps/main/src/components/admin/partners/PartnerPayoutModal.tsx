import React, { useState, useEffect } from "react";
import { AgencyPartner, PayoutItem } from "./types";
import { Wallet, Building2, AlertCircle, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: AgencyPartner | null;
  onPayout: (payoutIds: string[]) => Promise<void>;
  getPendingPayouts: (partnerId: string) => Promise<PayoutItem[]>;
}

export const PartnerPayoutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  partner,
  onPayout,
  getPendingPayouts,
}) => {
  const { t } = useLanguage();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && partner) {
      setLoading(true);
      getPendingPayouts(partner.id).then((res) => {
        setPayouts(res);
        setLoading(false);
      });
    } else {
      setPayouts([]);
      setSelectedIds(new Set());
    }
  }, [isOpen, partner, getPendingPayouts]);

  if (!partner) return null;

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === payouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payouts.map((p) => p.id)));
    }
  };

  const totalSelected = payouts
    .filter((p) => selectedIds.has(p.id))
    .reduce((acc, p) => acc + p.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size > 0) {
      setSubmitting(true);
      try {
        await onPayout(Array.from(selectedIds));
        onClose();
      } finally {
        setSubmitting(false);
      }
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase text-slate-500">
                {t("partners.payoutModal.soldObjects")}
              </span>
              {payouts.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-bold text-green-600 hover:text-green-700"
                >
                  {selectedIds.size === payouts.length
                    ? t("partners.payoutModal.deselectAll")
                    : t("partners.payoutModal.selectAll")}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Loader2 className="mb-2 animate-spin" size={24} />
                <span className="text-xs">
                  {t("partners.payoutModal.loadingPayouts")}
                </span>
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-xs text-amber-700">
                <AlertCircle size={16} className="shrink-0" />
                {t("partners.payoutModal.noCommissions")}
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-2">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => toggleSelection(p.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      selectedIds.has(p.id)
                        ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                        selectedIds.has(p.id)
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selectedIds.has(p.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-900">
                        {p.leadName || t("partners.payoutModal.unknownLead")}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {p.date ? new Date(p.date).toLocaleDateString() : "-"}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      ${p.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
              <span className="text-sm font-medium opacity-70">
                {t("partners.payoutModal.totalSelected")}
              </span>
              <span className="text-xl font-bold">
                ${totalSelected.toLocaleString()}
              </span>
            </div>

            <Button
              type="submit"
              disabled={selectedIds.size === 0 || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-6 font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wallet size={18} />
              )}{" "}
              {t("partners.payoutModal.confirmPayout")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
