import { useState } from "react";
import {
  BillingDetails,
  ProjectSubscription,
} from "@/entities/subscription/queries/useSubscription";
import { useSubscription } from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/shared/api/supabase";
import { fetchCurrentSession } from "@gridix/utils";
import { toast } from "sonner";
import { trackUsertourEvent } from "@gridix/utils/integrations";

export const useSubscriptionTabController = () => {
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

  const durationOptions = [
    { value: 1, label: t("admin.subscriptionPage.durations.1") },
    { value: 6, label: t("admin.subscriptionPage.durations.6") },
    { value: 12, label: t("admin.subscriptionPage.durations.12") },
  ];

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

      if (error) throw error;

      if (data.error) {
        toast.error(t("common.invoiceGenerationFailed"));
        return;
      }

      if (data.success && data.invoice?.url) {
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

          window.URL.revokeObjectURL(url);
          toast.success("Invoice downloaded successfully");
        } catch (fetchError) {
          console.error("Error downloading PDF:", fetchError);
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

  return {
    t,
    loading,
    plansLoading,
    error,
    projectSubscriptions,
    plans,
    orders,
    billingDetails,
    isInvoiceDialogOpen,
    selectedPlanId,
    selectedDuration,
    selectedProjects,
    expiredProjects,
    durationOptions,
    refreshProjectSubscriptions,
    setSelectedPlanId,
    setSelectedDuration,
    setSelectedProjects,
    setIsInvoiceDialogOpen,
    handleOpenInvoiceForProject,
    handleConfirmInvoiceFromModal,
  };
};
