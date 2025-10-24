import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, UserPlus, LogIn, Search } from 'lucide-react';
import { usePartnerClients } from '../../hooks/usePartnerClients';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';

export function ManagedClients() {
  const { clients, loading, error } = usePartnerClients();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'managed'>('all');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleImpersonate = async (clientId: string) => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('partner-program', {
        body: {
          action: 'impersonate',
          client_id: clientId
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.redirect_url) {
        window.open(data.redirect_url, '_blank');
      }
    } catch (error) {
      console.error('Error impersonating client:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось войти от лица клиента",
        variant: "destructive",
      });
    }
  };

  const handleAddManagedClient = async () => {
    if (!newClientEmail.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите email клиента",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      
      // Проверяем, существует ли пользователь с таким email
      const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-user-exists', {
        body: { email: newClientEmail.trim() }
      });

      if (checkError) {
        throw new Error('Ошибка проверки пользователя');
      }

      if (checkResult.exists) {
        throw new Error('Пользователь с таким email уже зарегистрирован. Партнерская программа предназначена для привлечения новых клиентов.');
      }

      // Отправляем приглашение новому пользователю
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      // Получаем ID партнёра
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('id, partner_code')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partnerProfile) {
        throw new Error('Партнёрский профиль не найден');
      }

      // Создаём приглашение
      const invitationCode = `${partnerProfile.partner_code}_${Date.now()}`;
      const { error: invitationError } = await supabase
        .from('partner_invitations')
        .insert({
          partner_id: partnerProfile.id,
          email: newClientEmail.trim(),
          status: 'pending',
          invitation_code: invitationCode
        })
        .select()
        .single();

      if (invitationError) {
        throw new Error('Не удалось создать приглашение');
      }

      // Отправляем email с приглашением (здесь можно добавить отправку email)
      const invitationLink = `${window.location.origin}/auth/signup?ref=${partnerProfile.partner_code}&invite=${invitationCode}`;
      
      toast({
        title: "Приглашение отправлено",
        description: `Приглашение отправлено на ${newClientEmail}. Ссылка: ${invitationLink}`,
      });
      
      setNewClientEmail('');
      setIsAddingClient(false);
    } catch (error) {
      console.error('Error adding managed client:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отправить приглашение",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || client.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Ошибка загрузки клиентов: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Клиенты</h2>
          <p className="text-muted-foreground">
            Управляйте клиентами на сопровождении
          </p>
        </div>
        
        <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Добавить клиента
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Пригласить нового клиента</DialogTitle>
              <DialogDescription>
                Введите email нового клиента для отправки приглашения. Партнерская программа предназначена для привлечения новых пользователей.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-email">Email клиента</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="client@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingClient(false)}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddManagedClient}
                  disabled={isAdding}
                >
                  {isAdding ? "Отправка..." : "Отправить приглашение"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(value: 'all' | 'referral' | 'managed') => setFilterType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все клиенты</SelectItem>
            <SelectItem value="referral">Реферальные</SelectItem>
            <SelectItem value="managed">На сопровождении</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список клиентов */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет клиентов</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Клиенты не найдены по заданным критериям'
                    : 'Начните привлекать клиентов через реферальную программу'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <Button onClick={() => setIsAddingClient(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Добавить первого клиента
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {client.user_profiles.full_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {client.user_profiles.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {client.user_profiles.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={client.type === 'referral' ? 'default' : 'secondary'}>
                      {client.type === 'referral' ? 'Реферал' : 'Сопровождение'}
                    </Badge>
                    
                    <div className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                    
                    {client.type === 'managed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(client.client_id)}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Войти от лица
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
