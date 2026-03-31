import { ProjectSubscriptionsList } from "@/entities/subscription/ui";
import { CheckoutModal } from "@/features/subscription-checkout";
import { Spinner } from "@/shared/ui/Spinner";
import { useSubscriptionTabController } from "@/features/admin-subscription/model/useSubscriptionTabController";
import { SubscriptionHeader } from "@/features/admin-subscription/ui/SubscriptionHeader";
import { SubscriptionPricingSection } from "@/features/admin-subscription/ui/SubscriptionPricingSection";
import { SubscriptionHistorySection } from "@/features/admin-subscription/ui/SubscriptionHistorySection";
import { ChangePaymentMethodModal } from "@/features/admin-subscription/ui/ChangePaymentMethodModal";
import { StripeInvoicesSection } from "@/features/admin-subscription/ui/StripeInvoicesSection";

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
    isChangeCardModalOpen,
    selectedProjects,
    selectedPlanId,
    selectedDuration,
    expiredProjects,
    planChangeProjectId,
    durationOptions,
    refreshProjectSubscriptions,
    setSelectedPlanId,
    setSelectedDuration,
    setSelectedProjects,
    setIsInvoiceDialogOpen,
    setPlanChangeProjectId,
    handleOpenInvoiceForProject,
    handleConfirmInvoiceFromModal,
    handleCancelSubscriptionForProject,
    handleResumeSubscriptionForProject,
    handleOpenChangeCard,
    handleCloseChangeCard,
  } = useSubscriptionTabController();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex flex-col gap-10 pb-20 duration-500 animate-in fade-in">
      {/* Header / Active Plans (как в SubscriptionPage) */}
      <section className="space-y-4">
        <SubscriptionHeader
          title={t("admin.subscriptionPage.title")}
          refreshLabel={t("admin.subscriptionPage.refresh")}
          changePaymentMethodLabel={
            t("admin.subscriptionPage.projects.buttons.changeCard") ||
            "Change payment method"
          }
          onRefresh={refreshProjectSubscriptions}
          onChangePaymentMethod={handleOpenChangeCard}
        />

        <ProjectSubscriptionsList
          projects={projectSubscriptions}
          onOpenInvoice={handleOpenInvoiceForProject}
          onCancelProject={handleCancelSubscriptionForProject}
          onResumeProject={handleResumeSubscriptionForProject}
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
          setPlanChangeProjectId(null);
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

      <StripeInvoicesSection />

      {isInvoiceDialogOpen && (
        <CheckoutModal
          isOpen={isInvoiceDialogOpen}
          onClose={() => {
            setIsInvoiceDialogOpen(false);
            setPlanChangeProjectId(null);
          }}
          projects={projectSubscriptions}
          initialSelectedProjectIds={selectedProjects}
          plans={plans}
          selectedPlanId={selectedPlanId || plans[0]?.id || ""}
          selectedDuration={selectedDuration}
          planChangeProjectId={planChangeProjectId}
          billingDetails={billingDetails}
          onPlanChange={(planId) => setSelectedPlanId(planId)}
          onDurationChange={setSelectedDuration}
          onConfirm={handleConfirmInvoiceFromModal}
        />
      )}

      {isChangeCardModalOpen && (
        <ChangePaymentMethodModal
          onClose={handleCloseChangeCard}
          onSuccess={refreshProjectSubscriptions}
        />
      )}
    </div>
  );
}
