import { useEffect, useRef, useState } from "react";
import { usePartner } from "./queries/usePartner";
import { Button, useToast } from "@gridix/ui";
import { Wallet } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { PartnerAccountSection } from "./ui/PartnerAccountSection";
import { PartnerInstructionsSection } from "./ui/PartnerInstructionsSection";
import { PartnerOverviewSection } from "./ui/PartnerOverviewSection";
import { PartnerReferralsSection } from "./ui/PartnerReferralsSection";
import { PartnerClientsSection } from "./ui/PartnerClientsSection";
import { Spinner } from "./ui/Spinner";

const PARTNER_OFFER_URL =
  "https://docs.google.com/document/d/1pJEnwxZWOUdwJbd1oihc5MzlOxuZ_Sbx/edit?usp=sharing&ouid=102001712373516470082&rtpof=true&sd=true";

export type PartnerSection =
  | "account"
  | "overview"
  | "referrals"
  | "clients"
  | "instructions";

export interface PartnerProgramProps {
  /**
   * `tabs` — renders inline tab buttons (for embedding inside pages, e.g. apps/main).
   * `sidebar` — hides tab buttons; section is controlled externally (e.g. via SimplifiedSidebar).
   */
  navigationMode: "tabs" | "sidebar";
  /** Active section (used when navigationMode is 'sidebar'). */
  activeSection?: PartnerSection;
  /** Callback to change section (used when navigationMode is 'sidebar'). */
  onSectionChange?: (section: PartnerSection) => void;
  /** If true, automatically create partner profile when user is not a partner (used in apps/partners). */
  autoCreateProfile?: boolean;
  /** Базовый URL для ресурсов инструкций (видео, PDF). Ресурсы лежат в main app public/instructions. Для partners app передайте URL main app (например VITE_MAIN_APP_URL). */
  instructionsBaseUrl?: string;
}

