export interface InstallmentProjectConfig {
  installment_enabled?: boolean;
  min_down_payment_percent?: number;
  max_installment_months?: number;
}

/**
 * Provides helpers to calculate zero-interest installment monthly payment
 * using project configuration.
 */
export function useInstallment(project?: InstallmentProjectConfig) {
  /**
   * Calculates the monthly payment in the project's base currency.
   * Consumers should convert/format to target currency as needed.
   */
  const calculateMonthlyPayment = (price: number): number => {
    if (!project?.installment_enabled || !project.max_installment_months) return 0;

    const minDownPaymentPercent = project.min_down_payment_percent ?? 20;
    const maxAllowedDownPaymentPercent = 50;
    const targetDownPaymentPercent = 50;

    const effectiveDownPaymentPercent = Math.min(
      Math.max(targetDownPaymentPercent, minDownPaymentPercent),
      maxAllowedDownPaymentPercent
    );

    const downPayment = (price * effectiveDownPaymentPercent) / 100;
    const remaining = price - downPayment;
    const months = project.max_installment_months;

    return months > 0 ? remaining / months : 0;
  };

  return { calculateMonthlyPayment };
}

export default useInstallment;


