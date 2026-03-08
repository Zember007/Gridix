import React from "react";
import { DollarSign, Handshake, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  stats: {
    totalPartners: number;
    activePartners: number;
    totalSalesVolume: number;
    totalPendingCommission: number;
  };
};

export const AgencyPartnersStatsCards: React.FC<Props> = ({ stats }) => {
  const { t } = useLanguage();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-lg bg-slate-100 p-3 text-[var(--admin-primary)]">
          <Users size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("partners.stats.totalPartners")}
          </p>
          <p className="text-xl font-bold text-slate-900">
            {stats.totalPartners}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-lg bg-green-50 p-3 text-green-600">
          <Handshake size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("partners.stats.active")}
          </p>
          <p className="text-xl font-bold text-slate-900">
            {stats.activePartners}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("partners.stats.salesVolume")}
          </p>
          <p className="text-xl font-bold text-slate-900">
            ${(stats.totalSalesVolume / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
          <DollarSign size={20} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">
            {t("partners.stats.pendingPayout")}
          </p>
          <p className="text-xl font-bold text-slate-900">
            ${stats.totalPendingCommission.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
