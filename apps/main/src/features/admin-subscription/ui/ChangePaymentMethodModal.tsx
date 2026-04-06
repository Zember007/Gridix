import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X, Loader2 } from "lucide-react";
import { Button } from "@gridix/ui";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createSetupIntent,
  setDefaultPaymentMethod,
} from "@/entities/subscription/api/subscriptionApi";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

interface ChangePaymentMethodModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function SetupForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        toast.error(error.message ?? "Failed to save card");
        return;
      }

      if (setupIntent?.status === "succeeded" && setupIntent.payment_method) {
        const pmId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method.id;

        await setDefaultPaymentMethod(pmId);
        toast.success(
          t("admin.subscriptionPage.toasts.cardUpdated") ||
            "Payment method updated successfully",
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Error updating payment method:", err);
      toast.error(
        t("common.operationFailed") || "Failed to update payment method",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          {t("common.cancel") || "Cancel"}
        </Button>
        <Button type="submit" disabled={submitting || !stripe || !elements}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {t("common.saving") || "Saving..."}
            </span>
          ) : (
            t("admin.subscriptionPage.projects.buttons.saveCard") || "Save card"
          )}
        </Button>
      </div>
    </form>
  );
}

export const ChangePaymentMethodModal: React.FC<
  ChangePaymentMethodModalProps
> = ({ onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await createSetupIntent();
        if (!cancelled) {
          setClientSecret(result.client_secret);
        }
      } catch (err) {
        console.error("Failed to create setup intent:", err);
        toast.error(
          t("common.operationFailed") || "Failed to initialize payment form",
        );
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoadingSecret(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <p className="text-sm text-red-600">
            Stripe publishable key is not configured
            (VITE_STRIPE_PUBLISHABLE_KEY).
          </p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {t("admin.subscriptionPage.projects.buttons.changeCard") ||
              "Change payment card"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {loadingSecret || !clientSecret ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <SetupForm onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};
