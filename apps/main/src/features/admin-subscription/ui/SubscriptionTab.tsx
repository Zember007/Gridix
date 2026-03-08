import { Button } from "@gridix/ui";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ProjectSubscriptionsList } from "@/entities/subscription/ui";
import { CheckoutModal } from "@/features/subscription-checkout";
import { Spinner } from "@/shared/ui/Spinner";
import { useSubscriptionTabController } from "@/features/admin-subscription/model/useSubscriptionTabController";
import { SubscriptionHeader } from "@/features/admin-subscription/ui/SubscriptionHeader";
import { SubscriptionPricingSection } from "@/features/admin-subscription/ui/SubscriptionPricingSection";
import { SubscriptionHistorySection } from "@/features/admin-subscription/ui/SubscriptionHistorySection";

export default function SubscriptionTab() {
  const {
    t,
    projectSubscriptions,
    loading,
    plansLoading,
    error,
    plans,
    orders,
    billingDetails,
    isInvoiceDialogOpen,
    selectedProjects,
    selectedPlanId,
    selectedDuration,
    expiredProjects,
    durationOptions,
    refreshProjectSubscriptions,
    setSelectedPlanId,
    setSelectedDuration,
    setSelectedProjects,
    setIsInvoiceDialogOpen,
    handleOpenInvoiceForProject,
    handleConfirmInvoiceFromModal,
  } = useSubscriptionTabController();

  return (
    <div className="mx-auto flex flex-col gap-10 pb-20 duration-500 animate-in fade-in">
      {/* Header / Active Plans (как в SubscriptionPage) */}
      <section className="space-y-4">
        <SubscriptionHeader
          title={t("admin.subscriptionPage.title")}
          refreshLabel={t("admin.subscriptionPage.refresh")}
          onRefresh={refreshProjectSubscriptions}
        />

        <ProjectSubscriptionsList
          projects={projectSubscriptions}
          onOpenInvoice={handleOpenInvoiceForProject}
        />
      </section>

      {/* Pricing Section (как в SubscriptionPage) */}
      <SubscriptionPricingSection
        title={t("admin.subscriptionPage.pricing.availablePlansTitle")}
        description={t(
          "admin.subscriptionPage.pricing.availablePlansDescription",
        )}
        durationOptions={durationOptions}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        plans={plans}
        onSelectPlan={setSelectedPlanId}
        onOpenCheckout={(planId) => {
          setSelectedPlanId(planId);
          if (selectedProjects.length === 0 && expiredProjects.length > 0) {
            setSelectedProjects(expiredProjects.map((p) => p.id));
            setIsInvoiceDialogOpen(true);
            return;
          }
          setIsInvoiceDialogOpen(true);
        }}
        expiredProjectsCount={expiredProjects.length}
      />

      <SubscriptionHistorySection
        title={t("admin.subscriptionPage.history.title")}
        orders={orders}
        projects={projectSubscriptions}
      />

      {/* Модальное окно оформления подписки */}
      {isInvoiceDialogOpen && selectedPlanId && (
        <CheckoutModal
          isOpen={isInvoiceDialogOpen}
          onClose={() => setIsInvoiceDialogOpen(false)}
          projects={projectSubscriptions}
          initialSelectedProjectIds={selectedProjects}
          plans={plans}
          selectedPlanId={selectedPlanId}
          selectedDuration={selectedDuration}
          billingDetails={billingDetails}
          onPlanChange={(planId) => setSelectedPlanId(planId)}
          onDurationChange={setSelectedDuration}
          onConfirm={handleConfirmInvoiceFromModal}
        />
      )}
    </div>
  );
}
