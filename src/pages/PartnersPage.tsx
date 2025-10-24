import { useState } from 'react';
import { usePartner } from '@/hooks/usePartner';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnersSection } from '@/components/partners/PartnersSection';
import { ManagedClients } from '@/components/partners/ManagedClients';
import { CommissionHistory } from '@/components/partners/CommissionHistory';
import { PayoutRequests } from '@/components/partners/PayoutRequests';
import { Loader2, Handshake, Users, DollarSign, CreditCard } from 'lucide-react';

const PartnersPage = () => {
  const { isPartner, loading, createPartnerProfile } = usePartner();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePartner = async () => {
    try {
      setIsCreating(true);
      await createPartnerProfile();
      toast({
        title: "Партнёрский профиль создан",
        description: "Теперь вы можете привлекать клиентов и получать комиссии",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать партнёрский профиль",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Партнёрская программа
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Привлекайте клиентов и получайте комиссию с каждой подписки
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Стать партнёром
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Присоединяйтесь к нашей партнёрской программе и начните зарабатывать
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">1</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Реферальная программа</h4>
                      <p className="text-sm text-gray-600">Получайте 20% комиссии с подписок привлечённых клиентов</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">2</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Полное сопровождение</h4>
                      <p className="text-sm text-gray-600">Ведите клиентов и получайте 20% комиссии с их подписок</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">3</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Автоматические выплаты</h4>
                      <p className="text-sm text-gray-600">Запрашивайте выплаты заработанных средств</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleCreatePartner}
                    disabled={isCreating}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Создание..." : "Стать партнёром"}
                  </button>
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Клиенты
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Комиссии
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Выплаты
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <PartnersSection />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-6">
          <ManagedClients />
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-6">
          <CommissionHistory />
        </TabsContent>
        
        <TabsContent value="payouts" className="mt-6">
          <PayoutRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnersPage;
