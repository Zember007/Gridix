import { useState } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { SuccessNotification } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { getAttributedAgentId } from "@/shared/lib/agent-attribution";
import {
  extractFunctionErrorMessageFromPayload,
  hasTruthyErrorField,
  resolveSupabaseFunctionInvokeErrorMessage,
} from "@/shared/lib/resolveSupabaseFunctionInvokeErrorMessage";

/** Sonner по умолчанию может держать error до ручного закрытия. */
const ERROR_TOAST_DURATION_MS = 5000;

/** Соответствует `packages/ui` Input — визуально едино с остальными полями. */
const phoneFieldInputClassName = cn(
  "flex h-10 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  /* Библиотека обнуляет левые скругления — откатываем, блоки визуально раздельны. */
  "!rounded-md",
);

const phoneInputContainerStyle = {
  "--react-international-phone-height": "2.5rem",
  "--react-international-phone-border-radius": "var(--radius, 0.5rem)",
  "--react-international-phone-border-color": "hsl(var(--input))",
  "--react-international-phone-background-color": "hsl(var(--background))",
  "--react-international-phone-country-selector-background-color":
    "hsl(var(--background))",
  "--react-international-phone-country-selector-border-color":
    "hsl(var(--input))",
  "--react-international-phone-text-color": "hsl(var(--foreground))",
  "--react-international-phone-font-size": "0.875rem",
  "--react-international-phone-dropdown-shadow":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
} as React.CSSProperties;

/**
 * Зазор между селектором страны и полем номера.
 * `className` у PhoneInput вешается на тот же div, что и `react-international-phone-input-container`
 * (это flex-ряд), поэтому `gap` задаём здесь, а не через вложенный селектор.
 */
const phoneInputRootClassName = cn(
  "w-full gap-3",
  "[&_.react-international-phone-country-selector-button]:!mr-0",
);

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

  const parsedPhone = phone ? parsePhoneNumberFromString(phone) : undefined;
  const phoneValid = Boolean(parsedPhone?.isValid());
  const normalizedPhone =
    parsedPhone?.isValid() === true ? parsedPhone.format("E.164") : "";

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
          <PhoneInput
            className={phoneInputRootClassName}
            style={phoneInputContainerStyle}
            defaultCountry="ge"
            preferredCountries={["ge", "tr", "ru", "il", "ua", "us"]}
            value={phone}
            onChange={(next) => setPhone(next)}
            inputClassName={phoneFieldInputClassName}
            countrySelectorStyleProps={{
              buttonClassName:
                "w-[52px] min-w-[52px] shrink-0 !rounded-md border-input bg-background hover:bg-accent/50",
            }}
            inputProps={{
              id: "reservation-phone",
              type: "tel",
              required: true,
              "aria-describedby": "reservation-phone-hint",
              name: "reservation-phone",
            }}
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
