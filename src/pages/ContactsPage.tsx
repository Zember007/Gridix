import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';

const ContactsPage = () => {
  const { t } = useLanguage();

  // Contact links
  const telegramLink = 'https://t.me/gridix_bot';

  // Generate QR code URLs using QR Server API
  const generateQRCode = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex flex-col">
      {/* Header */}
      <HeroHeader />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-12 md:mb-20">
            {t('contacts.title')}
          </h1>

          {/* Content Grid */}
          <div className="flex gap-8 lg:gap-12 lg:flex-row flex-col lg:items-stretch items-center">
            {/* Left Section */}
            <div className="w-full grow bg-gray-100 rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center text-center space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                {t('contacts.gotQuestion')}
              </h2>
              
              <div className="inline-flex items-center justify-center bg-green-500 text-white px-8 py-4 rounded-full text-2xl md:text-3xl font-bold shadow-lg">
                {t('contacts.within5Minutes')}
              </div>
              
              <div className="inline-flex items-center justify-center bg-gray-800 text-white px-6 py-3 rounded-full text-xl md:text-2xl font-bold">
                {t('contacts.support247')}
              </div>
              
              <p className="text-lg md:text-xl text-gray-600 mt-6">
                {t('contacts.dontBeShy')}
              </p>
            </div>

            {/* Right Section - Contact Cards */}
           

              {/* Telegram Card */}
              <div className="max-w-[330px] bg-blue-500 rounded-3xl p-6 md:p-8 text-white flex flex-col items-center space-y-6">
                <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  {t('contacts.telegram')}
                </div>

                <Button 
                  variant="secondary"
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                  onClick={() => window.open(telegramLink, '_blank')}
                >
                  {t('contacts.contactFromDesktop')}
                </Button>

                {/* QR Code - Real */}
                <div className="bg-white rounded-2xl p-4 w-full aspect-square flex items-center justify-center">
                  <img 
                    src={'/QR_support.jpeg'} 
                    alt="Telegram QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-sm font-semibold">{t('contacts.contactFromPhone')}</p>
              </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactsPage;

