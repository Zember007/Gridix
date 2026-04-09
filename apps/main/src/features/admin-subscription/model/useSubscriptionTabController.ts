import { useEffect, useState } from "react";
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
import {
  cancelStripeSubscriptionForProject,
  resumeStripeSubscriptionForProject,
  changeStripeSubscriptionPlan,
  createStripeCheckoutSession,
  fetchProjectSubscriptions as fetchProjectSubscriptionsApi,
} from "@/entities/subscription/api/subscriptionApi";
import { CheckoutPaymentMethod } from "@/features/subscription-checkout/model/types";

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
  const [planChangeProjectId, setPlanChangeProjectId] = useState<string | null>(
    null,
  );
  const [isChangeCardModalOpen, setIsChangeCardModalOpen] = useState(false);

  useEffect(() => {
    if (selectedDuration === 3) {
      setSelectedDuration(1);
    }
  }, [selectedDuration]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const stripeState = url.searchParams.get("stripe");
    if (stripeState !== "success") return;

    const rawPendingProjects = window.sessionStorage.getItem(
      "gridix_stripe_checkout_projects",
    );
    const pendingProjectIds = rawPendingProjects
      ? (JSON.parse(rawPendingProjects) as string[])
      : [];

    let attempts = 0;
    let cancelled = false;

    const finalizeUrl = () => {
      url.searchParams.delete("stripe");
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    };

    const run = async () => {
      while (!cancelled && attempts < 12) {
        attempts += 1;
        await refreshProjectSubscriptions();
        const latest = await fetchProjectSubscriptionsApi();
        const latestProjects = (latest?.projects ??
          []) as ProjectSubscription[];

        if (
          pendingProjectIds.length > 0 &&
          pendingProjectIds.every((projectId) => {
            const project = latestProjects.find(
              (item) => item.id === projectId,
            );
            if (!project) return false;
            const sub = project.user_subscriptions?.[0];
            if (!sub) return false;
            const periodEnd = sub.current_period_end
              ? new Date(sub.current_period_end).getTime()
              : null;
            const hasPaidAccess = periodEnd === null || periodEnd > Date.now();
            return ["active", "trialing"].includes(sub.status) && hasPaidAccess;
          })
        ) {
          toast.success("Payment confirmed. Projects are activated.");
          window.sessionStorage.removeItem("gridix_stripe_checkout_projects");
          finalizeUrl();
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      if (!cancelled) {
        toast.info(
          "Payment received. Activation is still syncing, please refresh shortly.",
        );
        finalizeUrl();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // Run only on mount for Stripe return URL handling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isProjectEligibleForNewPayment = (projectId: string): boolean => {
    const project = projectSubscriptions.find((p) => p.id === projectId);
    if (!project) return false;

    const sub = project.user_subscriptions?.[0];
    if (!sub) return true;

    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end).getTime()
      : null;
    const hasActivePaidPeriod = periodEnd !== null && periodEnd > Date.now();

    // Abandoned Stripe checkout leaves pending_payment with no paid period — user must retry.
    if (sub.status === "pending_payment") {
      return !hasActivePaidPeriod;
    }

    if (
      ["active", "trialing"].includes(sub.status) &&
      (periodEnd === null || hasActivePaidPeriod)
    ) {
      return false;
    }

    return true;
  };

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
    { value: 24, label: t("admin.subscriptionPage.durations.24") },
    { value: 36, label: t("admin.subscriptionPage.durations.36") },
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
    const project = projectSubscriptions.find((p) => p.id === projectId);
    const sub = project?.user_subscriptions?.[0];
    const periodEnd = sub?.current_period_end
      ? new Date(sub.current_period_end).getTime()
      : null;
    const hasPaidAccess = periodEnd === null || periodEnd > Date.now();
    const isCardPlanChangeCandidate =
      sub?.payment_method === "card" &&
      ["active", "trialing"].includes(sub.status) &&
      hasPaidAccess;

    const fallbackPlanId =
      currentPlanId || selectedPlanId || plans[0]?.id || "";
    setSelectedProjects([projectId]);
    if (fallbackPlanId) {
      setSelectedPlanId(fallbackPlanId);
    }
    setPlanChangeProjectId(isCardPlanChangeCandidate ? projectId : null);
    setIsInvoiceDialogOpen(true);
  };

  const handleConfirmInvoiceFromModal = async (
    payer: BillingDetails,
    projectIds: string[],
    method: CheckoutPaymentMethod,
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

      const isPlanChangeFlow =
        method === "card" &&
        planChangeProjectId !== null &&
        projectIds.length === 1 &&
        projectIds[0] === planChangeProjectId;

      if (isPlanChangeFlow) {
        const project = projectSubscriptions.find(
          (item) => item.id === planChangeProjectId,
        );
        const currentSub = project?.user_subscriptions?.[0];
        const currentPeriodEnd = currentSub?.current_period_end
          ? new Date(currentSub.current_period_end).getTime()
          : null;
        const hasCurrentPaidPeriod =
          currentPeriodEnd === null || currentPeriodEnd > Date.now();
        const isSamePlanAndPeriod =
          currentSub?.plan_id === selectedPlanId &&
          currentSub?.duration_months === selectedDuration;

        if (
          hasCurrentPaidPeriod &&
          ["active", "trialing"].includes(currentSub?.status ?? "") &&
          isSamePlanAndPeriod
        ) {
          toast.error(
            t("admin.subscriptionPage.toasts.planAlreadyActiveWithPeriod") ||
              "The selected plan and billing period are already active for this project.",
          );
          return;
        }

        await changeStripeSubscriptionPlan(
          planChangeProjectId,
          selectedPlanId,
          selectedDuration,
        );

        toast.success(t("admin.subscriptionPage.toasts.planChanged"));
        void trackUsertourEvent({
          eventName: "gridix_billing_plan_changed",
          properties: {
            project_id: planChangeProjectId,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
            payment_method: "card",
          },
          onceKey: "gridix_billing_plan_changed",
        });

        await refreshProjectSubscriptions();
        setIsInvoiceDialogOpen(false);
        setSelectedProjects([]);
        setPlanChangeProjectId(null);
        return;
      }

      const eligibleProjectIds = projectIds.filter((projectId) =>
        isProjectEligibleForNewPayment(projectId),
      );
      if (eligibleProjectIds.length === 0) {
        toast.error(
          t("admin.subscriptionPage.checkout.errors.noProjectsSelected"),
        );
        return;
      }

      if (method === "card") {
        const checkoutResult = await createStripeCheckoutSession(
          eligibleProjectIds,
          selectedPlanId,
          selectedDuration,
        );

        // If projects were added to an existing subscription (no redirect needed)
        if (checkoutResult?.added) {
          toast.success(
            t("admin.subscriptionPage.toasts.projectsAdded") ||
              "Projects added to existing subscription",
          );
          void trackUsertourEvent({
            eventName: "gridix_billing_checkout_started",
            properties: {
              project_ids: eligibleProjectIds,
              plan_id: selectedPlanId,
              duration_months: selectedDuration,
              payment_method: "card",
              added_to_existing: true,
            },
            onceKey: "gridix_billing_checkout_started",
          });
          await refreshProjectSubscriptions();
          setIsInvoiceDialogOpen(false);
          setSelectedProjects([]);
          setPlanChangeProjectId(null);
          return;
        }

        if (!checkoutResult?.url) {
          toast.error("Stripe checkout is not available for selected plan");
          return;
        }

        void trackUsertourEvent({
          eventName: "gridix_billing_checkout_started",
          properties: {
            project_ids: eligibleProjectIds,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
            payment_method: "card",
          },
          onceKey: "gridix_billing_checkout_started",
        });

        window.sessionStorage.setItem(
          "gridix_stripe_checkout_projects",
          JSON.stringify(eligibleProjectIds),
        );
        window.location.href = checkoutResult.url;
        return;
      }

      if (eligibleProjectIds.length === 1) {
        const projectId = eligibleProjectIds[0]!;
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
            project_ids: eligibleProjectIds,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
            payment_method: "invoice",
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
          eligibleProjectIds,
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
            count: eligibleProjectIds.length,
          }),
        );
        void trackUsertourEvent({
          eventName: "gridix_billing_invoice_requested",
          properties: {
            project_ids: eligibleProjectIds,
            plan_id: selectedPlanId,
            duration_months: selectedDuration,
            payment_method: "invoice",
          },
          onceKey: "gridix_billing_invoice_requested",
        });
        await refreshProjectSubscriptions();
      }

      setIsInvoiceDialogOpen(false);
      setSelectedProjects([]);
      setPlanChangeProjectId(null);
    } catch (error) {
      console.error("Error confirming invoice from modal:", error);
      toast.error(t("common.invoiceGenerationFailed"));
    }
  };

  const handleCancelSubscriptionForProject = async (projectId: string) => {
    const project = projectSubscriptions.find((p) => p.id === projectId);
    const sub = project?.user_subscriptions?.[0];
    if (!sub || sub.payment_method !== "card") return;

    try {
      await cancelStripeSubscriptionForProject(projectId);
      toast.success(
        t("admin.subscriptionPage.toasts.projectCancelled") ||
          "Subscription cancelled. Access continues until end of paid period.",
      );
      await refreshProjectSubscriptions();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      toast.error(
        t("common.operationFailed") || "Failed to cancel subscription",
      );
    }
  };

  const handleResumeSubscriptionForProject = async (projectId: string) => {
    const project = projectSubscriptions.find((p) => p.id === projectId);
    const sub = project?.user_subscriptions?.[0];
    if (!sub || sub.payment_method !== "card") return;

    try {
      await resumeStripeSubscriptionForProject(projectId);
      toast.success(
        t("admin.subscriptionPage.toasts.subscriptionResumed") ||
          "Auto-renewal enabled. Subscription will renew at the end of the period.",
      );
      await refreshProjectSubscriptions();
    } catch (err) {
      console.error("Error resuming subscription:", err);
      toast.error(
        t("common.operationFailed") || "Failed to resume subscription",
      );
    }
  };

  const handleOpenChangeCard = () => {
    setIsChangeCardModalOpen(true);
  };

  const handleCloseChangeCard = () => {
    setIsChangeCardModalOpen(false);
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
    isChangeCardModalOpen,
    selectedPlanId,
    selectedDuration,
    selectedProjects,
    planChangeProjectId,
    expiredProjects,
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
  };
};
