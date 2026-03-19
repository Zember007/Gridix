import {
  BillingDetails,
  BillingPayerType,
  ProjectSubscription,
  SubscriptionPlan,
} from "@/entities/subscription/queries/useSubscription";

export type CheckoutStep = "select_projects" | "payer_info" | "payment_method";
export type CheckoutPaymentMethod = "invoice" | "card";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectSubscription[];
  initialSelectedProjectIds: string[];
  plans: SubscriptionPlan[];
  selectedPlanId: string;
  selectedDuration: number;
  billingDetails: BillingDetails | null;
  onPlanChange: (planId: string) => void;
  onDurationChange: (duration: number) => void;
  onConfirm: (
    payer: BillingDetails,
    projectIds: string[],
    method: CheckoutPaymentMethod,
  ) => Promise<void>;
}

export type BillingErrors = Partial<Record<keyof BillingDetails, string>>;
