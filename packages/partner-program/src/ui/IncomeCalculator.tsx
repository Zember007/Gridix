import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
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
  const { t } = useLanguage();

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
            <div className="bg-primary/10 border-primary/20 mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <TrendingUp className="text-primary h-4 w-4" />
              <span className="text-primary text-sm font-medium">
                {t("partners.calculator.badge")}
              </span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Input Section */}
            <div className="border-border bg-background flex flex-col justify-center rounded-xl border p-6">
              <label className="mb-6 block">
                <span className="text-foreground mb-3 block text-sm font-semibold">
                  {t("partners.calculator.projectsLabel")}
                </span>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={projectCount}
                    onChange={(e) => setProjectCount(parseInt(e.target.value))}
                    className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg sm:flex-1"
                  />
                  <span className="text-primary text-left text-2xl font-bold sm:w-12 sm:text-right">
                    {projectCount}
                  </span>
                </div>
              </label>

              <div className="bg-secondary/50 border-border mt-4 rounded-lg border p-4">
                <p className="text-foreground/60 mb-2 text-sm">
                  {t("partners.calculator.statusLabel")}
                </p>
                <p className="text-foreground text-xl font-bold">
                  {projectCount < 5
                    ? t("partners.calculator.tierBasic")
                    : projectCount < 10 && projectCount >= 5
                      ? t("partners.calculator.tierIntegrator")
                      : t("partners.calculator.tierAmbassador")}
                </p>
              </div>

              <div className="bg-primary/10 border-primary/30 mt-4 rounded-lg border p-4">
                <p className="text-foreground/60 mb-2 text-sm">
                  {t("partners.calculator.commissionLabel")}
                </p>
                <p className="text-primary text-2xl font-bold">
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
              <div className="border-primary from-primary/5 to-primary/10 rounded-xl border-2 bg-gradient-to-br p-6">
                <p className="text-primary mb-2 text-sm font-semibold">
                  {t("partners.calculator.yearlyIncome")}
                </p>
                <p className="text-foreground mb-1 text-3xl font-bold md:text-4xl">
                  $
                  {currentIncome.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-foreground/60 text-sm">
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
                        <p className="text-foreground text-sm font-semibold">
                          {t("partners.calculator.tierBasic")}
                        </p>
                        {projectCount < 5 && (
                          <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/60 text-xs">
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
                        <p className="text-foreground text-sm font-semibold">
                          {t("partners.calculator.tierIntegrator")}
                        </p>
                        {projectCount < 10 && projectCount >= 5 && (
                          <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/60 text-xs">
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
                        <p className="text-foreground text-sm font-semibold">
                          {t("partners.calculator.tierAmbassador")}
                        </p>
                        {projectCount >= 10 && (
                          <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                            {t("partners.calculator.youAreHere")}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/60 text-xs">
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
          <div className="border-border bg-secondary/30 mt-6 rounded-xl border p-4">
            <p className="text-foreground/60 text-center text-sm">
              {t("partners.calculator.infoNote", { price: ANNUAL_PRICE })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
