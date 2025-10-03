import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Mail, MapPin, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';

const RefundPolicyPage = () => {
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();

  const currentDate = new Date().toLocaleDateString(t('legal.locale') || 'ru-RU', { 
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
                <CreditCard className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('refund.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('refund.lastUpdated')} {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  {t('refund.introduction.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.introduction.text')}</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>{t('refund.introduction.important')}</strong> {t('refund.introduction.importantText')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  {t('refund.companyInfo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('refund.companyInfo.name')}</strong> {t('refund.companyInfo.nameValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('refund.companyInfo.address')}</strong> {t('refund.companyInfo.addressValue')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span><strong>{t('refund.companyInfo.email')}</strong> {t('refund.companyInfo.emailValue')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 14-Day Money Back Guarantee */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  {t('refund.guarantee.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.guarantee.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('refund.guarantee.item1')}</li>
                  <li>{t('refund.guarantee.item2')}</li>
                  <li>{t('refund.guarantee.item3')}</li>
                  <li>{t('refund.guarantee.item4')}</li>
                  <li>{t('refund.guarantee.item5')}</li>
                </ul>
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800">
                    <strong>{t('refund.guarantee.note')}</strong> {t('refund.guarantee.noteText')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Refund Eligibility */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  {t('refund.eligibility.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-green-600">{t('refund.eligibility.eligible.title')}</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>{t('refund.eligibility.eligible.item1')}</li>
                      <li>{t('refund.eligibility.eligible.item2')}</li>
                      <li>{t('refund.eligibility.eligible.item3')}</li>
                      <li>{t('refund.eligibility.eligible.item4')}</li>
                      <li>{t('refund.eligibility.eligible.item5')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-red-600">{t('refund.eligibility.notEligible.title')}</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>{t('refund.eligibility.notEligible.item1')}</li>
                      <li>{t('refund.eligibility.notEligible.item2')}</li>
                      <li>{t('refund.eligibility.notEligible.item3')}</li>
                      <li>{t('refund.eligibility.notEligible.item4')}</li>
                      <li>{t('refund.eligibility.notEligible.item5')}</li>
                      <li>{t('refund.eligibility.notEligible.item6')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Process */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('refund.process.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.process.text')}</p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('refund.process.step1.title')}</h4>
                      <p>{t('refund.process.step1.text')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('refund.process.step2.title')}</h4>
                      <p>{t('refund.process.step2.text')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('refund.process.step3.title')}</h4>
                      <p>{t('refund.process.step3.text')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t('refund.process.step4.title')}</h4>
                      <p>{t('refund.process.step4.text')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Timeline */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  {t('refund.timeline.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('refund.timeline.processing.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('refund.timeline.processing.item1')}</li>
                      <li>{t('refund.timeline.processing.item2')}</li>
                      <li>{t('refund.timeline.processing.item3')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('refund.timeline.receipt.title')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{t('refund.timeline.receipt.item1')}</li>
                      <li>{t('refund.timeline.receipt.item2')}</li>
                      <li>{t('refund.timeline.receipt.item3')}</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">
                      <strong>{t('refund.timeline.note')}</strong> {t('refund.timeline.noteText')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partial Refunds */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('refund.partialRefunds.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.partialRefunds.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('refund.partialRefunds.item1')}</li>
                  <li>{t('refund.partialRefunds.item2')}</li>
                  <li>{t('refund.partialRefunds.item3')}</li>
                </ul>
                <p className="mt-4">{t('refund.partialRefunds.calculation')}</p>
              </CardContent>
            </Card>

            {/* Subscription Cancellation */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('refund.cancellation.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.cancellation.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('refund.cancellation.item1')}</li>
                  <li>{t('refund.cancellation.item2')}</li>
                  <li>{t('refund.cancellation.item3')}</li>
                  <li>{t('refund.cancellation.item4')}</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    <strong>{t('refund.cancellation.howTo')}</strong> {t('refund.cancellation.howToText')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Special Cases */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                  {t('refund.specialCases.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('refund.specialCases.technical.title')}</h4>
                    <p>{t('refund.specialCases.technical.text')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('refund.specialCases.forceMajeure.title')}</h4>
                    <p>{t('refund.specialCases.forceMajeure.text')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('refund.specialCases.functionality.title')}</h4>
                    <p>{t('refund.specialCases.functionality.text')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dispute Resolution */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('refund.disputes.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.disputes.text')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('refund.disputes.item1')}</li>
                  <li>{t('refund.disputes.item2')}</li>
                  <li>{t('refund.disputes.item3')}</li>
                  <li>{t('refund.disputes.item4')}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('refund.changes.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p className="mb-4">{t('refund.changes.text1')}</p>
                <p>{t('refund.changes.text2')}</p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  {t('refund.contact.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700">
                <p className="mb-4">{t('refund.contact.text')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>{t('refund.contact.email')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{t('refund.contact.address')}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>{t('refund.contact.responseTime')}</strong> {t('refund.contact.responseTimeText')}
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

export default RefundPolicyPage;
