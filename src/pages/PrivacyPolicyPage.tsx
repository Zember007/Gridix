import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Database, Mail, MapPin, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';

const PrivacyPolicyPage = () => {
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
      <main className="container mx-auto py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('privacy.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('privacy.lastUpdated')} {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                  {t('privacy.introduction.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.introduction.text1')}</p>
                <p>{t('privacy.introduction.text2')}</p>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  {t('privacy.companyInfo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('privacy.companyInfo.name')}</strong> {t('privacy.companyInfo.nameValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('privacy.companyInfo.address')}</strong> {t('privacy.companyInfo.addressValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('privacy.companyInfo.email')}</strong> {t('privacy.companyInfo.emailValue')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Database className="h-6 w-6 text-blue-600" />
                  {t('privacy.dataCollection.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('privacy.dataCollection.personal.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('privacy.dataCollection.personal.item1')}</li>
                      <li>{t('privacy.dataCollection.personal.item2')}</li>
                      <li>{t('privacy.dataCollection.personal.item3')}</li>
                      <li>{t('privacy.dataCollection.personal.item4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('privacy.dataCollection.technical.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('privacy.dataCollection.technical.item1')}</li>
                      <li>{t('privacy.dataCollection.technical.item2')}</li>
                      <li>{t('privacy.dataCollection.technical.item3')}</li>
                      <li>{t('privacy.dataCollection.technical.item4')}</li>
                      <li>{t('privacy.dataCollection.technical.item5')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('privacy.dataCollection.content.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('privacy.dataCollection.content.item1')}</li>
                      <li>{t('privacy.dataCollection.content.item2')}</li>
                      <li>{t('privacy.dataCollection.content.item3')}</li>
                      <li>{t('privacy.dataCollection.content.item4')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                  {t('privacy.dataUsage.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.dataUsage.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataUsage.item1')}</li>
                  <li>{t('privacy.dataUsage.item2')}</li>
                  <li>{t('privacy.dataUsage.item3')}</li>
                  <li>{t('privacy.dataUsage.item4')}</li>
                  <li>{t('privacy.dataUsage.item5')}</li>
                  <li>{t('privacy.dataUsage.item6')}</li>
                  <li>{t('privacy.dataUsage.item7')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('privacy.dataSharing.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.dataSharing.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataSharing.item1')}</li>
                  <li>{t('privacy.dataSharing.item2')}</li>
                  <li>{t('privacy.dataSharing.item3')}</li>
                  <li>{t('privacy.dataSharing.item4')}</li>
                  <li>{t('privacy.dataSharing.item5')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Shield className="h-6 w-6 text-blue-600" />
                  {t('privacy.dataSecurity.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.dataSecurity.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataSecurity.item1')}</li>
                  <li>{t('privacy.dataSecurity.item2')}</li>
                  <li>{t('privacy.dataSecurity.item3')}</li>
                  <li>{t('privacy.dataSecurity.item4')}</li>
                  <li>{t('privacy.dataSecurity.item5')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('privacy.userRights.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.userRights.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>{t('privacy.userRights.access')}</strong> {t('privacy.userRights.accessDesc')}</li>
                  <li><strong>{t('privacy.userRights.rectification')}</strong> {t('privacy.userRights.rectificationDesc')}</li>
                  <li><strong>{t('privacy.userRights.erasure')}</strong> {t('privacy.userRights.erasureDesc')}</li>
                  <li><strong>{t('privacy.userRights.restriction')}</strong> {t('privacy.userRights.restrictionDesc')}</li>
                  <li><strong>{t('privacy.userRights.portability')}</strong> {t('privacy.userRights.portabilityDesc')}</li>
                  <li><strong>{t('privacy.userRights.objection')}</strong> {t('privacy.userRights.objectionDesc')}</li>
                </ul>
                <p className="mt-4">{t('privacy.userRights.contact')}</p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('privacy.cookies.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.cookies.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>{t('privacy.cookies.necessary')}</strong> {t('privacy.cookies.necessaryDesc')}</li>
                  <li><strong>{t('privacy.cookies.functional')}</strong> {t('privacy.cookies.functionalDesc')}</li>
                  <li><strong>{t('privacy.cookies.analytical')}</strong> {t('privacy.cookies.analyticalDesc')}</li>
                </ul>
                <p className="mt-4">{t('privacy.cookies.manage')}</p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('privacy.dataRetention.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('privacy.dataRetention.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataRetention.account')}</li>
                  <li>{t('privacy.dataRetention.projects')}</li>
                  <li>{t('privacy.dataRetention.logs')}</li>
                  <li>{t('privacy.dataRetention.support')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Changes */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('privacy.changes.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p>{t('privacy.changes.text')}</p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  {t('privacy.contact.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <p className="mb-4">{t('privacy.contact.text')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>{t('privacy.contact.email')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{t('privacy.contact.address')}</span>
                  </div>
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

export default PrivacyPolicyPage;
