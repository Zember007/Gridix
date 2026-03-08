import React from "react";

export type PartnerDrawerTab = "overview" | "leads" | "finance" | "settings";

type Props = {
  activeTab: PartnerDrawerTab;
  setActiveTab: React.Dispatch<React.SetStateAction<PartnerDrawerTab>>;
  tabLabels: Record<PartnerDrawerTab, string>;
};

export const PartnerDrawerTabs: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  tabLabels,
}) => {
  return (
    <div className="flex border-b border-slate-200 px-6">
      {(["overview", "leads", "finance", "settings"] as PartnerDrawerTab[]).map(
        (tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === tab ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {tabLabels[tab]}
          </button>
        ),
      )}
    </div>
  );
};
