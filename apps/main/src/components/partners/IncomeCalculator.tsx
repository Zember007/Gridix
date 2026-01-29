


import { useState } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@gridix/ui";

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
  const integratorIncome = projectCount < 10 ? projectCount * ANNUAL_PRICE * 0.4 : 0;
  const ambassadorIncome = projectCount >= 10 ? projectCount * ANNUAL_PRICE * 0.5 : 0;

  // Determine current income
  const currentIncome = projectCount >= 10 ? ambassadorIncome : integratorIncome;

  // Get plural forms for projects
  const getProjectPlural = (count: number) => {
    if (count === 1) return t('partners.calculator.projectSingular');
    if (count < 5) return t('partners.calculator.projectPluralFew');
    return t('partners.calculator.projectPluralMany');
  };


  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[95vw] max-w-4xl p-4 sm:p-6 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('partners.calculator.title')}</DialogTitle>
          <DialogDescription>
            {t('partners.calculator.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('partners.calculator.badge')}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="rounded-xl border border-border bg-background p-6 flex flex-col justify-center">
              <label className="block mb-6">
                <span className="text-sm font-semibold text-foreground mb-3 block">
                  {t('partners.calculator.projectsLabel')}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={projectCount}
                    onChange={(e) => setProjectCount(parseInt(e.target.value))}
                    className="w-full sm:flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-2xl font-bold text-primary sm:w-12 text-left sm:text-right">
                    {projectCount}
                  </span>
                </div>
              </label>

              <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-foreground/60 mb-2">{t('partners.calculator.statusLabel')}</p>
                <p className="text-xl font-bold text-foreground">
                  {projectCount < 5 ? (
                    t('partners.calculator.tierBasic')
                  ) : projectCount < 10 && projectCount >= 5 ? (
                    t('partners.calculator.tierIntegrator')
                  ) : (
                    t('partners.calculator.tierAmbassador')
                  )}
                </p>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-foreground/60 mb-2">{t('partners.calculator.commissionLabel')}</p>
                <p className="text-2xl font-bold text-primary">
                  {projectCount < 5 ? "20%" : projectCount < 10 && projectCount >= 5 ? "40%" : "50%"}
                </p>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex flex-col gap-4">
              {/* Current Tier Income */}
              <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <p className="text-sm font-semibold text-primary mb-2">{t('partners.calculator.yearlyIncome')}</p>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  ${currentIncome.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-foreground/60">
                  {t('partners.calculator.fromProjects', { count: projectCount, projects: getProjectPlural(projectCount) })}
                </p>
              </div>

              {/* Tier Comparison */}
              <div className="space-y-3">
                {/* Basic */}
                <div className={`rounded-lg border-2 p-4 transition-all ${projectCount < 5
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{t('partners.calculator.tierBasic')}</p>
                        {projectCount < 5 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                            {t('partners.calculator.youAreHere')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">
                        {projectCount} {getProjectPlural(projectCount)} • {t('partners.calculator.commission20')}
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${projectCount < 5 ? "text-primary" : "text-foreground/60"}`}>
                      ${basicIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                {/* Integrator */}
                <div className={`rounded-lg border-2 p-4 transition-all ${projectCount < 10 && projectCount >= 5
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{t('partners.calculator.tierIntegrator')}</p>
                        {projectCount < 10 && projectCount >= 5 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                            {t('partners.calculator.youAreHere')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">{t('partners.calculator.integratorDesc')}</p>
                    </div>
                    <p className={`text-lg font-bold ${projectCount < 10 && projectCount >= 5 ? "text-primary" : "text-foreground/60"}`}>
                      ${integratorIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                {/* Ambassador */}
                <div className={`rounded-lg border-2 p-4 transition-all ${projectCount >= 10
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{t('partners.calculator.tierAmbassador')}</p>
                        {projectCount >= 10 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                            {t('partners.calculator.youAreHere')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">{t('partners.calculator.ambassadorDesc')}</p>
                    </div>
                    <p className={`text-lg font-bold ${projectCount >= 10 ? "text-primary" : "text-foreground/60"}`}>
                      ${ambassadorIncome.toLocaleString("en-US", {
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
          <div className="mt-6 p-4 rounded-xl border border-border bg-secondary/30">
            <p className="text-sm text-foreground/60 text-center">
              {t('partners.calculator.infoNote', { price: ANNUAL_PRICE })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


