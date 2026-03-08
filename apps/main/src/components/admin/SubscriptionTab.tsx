import { useState } from "react";
import { Button } from "@gridix/ui";
import {
  useSubscription,
  ProjectSubscription,
  BillingDetails,
} from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { toast } from "sonner";
import {
  ProjectSubscriptionsList,
  DurationSelector,
  PricingPlans,
  OrderHistory,
} from "@/entities/subscription/ui";
import { CheckoutModal } from "@/features/subscription-checkout";
import { trackUsertourEvent } from "@gridix/utils/integrations";
import { Spinner } from "@/shared/ui/Spinner";

export default function SubscriptionTab() {
  const {
    projectSubscriptions,
    plans,
    loading,
    plansLoading,
    requestInvoice,
    requestInvoiceForMultiple,
    refreshProjectSubscriptions,
    error,
    billingDetails,
    saveBillingDetails,
    orders,
  } = useSubscription();
  const { t } = useLanguage();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  if (loading || plansLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold">
          {t("admin.subscriptionPage.error")}
        </h3>
        <p className="mb-4 text-center text-muted-foreground">{error}</p>
        <Button onClick={refreshProjectSubscriptions} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const expiredProjects = projectSubscriptions.filter(
    (proj: ProjectSubscription) => {
      const sub = proj.user_subscriptions?.[0];
      const isExpired =
        proj.subscription_expires_at &&
        new Date(proj.subscription_expires_at) < new Date();
      return (
        !sub ||
        sub.status === "expired" ||
        isExpired ||
        !["active", "trialing", "pending_payment"].includes(sub.status)
      );
    },
  );

  const handleViewInvoice = async (
    subscriptionId?: string,
    payerType?: BillingDetails["type"],
  ) => {
    if (!subscriptionId) return;
    try {
      const sessionData = await fetchCurrentSession();
      if (!sessionData.session?.access_token) {
        toast.error("Please log in to view invoice");
        return;
      }

      // Call edge function to get invoice HTML
      const { data, error } = await supabase.functions.invoke(
        "generate-invoice",
        {
          body: {
            subscription_id: subscriptionId,
            payer_type: payerType,
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        },
      );

      if (error) {
        throw error;
      }

      // Handle specific error responses from the backend
      if (data.error) {
        const errorMessage = t("common.invoiceGenerationFailed");

        toast.error(errorMessage);
        return;
      }

      // Download PDF file
      if (data.success && data.invoice?.url) {
        // Fetch the PDF file and create a blob for download
        try {
          const response = await fetch(data.invoice.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = `invoice-${data.invoice.number}.pdf`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          window.URL.revokeObjectURL(url);
          toast.success("Invoice downloaded successfully");
        } catch (fetchError) {
          console.error("Error downloading PDF:", fetchError);
          // Fallback: open in new tab
          window.open(data.invoice.url, "_blank");
          toast.info("Invoice opened in new tab");
        }
      } else {
        toast.error(t("common.invoiceGenerationFailed"));
      }
    } catch (error) {
      console.error("Error opening invoice:", error);
      toast.error(t("common.companySettingsIncomplete"));
    }
  };

  const durationOptions = [
    { value: 1, label: t("admin.subscriptionPage.durations.1") },
    { value: 6, label: t("admin.subscriptionPage.durations.6") },
    { value: 12, label: t("admin.subscriptionPage.durations.12") },
  ];

  const handleOpenInvoiceForProject = (
    projectId: string,
    currentPlanId?: string | null,
  ) => {
    setSelectedProjects([projectId]);
    if (currentPlanId) {
      setSelectedPlanId(currentPlanId);
    }
    setIsInvoiceDialogOpen(true);
  };

  const handleConfirmInvoiceFromModal = async (
    payer: BillingDetails,
    projectIds: string[],
  ): Promise<void> => {
    if (!selectedPlanId) {
      toast.error(t("admin.subscriptionPage.checkout.errors.selectPlan"));
      return;
    }

    if (projectIds.length === 0) {
      toast.error(
        t("admin.subscriptionPage.checkout.errors.noProjectsSelected"),
      );
      return;
    }

    try {
      // Save payer details to Supabase
      await saveBillingDetails(payer);

      if (projectIds.length === 1) {
        const projectId = projectIds[0]!;
        const result = await requestInvoice(
          projectId,
          selectedPlanId,
          selectedDuration,
        );

        if (result?.error) {
          toast.error(t("common.invoiceGenerationFailed"));
          return;
        }

        toast.success(
          t("admin.subscriptionPage.toasts.invoiceRequestedSingle"),
        );
        void trackUsertourEvent({
          eventName: "gridix_billing_invoice_requested",
          properties: {
            project_ids: projectIds,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
          },
          onceKey: "gridix_billing_invoice_requested",
        });
        await refreshProjectSubscriptions();

        const subscriptionId = result?.invoice?.subscription_id;
        if (subscriptionId) {
          setTimeout(() => {
            handleViewInvoice(subscriptionId as string, payer.type);
          }, 1000);
        }
      } else {
        const results = await requestInvoiceForMultiple(
          projectIds,
          selectedPlanId,
          selectedDuration,
        );

        const errorResult = results.find(
          (res) => (res as { error?: unknown }).error,
        );
        if (errorResult) {
          toast.error(t("common.invoiceGenerationFailed"));
          return;
        }

        toast.success(
          t("admin.subscriptionPage.toasts.invoiceRequestedMultiple", {
            count: projectIds.length,
          }),
        );
        void trackUsertourEvent({
          eventName: "gridix_billing_invoice_requested",
          properties: {
            project_ids: projectIds,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
          },
          onceKey: "gridix_billing_invoice_requested",
        });
        await refreshProjectSubscriptions();
      }

      setIsInvoiceDialogOpen(false);
      setSelectedProjects([]);
    } catch (error) {
      console.error("Error confirming invoice from modal:", error);
      toast.error(t("common.invoiceGenerationFailed"));
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-10 pb-20 duration-500 animate-in fade-in">
      {/* Header / Active Plans (как в SubscriptionPage) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("admin.subscriptionPage.title")}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProjectSubscriptions}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("admin.subscriptionPage.refresh")}
          </Button>
        </div>

        <ProjectSubscriptionsList
          projects={projectSubscriptions}
          onOpenInvoice={handleOpenInvoiceForProject}
        />
      </section>

      {/* Pricing Section (как в SubscriptionPage) */}
      <section className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {t("admin.subscriptionPage.pricing.availablePlansTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.subscriptionPage.pricing.availablePlansDescription")}
          </p>
        </div>

        {/* Period selector */}
        <DurationSelector
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
          options={durationOptions}
        />

        {/* Plans grid */}
        <PricingPlans
          plans={plans}
          selectedDuration={selectedDuration}
          onSelectPlan={setSelectedPlanId}
          onOpenCheckout={(planId) => {
            setSelectedPlanId(planId);
            if (selectedProjects.length === 0 && expiredProjects.length > 0) {
              setSelectedProjects(expiredProjects.map((p) => p.id));
            }
            setIsInvoiceDialogOpen(true);
          }}
          expiredProjectsCount={expiredProjects.length}
        />
      </section>

      {/* History Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          {t("admin.subscriptionPage.history.title")}
        </h2>
        <OrderHistory orders={orders} projects={projectSubscriptions} />
      </section>

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
