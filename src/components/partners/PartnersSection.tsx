import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Copy, ExternalLink, Users, DollarSign, TrendingUp, Handshake } from 'lucide-react';
import { usePartner } from '../../hooks/usePartner';
import { usePartnerStats } from '../../hooks/usePartnerStats';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export function PartnersSection() {
  const { isPartner, partnerProfile, loading: partnerLoading, createPartnerProfile } = usePartner();
  const { stats, loading: statsLoading } = usePartnerStats();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const { language } = useLanguage();

  const handleCreatePartner = async () => {
    try {
      setCreating(true);
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
      setCreating(false);
    }
  };

  const copyReferralLink = async () => {
    if (!partnerProfile) return;
    
    const referralLink = `${window.location.origin}/${language}/auth/signup?ref=${partnerProfile.partner_code}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Ссылка скопирована",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  if (partnerLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Партнёрская программа
            </CardTitle>
            <CardDescription>
              Привлекайте клиентов и получайте комиссию с каждой подписки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Реферальная программа</h4>
                  <p className="text-sm text-muted-foreground">
                    Получайте 20% комиссии с подписок привлечённых клиентов
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Полное сопровождение</h4>
                  <p className="text-sm text-muted-foreground">
                    Ведите клиентов и получайте 20% комиссии с их подписок
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCreatePartner} 
                disabled={creating}
                className="w-full"
              >
                {creating ? "Создание..." : "Стать партнёром"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/${language}/auth/signup?ref=${partnerProfile?.partner_code}`;

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего клиентов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.referral_clients || 0} реферальных, {stats?.managed_clients || 0} на сопровождении
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заработано</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.total_earned || 0}</div>
            <p className="text-xs text-muted-foreground">
              Доступно для вывода: ${stats?.available_for_withdrawal || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Партнёрский код</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {partnerProfile?.partner_code}
              </Badge>
              <Button size="sm" variant="outline" onClick={copyReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Реферальная ссылка */}
      <Card>
        <CardHeader>
          <CardTitle>Реферальная ссылка</CardTitle>
          <CardDescription>
            Поделитесь этой ссылкой с потенциальными клиентами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Копировать
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(referralLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Открыть
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Последние клиенты */}
      {stats?.clients && stats.clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Последние клиенты</CardTitle>
            <CardDescription>
              Клиенты, привлечённые через вашу реферальную программу
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {client.user_profiles.first_name?.[0]}{client.user_profiles.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.user_profiles.first_name} {client.user_profiles.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.user_profiles.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={client.type === 'referral' ? 'default' : 'secondary'}>
                      {client.type === 'referral' ? 'Реферал' : 'Сопровождение'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
