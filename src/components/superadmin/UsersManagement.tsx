import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ban, UserPlus, LogIn, Search, ShieldCheck, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  created_at: string;
}

interface BannedUser {
  user_id: string;
  banned_at: string;
  reason: string | null;
  unbanned_at: string | null;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [banReason, setBanReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openBanDialog, setOpenBanDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  
  // Form states for creating user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBannedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .is('unbanned_at', null);

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error('Error fetching banned users:', error);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId) return;

    try {
      const { error } = await supabase.from('banned_users').insert({
        user_id: selectedUserId,
        banned_by: (await supabase.auth.getUser()).data.user?.id,
        reason: banReason,
      });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Пользователь заблокирован',
      });

      setBanReason('');
      setSelectedUserId(null);
      setOpenBanDialog(false);
      fetchBannedUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось заблокировать пользователя',
        variant: 'destructive',
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'unban_user',
            user_id: userId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to unban user');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь разблокирован',
      });

      fetchBannedUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось разблокировать пользователя',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: 'Ошибка',
        description: 'Email и пароль обязательны',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'create_user',
            email: newUserEmail,
            password: newUserPassword,
            full_name: newUserFullName,
            company_name: newUserCompany,
            phone: newUserPhone,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь создан',
      });

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserCompany('');
      setNewUserPhone('');
      setOpenCreateDialog(false);
      
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось создать пользователя';
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImpersonateUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'impersonate_user',
            user_id: userId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to impersonate user');
      }

      // Redirect to the magic link
      if (result.redirect_url) {
        window.open(result.redirect_url, '_blank');
      }
    } catch (error: unknown) {
      console.error('Error impersonating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось войти под пользователем';
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isUserBanned = (userId: string) => {
    return bannedUsers.some(banned => banned.user_id === userId);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Управление пользователями</h2>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить нового пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Пароль *</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Полное имя</Label>
                <Input 
                  placeholder="Иван Иванов" 
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>Компания</Label>
                <Input 
                  placeholder="ООО Компания" 
                  value={newUserCompany}
                  onChange={(e) => setNewUserCompany(e.target.value)}
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input 
                  placeholder="+7 (999) 123-45-67" 
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? 'Создание...' : 'Создать пользователя'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по email, имени или компании..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isBanned = isUserBanned(user.id);
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || '—'}</TableCell>
                  <TableCell>{user.company_name || '—'}</TableCell>
                  <TableCell>
                    {isBanned ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Ban className="h-3 w-3" />
                        Заблокирован
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <ShieldCheck className="h-3 w-3" />
                        Активен
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Разблокировать
                        </Button>
                      ) : (
                        <Dialog open={openBanDialog && selectedUserId === user.id} onOpenChange={(open) => {
                          setOpenBanDialog(open);
                          if (!open) {
                            setSelectedUserId(null);
                            setBanReason('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setOpenBanDialog(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Бан
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Заблокировать пользователя</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Вы собираетесь заблокировать: <strong>{user.email}</strong>
                                </p>
                                <Label>Причина блокировки</Label>
                                <Textarea
                                  placeholder="Укажите причину..."
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleBanUser} className="w-full">
                                Заблокировать
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleImpersonateUser(user.id)}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Войти
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
