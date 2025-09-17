import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Mail, Phone, User, UserMinus, UserCheck, UserX, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManagerAccount {
  id: string;
  manager_id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended';
  invited_at: string;
  accepted_at?: string;
}

interface ManagerInvitation {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  invitation_token: string;
}

interface NewManagerForm {
  email: string;
  full_name: string;
  phone: string;
}

const ManagerAccountsManager = ({ developerId }: { developerId: string }) => {
  const { t } = useLanguage();
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [invitations, setInvitations] = useState<ManagerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newManager, setNewManager] = useState<NewManagerForm>({
    email: '',
    full_name: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadManagerData();
  }, [developerId]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      
      // Загружаем активных менеджеров
      const { data: managersData, error: managersError } = await supabase
        .from('manager_accounts')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });

      if (managersError) throw managersError;

      // Загружаем только активные приглашения (не принятые и не истекшие)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('manager_invitations')
        .select('*')
        .eq('developer_id', developerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      setManagers(managersData || []);
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error loading manager data:', error);
      toast.error(t('managerAccounts.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteManager = async () => {
    if (!newManager.email || !newManager.full_name) {
      toast.error(t('managerAccounts.fillRequiredFields'));
      return;
    }

    setSubmitting(true);
    try {
      // Проверяем, существует ли уже менеджер с таким email
      const { data: existingManager } = await supabase
        .from('manager_accounts')
        .select('id, status')
        .eq('developer_id', developerId)
        .eq('email', newManager.email)
        .single();

      if (existingManager) {
        if (existingManager.status === 'active') {
          toast.error('Менеджер с таким email уже добавлен');
          return;
        } else if (existingManager.status === 'suspended') {
          toast.error('Менеджер с таким email заблокирован. Разблокируйте его для повторного использования.');
          return;
        }
      }

      // Проверяем, существует ли активное приглашение с таким email
      const { data: existingInvitation } = await supabase
        .from('manager_invitations')
        .select('id, status, expires_at')
        .eq('developer_id', developerId)
        .eq('email', newManager.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingInvitation) {
        toast.error('Активное приглашение для этого email уже существует');
        return;
      }

      // Проверяем, существует ли уже пользователь с таким email
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newManager.email)
        .single();

      if (existingUser) {
        // Пользователь уже существует, создаем manager_account
        const { error: accountError } = await supabase
          .from('manager_accounts')
          .insert({
            developer_id: developerId,
            manager_id: existingUser.id,
            email: newManager.email,
            full_name: newManager.full_name,
            phone: newManager.phone,
            status: 'active',
            accepted_at: new Date().toISOString()
          });

        if (accountError) throw accountError;
        toast.success(t('managerAccounts.managerAdded'));
      } else {
        // Пользователь не существует, создаем приглашение
        const invitationToken = await generateInvitationToken();
        
        const { error: invitationError } = await supabase
          .from('manager_invitations')
          .insert({
            developer_id: developerId,
            email: newManager.email,
            full_name: newManager.full_name,
            phone: newManager.phone,
            invitation_token: invitationToken
          });

        if (invitationError) throw invitationError;

        // Отправляем email с приглашением
        try {
          await sendInvitationEmail({
            email: newManager.email,
            full_name: newManager.full_name,
            phone: newManager.phone,
            invitation_token: invitationToken
          });
          toast.success(t('managerAccounts.invitationSent'));
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Показываем предупреждение с подробностями ошибки
          toast.warning(`Приглашение создано, но письмо не отправлено: ${emailError.message || 'Проверьте настройки SMTP'}`);
          toast.info('Скопируйте ссылку приглашения вручную из списка ниже');
        }
      }

      setNewManager({ email: '', full_name: '', phone: '' });
      setIsAddDialogOpen(false);
      loadManagerData();
    } catch (error) {
      console.error('Error inviting manager:', error);
      toast.error(t('managerAccounts.errorInviting'));
    } finally {
      setSubmitting(false);
    }
  };

  const generateInvitationToken = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invitation_token');
    if (error) throw error;
    return data;
  };

  const sendInvitationEmail = async (invitationData: {
    email: string;
    full_name: string;
    phone?: string;
    invitation_token: string;
  }) => {
    try {
      // Получаем информацию о застройщике
      const { data: developerData } = await supabase
        .from('user_profiles')
        .select('full_name, company_name')
        .eq('id', developerId)
        .single();

      const response = await supabase.functions.invoke('send-manager-invitation', {
        body: {
          email: invitationData.email,
          full_name: invitationData.full_name,
          phone: invitationData.phone,
          developer_name: developerData?.full_name || 'Застройщик',
          company_name: developerData?.company_name || 'Компания',
          invitation_token: invitationData.invitation_token
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  };

  const handleSuspendManager = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from('manager_accounts')
        .update({ status: 'suspended' })
        .eq('id', managerId);

      if (error) throw error;
      toast.success(t('managerAccounts.managerSuspended'));
      loadManagerData();
    } catch (error) {
      console.error('Error suspending manager:', error);
      toast.error(t('managerAccounts.errorSuspending'));
    }
  };

  const handleActivateManager = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from('manager_accounts')
        .update({ status: 'active' })
        .eq('id', managerId);

      if (error) throw error;
      toast.success(t('managerAccounts.managerActivated'));
      loadManagerData();
    } catch (error) {
      console.error('Error activating manager:', error);
      toast.error(t('managerAccounts.errorActivating'));
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from('manager_accounts')
        .delete()
        .eq('id', managerId);

      if (error) throw error;
      toast.success(t('managerAccounts.managerRemoved'));
      loadManagerData();
    } catch (error) {
      console.error('Error removing manager:', error);
      toast.error(t('managerAccounts.errorRemoving'));
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('manager_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      toast.success(t('managerAccounts.invitationCancelled'));
      loadManagerData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(t('managerAccounts.errorCancelling'));
    }
  };

  const copyInvitationLink = async (token: string) => {
    const siteUrl = window.location.origin;
    const encodedToken = encodeURIComponent(token);
    const invitationUrl = `${siteUrl}/accept-invitation?token=${encodedToken}`;
    
    console.log('Generated invitation URL:', invitationUrl);
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success(t('managerAccounts.linkCopied'));
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error(t('managerAccounts.failedToCopy'));
    }
  };

  const openInvitationLink = (token: string) => {
    const siteUrl = window.location.origin;
    const encodedToken = encodeURIComponent(token);
    const invitationUrl = `${siteUrl}/accept-invitation?token=${encodedToken}`;
    console.log('Opening invitation URL:', invitationUrl);
    window.open(invitationUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('managerAccounts.statusActive')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('managerAccounts.statusPending')}</Badge>;
      case 'suspended':
        return <Badge variant="destructive">{t('managerAccounts.statusSuspended')}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600">{t('managerAccounts.statusExpired')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('managerAccounts.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('managerAccounts.description')}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('managerAccounts.addManager')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('managerAccounts.inviteManager')}</DialogTitle>
              <DialogDescription>
                {t('managerAccounts.inviteManagerDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">{t('managerAccounts.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('managerAccounts.emailPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="full_name">{t('managerAccounts.fullName')}</Label>
                <Input
                  id="full_name"
                  value={newManager.full_name}
                  onChange={(e) => setNewManager(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={t('managerAccounts.fullNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('managerAccounts.phone')}</Label>
                <Input
                  id="phone"
                  value={newManager.phone}
                  onChange={(e) => setNewManager(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('managerAccounts.phonePlaceholder')}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleInviteManager} disabled={submitting}>
                  {submitting ? t('managerAccounts.inviting') : t('managerAccounts.invite')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Активные менеджеры */}
      {managers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('managerAccounts.activeManagers')}</CardTitle>
            <CardDescription>{t('managerAccounts.activeManagersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {managers.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{manager.full_name}</h4>
                        {getStatusBadge(manager.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{manager.email}</span>
                        </div>
                        {manager.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{manager.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {manager.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspendManager(manager.id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        {t('managerAccounts.suspend')}
                      </Button>
                    ) : manager.status === 'suspended' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateManager(manager.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {t('managerAccounts.activate')}
                      </Button>
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <UserMinus className="h-4 w-4 mr-1" />
                          {t('managerAccounts.remove')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('managerAccounts.confirmRemove')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('managerAccounts.confirmRemoveDesc', { name: manager.full_name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveManager(manager.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('managerAccounts.remove')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ожидающие приглашения */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('managerAccounts.pendingInvitations')}</CardTitle>
            <CardDescription>{t('managerAccounts.pendingInvitationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{invitation.full_name}</h4>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{invitation.email}</span>
                        </div>
                        {invitation.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{invitation.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('managerAccounts.expiresAt')}: {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInvitationLink(invitation.invitation_token)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {t('managerAccounts.copyLink')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInvitationLink(invitation.invitation_token)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('managerAccounts.openLink')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          {t('managerAccounts.cancel')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('managerAccounts.confirmCancel')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('managerAccounts.confirmCancelDesc', { name: invitation.full_name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelInvitation(invitation.id)}
                          >
                            {t('managerAccounts.cancel')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {managers.length === 0 && invitations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('managerAccounts.noManagers')}</h3>
            <p className="text-muted-foreground mb-4">{t('managerAccounts.noManagersDesc')}</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('managerAccounts.addFirstManager')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagerAccountsManager;
