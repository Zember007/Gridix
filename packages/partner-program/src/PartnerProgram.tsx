import { useEffect, useRef, useState } from 'react';
import { usePartner } from './queries/usePartner';
import { Button, useToast } from '@gridix/ui';
import { Wallet } from 'lucide-react';
import { useLanguage } from '@gridix/utils/react';
import { PartnerAccountSection } from './ui/PartnerAccountSection';
import { PartnerInstructionsSection } from './ui/PartnerInstructionsSection';
import { PartnerOverviewSection } from './ui/PartnerOverviewSection';
import { PartnerReferralsSection } from './ui/PartnerReferralsSection';
import { PartnerClientsSection } from './ui/PartnerClientsSection';
import { Spinner } from './ui/Spinner';

export type PartnerSection = 'account' | 'overview' | 'referrals' | 'clients' | 'instructions';

export interface PartnerProgramProps {
  /**
   * `tabs` — renders inline tab buttons (for embedding inside pages, e.g. apps/main).
   * `sidebar` — hides tab buttons; section is controlled externally (e.g. via SimplifiedSidebar).
   */
  navigationMode: 'tabs' | 'sidebar';
  /** Active section (used when navigationMode is 'sidebar'). */
  activeSection?: PartnerSection;
  /** Callback to change section (used when navigationMode is 'sidebar'). */
  onSectionChange?: (section: PartnerSection) => void;
  /** If true, automatically create partner profile when user is not a partner (used in apps/partners). */
  autoCreateProfile?: boolean;
}

export const PartnerProgram: React.FC<PartnerProgramProps> = ({
  navigationMode,
  activeSection: externalSection,
  onSectionChange: externalOnSectionChange,
  autoCreateProfile = false,
}) => {
  const { isPartner, loading, createPartnerProfile } = usePartner();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);

  // Internal state for tabs mode; external state for sidebar mode
  const [internalTab, setInternalTab] = useState<PartnerSection>('overview');

  const activeTab = navigationMode === 'sidebar'
    ? (externalSection ?? 'overview')
    : internalTab;

  const setActiveTab = navigationMode === 'sidebar'
    ? (externalOnSectionChange ?? setInternalTab)
    : setInternalTab;

  const handleCreatePartner = async () => {
    try {
      setIsCreating(true);
      await createPartnerProfile();
      toast({
        title: t('partners.profileCreated'),
        description: t('partners.profileCreatedDesc'),
      });
    } catch {
      toast({
        title: t('partners.error'),
        description: t('partners.profileCreationFailed'),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-create partner profile for dedicated partners app
  const autoCreatedRef = useRef(false);
  useEffect(() => {
    if (autoCreateProfile && !loading && !isPartner && !isCreating && !autoCreatedRef.current) {
      autoCreatedRef.current = true;
      void handleCreatePartner();
    }
  }, [autoCreateProfile, loading, isPartner, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('partners.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('partners.subtitle')}
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t('partners.becomePartner')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {t('partners.joinProgram')}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">1</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t('partners.referralProgram')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('partners.referralProgramDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">2</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t('partners.fullSupport')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('partners.fullSupportDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">3</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t('partners.automaticPayouts')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('partners.automaticPayoutsDesc')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleCreatePartner}
                    disabled={isCreating}
                    className="w-full partners_become_usertour"
                  >
                    {isCreating
                      ? t('partners.creating')
                      : t('partners.becomePartner')}
                  </Button>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 items-start">
        <div className="flex items-center gap-6">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight truncate">
              {t('partners.title')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium truncate">
              {t('partners.subtitle')}
            </p>
          </div>

          {navigationMode === 'tabs' && (
            <div className="hidden xl:flex items-center border-l border-slate-200 pl-6">
              <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                <TabButton
                  label={t('partners.overview')}
                  isActive={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  className="partners_overview_tab_usertour"
                />
                <TabButton
                  label={t('partners.referrals')}
                  isActive={activeTab === 'referrals'}
                  onClick={() => setActiveTab('referrals')}
                  className="partners_referrals_tab_usertour"
                />
                <TabButton
                  label={t('partners.clients')}
                  isActive={activeTab === 'clients'}
                  onClick={() => setActiveTab('clients')}
                  className="partners_clients_tab_usertour"
                />
                <TabButton
                  label={t('partners.instructions')}
                  isActive={activeTab === 'instructions'}
                  onClick={() => setActiveTab('instructions')}
                  className="partners_instructions_tab_usertour"
                />
              </div>
            </div>
          )}
        </div>

        {navigationMode === 'tabs' && (
          <button
            onClick={() => setActiveTab('account')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
              activeTab === 'account'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } partners_account_tab_usertour`}
          >
            <span
              className={`p-1 rounded-full ${
                activeTab === 'account'
                  ? 'bg-slate-700 text-white'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              <Wallet size={14} />
            </span>
            <span>{t('partners.account')}</span>
          </button>
        )}
      </div>

      {/* Mobile tabs (only in tabs mode) */}
      {navigationMode === 'tabs' && (
        <div className="xl:hidden">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex overflow-x-auto">
            <TabButton
              label={t('partners.overview')}
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className="partners_overview_tab_usertour"
            />
            <TabButton
              label={t('partners.referrals')}
              isActive={activeTab === 'referrals'}
              onClick={() => setActiveTab('referrals')}
              className="partners_referrals_tab_usertour"
            />
            <TabButton
              label={t('partners.clients')}
              isActive={activeTab === 'clients'}
              onClick={() => setActiveTab('clients')}
              className="partners_clients_tab_usertour"
            />
            <TabButton
              label={t('partners.instructions')}
              isActive={activeTab === 'instructions'}
              onClick={() => setActiveTab('instructions')}
              className="partners_instructions_tab_usertour"
            />
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className={navigationMode === 'tabs' ? 'mt-4' : ''}>
        {activeTab === 'account' && <PartnerAccountSection />}
        {activeTab === 'overview' && (
          <PartnerOverviewSection onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'referrals' && <PartnerReferralsSection />}
        {activeTab === 'clients' && <PartnerClientsSection />}
        {activeTab === 'instructions' && <PartnerInstructionsSection />}
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
      className={`flex-none py-1.5 px-4 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
        isActive
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
      } ${className || ''}`}
    >
      {label}
    </button>
  );
};
