import React, { useState } from "react";
import { useAgencyPartners } from "../model/useAgencyPartners";
import { PartnerInviteModal } from "./PartnerInviteModal";
import { PartnerPayoutModal } from "./PartnerPayoutModal";
import { AgencyGeneralConditions } from "@/features/agency-general-conditions/ui/AgencyGeneralConditions";
import type { AgencyPartner } from "@/entities/agency-partner";
import { PartnerDrawer } from "./PartnerDrawer";
import { AgencyPartnersHeader } from "./AgencyPartnersHeader";
import { AgencyPartnersDeleteDialog } from "./AgencyPartnersDeleteDialog";
import { AgencyPartnersStatsCards } from "./AgencyPartnersStatsCards";
import { AgencyPartnersTable } from "./AgencyPartnersTable";

export const AgencyPartnersPage: React.FC = () => {
  const {
    partners,
    loading,
    filters,
    setFilters,
    approvePartner,
    updatePartnerStatus,
    updatePartnerCommission,
    markPaid,
    getPendingPayouts,
    deletePartner,
    stats,
    developerId,
    isManagerMode,
  } = useAgencyPartners();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<AgencyPartner | null>(
    null,
  );
  const [payoutTarget, setPayoutTarget] = useState<AgencyPartner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<AgencyPartner | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"list" | "conditions">("list");

  const handleStatusFilterCycle = () => {
    const cycle: Array<NonNullable<typeof filters.status>> = [
      "all",
      "pending",
      "needs_correction",
      "active",
      "blocked",
    ];
    const current = (filters.status ?? "all") as NonNullable<
      typeof filters.status
    >;
    const currentIndex = cycle.indexOf(current);
    const next = cycle[(currentIndex + 1) % cycle.length] ?? "all";
    setFilters((prev) => ({ ...prev, status: next }));
  };

  const handlePartnerUpdate = (id: string, data: Partial<AgencyPartner>) => {
    if (data.commissionRate) updatePartnerCommission(id, data.commissionRate);
    if (data.status) {
      const nextStatus = data.status as AgencyPartner["status"];
      const current = selectedPartner?.id === id ? selectedPartner : null;
      if (
        nextStatus === "active" &&
        (current?.status === "pending" ||
          current?.status === "needs_correction")
      ) {
        approvePartner(id);
      } else {
        updatePartnerStatus(
          id,
          nextStatus,
          nextStatus === "needs_correction" ? data.rejectionReason : undefined,
        );
      }
    }
  };

  return (
    <div className="flex flex-col">
      <PartnerInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <PartnerPayoutModal
        isOpen={!!payoutTarget}
        onClose={() => setPayoutTarget(null)}
        partner={payoutTarget}
        onPayout={async (payoutIds) => {
          if (!payoutTarget) return;
          await markPaid(payoutIds);
        }}
        getPendingPayouts={getPendingPayouts}
      />

      <AgencyPartnersDeleteDialog
        partnerToDelete={partnerToDelete}
        setPartnerToDelete={setPartnerToDelete}
        deletePartner={deletePartner}
      />

      <PartnerDrawer
        partner={selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onUpdate={handlePartnerUpdate}
        onPayout={(partner: AgencyPartner) => {
          setSelectedPartner(null);
          setPayoutTarget(partner);
        }}
        developerId={developerId}
      />

      <AgencyPartnersHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsInviteModalOpen={setIsInviteModalOpen}
        filters={filters}
        setFilters={setFilters}
        pendingRequests={stats.pendingRequests}
        partners={partners}
        partnersLoading={loading}
      />

      <div className="flex-1">
        <div className="py-6">
          {activeTab === "list" && (
            <>
              <AgencyPartnersStatsCards stats={stats} />
              <AgencyPartnersTable
                partners={partners}
                filters={filters}
                handleStatusFilterCycle={handleStatusFilterCycle}
                setSelectedPartner={setSelectedPartner}
                setPayoutTarget={setPayoutTarget}
                setPartnerToDelete={setPartnerToDelete}
                approvePartner={approvePartner}
                updatePartnerStatus={updatePartnerStatus}
                isManagerMode={isManagerMode}
              />
            </>
          )}

          {activeTab === "conditions" && <AgencyGeneralConditions />}
        </div>
      </div>
    </div>
  );
};
