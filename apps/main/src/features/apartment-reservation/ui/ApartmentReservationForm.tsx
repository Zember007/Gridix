import { useState } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { SuccessNotification } from "@gridix/ui";
import { getAttributedAgentId } from "@/shared/lib/agent-attribution";
import {
  isValidLeadPhone,
  normalizeLeadPhoneE164,
} from "@/shared/lib/validateLeadPhone";
import {
  extractFunctionErrorMessageFromPayload,
  hasTruthyErrorField,
  resolveSupabaseFunctionInvokeErrorMessage,
} from "@/shared/lib/resolveSupabaseFunctionInvokeErrorMessage";

/** Sonner по умолчанию может держать error до ручного закрытия. */
const ERROR_TOAST_DURATION_MS = 5000;

interface ApartmentReservationFormProps {
  apartmentId: string;
  projectId: string;
  onSubmit?: (payload: {
    name: string;
    email: string;
    phone: string;
    apartmentId: string;
    projectId: string;
  }) => void;
  onCancel?: () => void;
  themeColor?: string;
}

const ApartmentReservationForm = ({
  apartmentId,
  projectId,
  onSubmit,
  onCancel,
  themeColor = "#000000",
}: ApartmentReservationFormProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const normalizedPhone = normalizeLeadPhoneE164(phone);
  const phoneValid = isValidLeadPhone(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!phoneValid) {
      toast.error(t("apartment.invalidPhone"), {
        duration: ERROR_TOAST_DURATION_MS,
      });
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        onSubmit({
          name,
          email,
          phone: normalizedPhone,
          apartmentId,
          projectId,
        });
      }

      const { data, error } = await supabase.functions.invoke(
        "crm-create-lead",
        {
          body: {
            name,
            email,
            phone: normalizedPhone,
            apartmentId,
            projectId,
            agentId: getAttributedAgentId(projectId),
          },
        },
      );

      if (error) {
        console.error("Error creating lead:", error);
        const message = await resolveSupabaseFunctionInvokeErrorMessage(
          data,
          error,
          t("apartment.leadSubmitError"),
        );
        toast.error(message, { duration: ERROR_TOAST_DURATION_MS });
        return;
      }

      const payloadError = extractFunctionErrorMessageFromPayload(data);
      if (payloadError) {
        console.error("crm-create-lead error payload:", data);
        toast.error(payloadError, { duration: ERROR_TOAST_DURATION_MS });
        return;
      }

      if (hasTruthyErrorField(data)) {
        console.error("crm-create-lead error flag without message:", data);
        toast.error(t("apartment.leadSubmitError"), {
          duration: ERROR_TOAST_DURATION_MS,
        });
        return;
      }

      setShowSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error(t("apartment.leadUnexpectedError"), {
        duration: ERROR_TOAST_DURATION_MS,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setTimeout(() => {
      onCancel?.();
    }, 300);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reservation-name">
            {t("managerAccounts.fullName")}
          </Label>
          <Input
            id="reservation-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("managerAccounts.fullNamePlaceholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reservation-email">{t("auth.email")}</Label>
          <Input
            id="reservation-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("managerAccounts.emailPlaceholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reservation-phone">
            {t("managerAccounts.phone")}
          </Label>
          <Input
            id="reservation-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+995 (999) 00-00-00"
            required
            aria-describedby="reservation-phone-hint"
          />
          <p
            id="reservation-phone-hint"
            className="text-xs text-muted-foreground"
          >
            {t("apartment.phoneFormatHint")}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("managerAccounts.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            {submitting ? t("auth.sending") : t("apartment.sendRequest")}
          </Button>
        </div>
      </form>

      <SuccessNotification
        isVisible={showSuccess}
        onClose={handleSuccessClose}
        message={t("apartment.requestSent")}
        duration={2500}
      />
    </>
  );
};

export default ApartmentReservationForm;
