import { useState } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerIncomeCalculator: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  const [projectCount, setProjectCount] = useState(5);
  const { t, language: locale } = useLanguage();

  // Average annual subscription price
  const ANNUAL_PRICE = 1815;

  // Calculate income for all tiers
  const basicIncome = projectCount * ANNUAL_PRICE * 0.2;
  const integratorIncome =
    projectCount < 10 ? projectCount * ANNUAL_PRICE * 0.4 : 0;
  const ambassadorIncome =
    projectCount >= 10 ? projectCount * ANNUAL_PRICE * 0.5 : 0;

  // Determine current income
  const currentIncome =
    projectCount >= 10 ? ambassadorIncome : integratorIncome;

  // Get plural forms for projects
  const getProjectPlural = (count: number) => {
    if (count === 1) return t("partners.calculator.projectSingular");
    if (count < 5) return t("partners.calculator.projectPluralFew");
    return t("partners.calculator.projectPluralMany");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:max-h-[85vh] sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("partners.calculator.title")}</DialogTitle>
          <DialogDescription>
            {t("partners.calculator.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t("partners.calculator.badge")}
              </span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Input Section */}
            <div className="flex flex-col justify-center rounded-xl border border-border bg-background p-6">
              <label className="mb-6 block">
                <span className="mb-3 block text-sm font-semibold text-foreground">
                  {t("partners.calculator.projectsLabel")}
                </span>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={projectCount}
                    onChange={(e) => setProjectCount(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary sm:flex-1"
                  />
                  <span className="text-left text-2xl font-bold text-primary sm:w-12 sm:text-right">
                    {projectCount}
                  </span>
                </div>
              </label>

              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
                <p className="mb-2 text-sm text-foreground/60">
                  {t("partners.calculator.statusLabel")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {projectCount < 5
                    ? t("partners.calculator.tierBasic")
                    : projectCount < 10 && projectCount >= 5
                      ? t("partners.calculator.tierIntegrator")
                      : t("partners.calculator.tierAmbassador")}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
                <p className="mb-2 text-sm text-foreground/60">
                  {t("partners.calculator.commissionLabel")}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {projectCount < 5
                    ? "20%"
                    : projectCount < 10 && projectCount >= 5
                      ? "40%"
                      : "50%"}
                </p>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex flex-col gap-4">
              {/* Current Tier Income */}
              <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <p className="mb-2 text-sm font-semibold text-primary">
                  {t("partners.calculator.yearlyIncome")}
                </p>
                <p className="mb-1 text-3xl font-bold text-foreground md:text-4xl">
                  $
                  {currentIncome.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-foreground/60">
                  {t("partners.calculator.fromProjects", {
                    count: projectCount,
                    projects: getProjectPlural(projectCount),
                  })}
                </p>
              </div>

              {/* Tier Comparison */}
              <div className="space-y-3">
                {/* Basic */}
                <div
                  className={`rounded-lg border-2 p-4 transition-all ${
                    projectCount < 5
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {t("partners.calculator.tierBasic")}
                        </p>
                        {projectCount < 5 && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">
                        {projectCount} {getProjectPlural(projectCount)} •{" "}
                        {t("partners.calculator.commission20")}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${projectCount < 5 ? "text-primary" : "text-foreground/60"}`}
                    >
                      $
                      {basicIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                {/* Integrator */}
                <div
                  className={`rounded-lg border-2 p-4 transition-all ${
                    projectCount < 10 && projectCount >= 5
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {t("partners.calculator.tierIntegrator")}
                        </p>
                        {projectCount < 10 && projectCount >= 5 && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">
                        {t("partners.calculator.integratorDesc")}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${projectCount < 10 && projectCount >= 5 ? "text-primary" : "text-foreground/60"}`}
                    >
                      $
                      {integratorIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                {/* Ambassador */}
                <div
                  className={`rounded-lg border-2 p-4 transition-all ${
                    projectCount >= 10
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {t("partners.calculator.tierAmbassador")}
                        </p>
                        {projectCount >= 10 && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">
                        {t("partners.calculator.ambassadorDesc")}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${projectCount >= 10 ? "text-primary" : "text-foreground/60"}`}
                    >
                      $
                      {ambassadorIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-center text-sm text-foreground/60">
              {t("partners.calculator.infoNote", { price: ANNUAL_PRICE })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