export const PartnerProgram: React.FC<PartnerProgramProps> = ({
  navigationMode,
  activeSection: externalSection,
  onSectionChange: externalOnSectionChange,
  autoCreateProfile = false,
  instructionsBaseUrl,
}) => {
  const { isPartner, loading, createPartnerProfile } = usePartner();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const offerConsentText = t("partners.offerConsentText");
  const offerLinkText = t("partners.offerLinkText");
  const hasOfferPlaceholder = offerConsentText.includes("{offerLink}");
  const [offerTextBeforeLink, ...offerTextAfterLinkParts] =
    offerConsentText.split("{offerLink}");

  // Internal state for tabs mode; external state for sidebar mode
  const [internalTab, setInternalTab] = useState<PartnerSection>("overview");

  const activeTab =
    navigationMode === "sidebar"
      ? (externalSection ?? "overview")
      : internalTab;

  const setActiveTab =
    navigationMode === "sidebar"
      ? (externalOnSectionChange ?? setInternalTab)
      : setInternalTab;

  const handleCreatePartner = async () => {
    try {
      setIsCreating(true);
      await createPartnerProfile();
      toast({
        title: t("partners.profileCreated"),
        description: t("partners.profileCreatedDesc"),
      });
    } catch {
      toast({
        title: t("partners.error"),
        description: t("partners.profileCreationFailed"),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-create partner profile for dedicated partners app
  const autoCreatedRef = useRef(false);
  useEffect(() => {
    if (
      autoCreateProfile &&
      !loading &&
      !isPartner &&
      !isCreating &&
      !autoCreatedRef.current
    ) {
      autoCreatedRef.current = true;
      void handleCreatePartner();
    }
  }, [autoCreateProfile, loading, isPartner, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isPartner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t("partners.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("partners.subtitle")}
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">
                    {t("partners.becomePartner")}
                  </h3>
                  <p className="mb-6 text-sm text-gray-600">
                    {t("partners.joinProgram")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <span className="text-sm font-medium text-green-600">
                          1
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t("partners.referralProgram")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t("partners.referralProgramDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <span className="text-sm font-medium text-green-600">
                          2
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t("partners.fullSupport")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t("partners.fullSupportDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <span className="text-sm font-medium text-green-600">
                          3
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t("partners.automaticPayouts")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t("partners.automaticPayoutsDesc")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleCreatePartner}
                    disabled={isCreating}
                    className="partners_become_usertour w-full"
                  >
                    {isCreating
                      ? t("partners.creating")
                      : t("partners.becomePartner")}
                  </Button>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    {hasOfferPlaceholder ? (
                      <>
                        {offerTextBeforeLink}
                        <a
                          href={PARTNER_OFFER_URL}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline hover:text-gray-700"
                        >
                          {offerLinkText}
                        </a>
                        {offerTextAfterLinkParts.join("{offerLink}")}
                      </>
                    ) : (
                      <>
                        {offerConsentText}{" "}
                        <a
                          href={PARTNER_OFFER_URL}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline hover:text-gray-700"
                        >
                          {offerLinkText}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + tabs (only in tabs mode) */}
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-bold text-slate-900 md:text-xl">
              {t("partners.title")}
            </h1>
            <p className="text-xs font-medium text-slate-500 md:text-sm">
              {t("partners.subtitle")}
            </p>
          </div>

          {navigationMode === "tabs" && (
            <div className="hidden items-center border-l border-slate-200 pl-6 xl:flex">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-sm">
                <TabButton
                  label={t("partners.overview")}
                  isActive={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  className="partners_overview_tab_usertour"
                />
                <TabButton
                  label={t("partners.referrals")}
                  isActive={activeTab === "referrals"}
                  onClick={() => setActiveTab("referrals")}
                  className="partners_referrals_tab_usertour"
                />
                <TabButton
                  label={t("partners.clients")}
                  isActive={activeTab === "clients"}
                  onClick={() => setActiveTab("clients")}
                  className="partners_clients_tab_usertour"
                />
                <TabButton
                  label={t("partners.instructions")}
                  isActive={activeTab === "instructions"}
                  onClick={() => setActiveTab("instructions")}
                  className="partners_instructions_tab_usertour"
                />
              </div>
            </div>
          )}
        </div>

        {navigationMode === "tabs" && (
          <button
            onClick={() => setActiveTab("account")}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
              activeTab === "account"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            } partners_account_tab_usertour`}
          >
            <span
              className={`rounded-full p-1 ${
                activeTab === "account"
                  ? "bg-slate-700 text-white"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Wallet size={14} />
            </span>
            <span>{t("partners.account")}</span>
          </button>
        )}
      </div>

      {/* Mobile tabs (only in tabs mode) */}
      {navigationMode === "tabs" && (
        <div className="xl:hidden">
          <div className="flex overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1">
            <TabButton
              label={t("partners.overview")}
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              className="partners_overview_tab_usertour"
            />
            <TabButton
              label={t("partners.referrals")}
              isActive={activeTab === "referrals"}
              onClick={() => setActiveTab("referrals")}
              className="partners_referrals_tab_usertour"
            />
            <TabButton
              label={t("partners.clients")}
              isActive={activeTab === "clients"}
              onClick={() => setActiveTab("clients")}
              className="partners_clients_tab_usertour"
            />
            <TabButton
              label={t("partners.instructions")}
              isActive={activeTab === "instructions"}
              onClick={() => setActiveTab("instructions")}
              className="partners_instructions_tab_usertour"
            />
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className={navigationMode === "tabs" ? "mt-4" : ""}>
        {activeTab === "account" && (
          <div className="space-y-6">
            <PartnerAccountSection />
          </div>
        )}
        {activeTab === "overview" && (
          <PartnerOverviewSection onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "referrals" && <PartnerReferralsSection />}
        {activeTab === "clients" && <PartnerClientsSection />}
        {activeTab === "instructions" && (
          <PartnerInstructionsSection
            instructionsBaseUrl={instructionsBaseUrl || ""}
          />
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}> = ({ label, isActive, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-none rounded-md px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-all sm:px-5 ${
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
      } ${className || ""}`}
    >
      {label}
    </button>
  );
};
