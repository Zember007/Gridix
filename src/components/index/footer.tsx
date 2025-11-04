import { Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './logo';

const Footer = () => {
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const goToAdmin = () => {
    navigate('/admin');
  };

  const goToPrivacyPolicy = () => {
    navigate('/privacy-policy');
  };

  const goToTermsOfService = () => {
    navigate('/terms-of-service');
  };

  const goToRefundPolicy = () => {
    navigate('/refund-policy');
  };

  const goToPricing = () => {
    navigate('/pricing');
  };

  const goToContacts = () => {
    navigate('/contacts');
  };

  const goToPartnerProgram = () => {
    navigate('/partner-program');
  };

  return (
    <footer className={`bg-black ${isMobile ? 'py-12' : 'py-16'}`}>
      <div className="container mx-auto">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-4 gap-8'} mb-8`}>
          {/* Company Info */}
          <div className="col-span-2">
            <Logo 
              invert={true}
            />
            <p className="text-gray-400 mb-4 max-w-md">
              {t('landing.companyDescription')}
            </p>
            <div className="text-sm text-gray-400">
              <p><strong>{t('landing.company')}:</strong> Gridix</p>
              <p><strong>{t('landing.address')}:</strong> {t('privacy.companyInfo.addressValue')}</p>
              <p><strong>{t('landing.email')}:</strong> inbox@gridix.live</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{t('landing.quickLinks')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={goToAdmin} className="hover:text-blue-400 transition-colors">{t('landing.adminPanel')}</button></li>
              <li><button onClick={goToPricing} className="hover:text-blue-400 transition-colors">{t('landing.pricing')}</button></li>
              <li><button onClick={goToPartnerProgram} className="hover:text-blue-400 transition-colors">{t('nav.partnerProgram')}</button></li>
              <li><button onClick={goToContacts} className="hover:text-blue-400 transition-colors">{t('landing.contacts')}</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{t('landing.legalInfo')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={goToPrivacyPolicy} className="hover:text-blue-400 transition-colors">{t('landing.privacyPolicy')}</button></li>
              <li><button onClick={goToTermsOfService} className="hover:text-blue-400 transition-colors">{t('landing.termsOfService')}</button></li>
              <li><button onClick={goToRefundPolicy} className="hover:text-blue-400 transition-colors">{t('landing.refundPolicy')}</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className={`flex ${isMobile ? 'flex-col gap-4 text-center' : 'justify-between items-center'}`}>
            <p className="text-gray-400">
              {t('landing.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

