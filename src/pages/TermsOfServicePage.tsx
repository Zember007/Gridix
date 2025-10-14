import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, AlertTriangle, CreditCard, Gavel, Mail, MapPin, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';

const TermsOfServicePage = () => {
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();

  const currentDate = new Date().toLocaleDateString(t('legal.locale') || 'en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <HeroHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('terms.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('terms.lastUpdated')} {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                  {t('terms.general.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('terms.general.text1')}</p>
                <p className="mb-4">{t('terms.general.text2')}</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>{t('terms.general.important')}</strong> {t('terms.general.importantText')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  {t('terms.companyInfo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('terms.companyInfo.name')}</strong> {t('terms.companyInfo.nameValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('terms.companyInfo.address')}</strong> {t('terms.companyInfo.addressValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('terms.companyInfo.email')}</strong> {t('terms.companyInfo.emailValue')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.serviceDescription.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('terms.serviceDescription.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('terms.serviceDescription.item1')}</li>
                  <li>{t('terms.serviceDescription.item2')}</li>
                  <li>{t('terms.serviceDescription.item3')}</li>
                  <li>{t('terms.serviceDescription.item4')}</li>
                  <li>{t('terms.serviceDescription.item5')}</li>
                  <li>{t('terms.serviceDescription.item6')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Users className="h-6 w-6 text-blue-600" />
                  {t('terms.userAccounts.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.userAccounts.registration.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.userAccounts.registration.item1')}</li>
                      <li>{t('terms.userAccounts.registration.item2')}</li>
                      <li>{t('terms.userAccounts.registration.item3')}</li>
                      <li>{t('terms.userAccounts.registration.item4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.userAccounts.requirements.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.userAccounts.requirements.item1')}</li>
                      <li>{t('terms.userAccounts.requirements.item2')}</li>
                      <li>{t('terms.userAccounts.requirements.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Obligations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.userObligations.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('terms.userObligations.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('terms.userObligations.item1')}</li>
                  <li>{t('terms.userObligations.item2')}</li>
                  <li>{t('terms.userObligations.item3')}</li>
                  <li>{t('terms.userObligations.item4')}</li>
                  <li>{t('terms.userObligations.item5')}</li>
                  <li>{t('terms.userObligations.item6')}</li>
                  <li>{t('terms.userObligations.item7')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Prohibited Uses */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  {t('terms.prohibitedUses.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <p className="text-red-800 font-semibold mb-2">{t('terms.prohibitedUses.warning')}</p>
                </div>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('terms.prohibitedUses.item1')}</li>
                  <li>{t('terms.prohibitedUses.item2')}</li>
                  <li>{t('terms.prohibitedUses.item3')}</li>
                  <li>{t('terms.prohibitedUses.item4')}</li>
                  <li>{t('terms.prohibitedUses.item5')}</li>
                  <li>{t('terms.prohibitedUses.item6')}</li>
                  <li>{t('terms.prohibitedUses.item7')}</li>
                  <li>{t('terms.prohibitedUses.item8')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.intellectualProperty.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.intellectualProperty.companyRights.title')}</h4>
                    <p className="mb-2">{t('terms.intellectualProperty.companyRights.text')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.intellectualProperty.userRights.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.intellectualProperty.userRights.item1')}</li>
                      <li>{t('terms.intellectualProperty.userRights.item2')}</li>
                      <li>{t('terms.intellectualProperty.userRights.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  {t('terms.paymentTerms.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.paymentTerms.pricing.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.paymentTerms.pricing.item1')}</li>
                      <li>{t('terms.paymentTerms.pricing.item2')}</li>
                      <li>{t('terms.paymentTerms.pricing.item3')}</li>
                      <li>{t('terms.paymentTerms.pricing.item4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.paymentTerms.refunds.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.paymentTerms.refunds.item1')}</li>
                      <li>{t('terms.paymentTerms.refunds.item2')}</li>
                      <li>{t('terms.paymentTerms.refunds.item3')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.paymentTerms.suspension.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.paymentTerms.suspension.item1')}</li>
                      <li>{t('terms.paymentTerms.suspension.item2')}</li>
                      <li>{t('terms.paymentTerms.suspension.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liability */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Gavel className="h-6 w-6 text-blue-600" />
                  {t('terms.liability.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.liability.limitation.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.liability.limitation.item1')}</li>
                      <li>{t('terms.liability.limitation.item2')}</li>
                      <li>{t('terms.liability.limitation.item3')}</li>
                      <li>{t('terms.liability.limitation.item4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.liability.userLiability.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.liability.userLiability.item1')}</li>
                      <li>{t('terms.liability.userLiability.item2')}</li>
                      <li>{t('terms.liability.userLiability.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data and Privacy */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.dataProcessing.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  {t('terms.dataProcessing.text')}
                  <button 
                    onClick={() => navigate('/privacy-policy')} 
                    className="text-blue-600 hover:underline mx-1"
                  >
                    {t('terms.dataProcessing.linkText')}
                  </button>.
                </p>
                <p className="mb-4">{t('terms.dataProcessing.principles')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('terms.dataProcessing.item1')}</li>
                  <li>{t('terms.dataProcessing.item2')}</li>
                  <li>{t('terms.dataProcessing.item3')}</li>
                  <li>{t('terms.dataProcessing.item4')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.termination.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.termination.byUser.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.termination.byUser.item1')}</li>
                      <li>{t('terms.termination.byUser.item2')}</li>
                      <li>{t('terms.termination.byUser.item3')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.termination.byCompany.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.termination.byCompany.item1')}</li>
                      <li>{t('terms.termination.byCompany.item2')}</li>
                      <li>{t('terms.termination.byCompany.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.changes.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('terms.changes.text')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('terms.changes.item1')}</li>
                  <li>{t('terms.changes.item2')}</li>
                  <li>{t('terms.changes.item3')}</li>
                </ul>
                <p className="mt-4">{t('terms.changes.continuation')}</p>
              </CardContent>
            </Card>

            {/* Applicable Law */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('terms.applicableLaw.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.applicableLaw.law.title')}</h4>
                    <p>{t('terms.applicableLaw.law.text')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('terms.applicableLaw.disputes.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('terms.applicableLaw.disputes.item1')}</li>
                      <li>{t('terms.applicableLaw.disputes.item2')}</li>
                      <li>{t('terms.applicableLaw.disputes.item3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  {t('terms.contact.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <p className="mb-4">{t('terms.contact.text')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>{t('terms.contact.email')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{t('terms.contact.address')}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>{t('terms.contact.responseTime')}</strong> {t('terms.contact.responseTimeText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
