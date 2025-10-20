import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Mail, Phone, User, UserMinus, UserCheck, UserX, Copy, ExternalLink, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
  
  // User existence check and password
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userAccountType, setUserAccountType] = useState<string | null>(null);
  const [managerPassword, setManagerPassword] = useState('');
  const [checkingUser, setCheckingUser] = useState(false);
  
  // Project access management
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerAccount | null>(null);
  const [developerProjects, setDeveloperProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  
  // New manager project access
  const [newManagerProjectIds, setNewManagerProjectIds] = useState<string[]>([]);

  useEffect(() => {
    loadManagerData();
  }, [developerId]);

  // Загружаем проекты при открытии диалога добавления менеджера
  useEffect(() => {
    if (isAddDialogOpen) {
      loadDeveloperProjects();
    }
  }, [isAddDialogOpen]);

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

      setManagers((managersData || []) as ManagerAccount[]);
      setInvitations((invitationsData || []) as ManagerInvitation[]);
    } catch (error) {
      console.error('Error loading manager data:', error);
      toast.error(t('managerAccounts.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailBlur = async () => {
    if (!newManager.email) {
      setUserExists(null);
      return;
    }
    
    setCheckingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-user-exists', {
        body: { email: newManager.email }
      });
      
      if (!error && data) {
        setUserExists(data.exists);
        setUserAccountType(data.accountType);
        
        // Если пользователь существует и не является менеджером, показываем ошибку
        if (data.exists && data.accountType !== 'manager') {
          toast.error(t('managerAccounts.userNotManager'));
        }
      } else {
        console.error('Error checking user existence:', error);
        setUserExists(null);
        setUserAccountType(null);
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      setUserExists(null);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleInviteManager = async () => {
    if (!newManager.email || !newManager.full_name) {
      toast.error(t('managerAccounts.fillRequiredFields'));
      return;
    }

    // Если пользователь существует и не является менеджером, блокируем
    if (userExists === true && userAccountType !== 'manager') {
      toast.error(t('managerAccounts.userNotManager'));
      return;
    }

    // Если пользователь не существует, проверяем наличие пароля
    if (userExists === false && !managerPassword) {
      toast.error(t('managerAccounts.passwordRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // Получаем информацию о текущем разработчике
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Unauthorized');
        return;
      }

      // Получаем developer_name и company_name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, company_name')
        .eq('id', developerId)
        .single();

      // Генерируем токен приглашения
      const invitation_token = await generateInvitationToken();

      // Вызываем Edge Function для всех проверок и создания
      const { data, error } = await supabase.functions.invoke('send-manager-invitation', {
        body: {
          email: newManager.email,
          full_name: newManager.full_name,
          phone: newManager.phone,
          developer_name: profile?.full_name || 'Developer',
          company_name: profile?.company_name || '',
          invitation_token: invitation_token,
          project_ids: newManagerProjectIds.length > 0 ? newManagerProjectIds : undefined,
          password: userExists === false ? managerPassword : undefined
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      if (!data?.success) {
        // Обрабатываем ошибки из Edge Function
        if (data?.error?.includes('already exists and is active')) {
          toast.error('Менеджер с таким email уже добавлен');
        } else if (data?.error?.includes('is suspended')) {
          toast.error('Менеджер с таким email заблокирован. Разблокируйте его для повторного использования.');
        } else if (data?.error?.includes('Active invitation')) {
          toast.error('Активное приглашение для этого email уже существует');
        } else {
          toast.error(data?.error || t('managerAccounts.errorInviting'));
        }
        return;
      }

      // Успешно создан
      if (data.already_registered) {
        toast.success('Менеджер успешно добавлен (пользователь уже зарегистрирован)');
      } else {
        toast.success('Приглашение успешно отправлено');
      }

      setNewManager({ email: '', full_name: '', phone: '' });
      setNewManagerProjectIds([]);
      setUserExists(null);
      setUserAccountType(null);
      setManagerPassword('');
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

  // Project Access Management Functions
  const loadDeveloperProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('user_id', developerId)
        .order('name');

      if (error) throw error;
      setDeveloperProjects(projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Ошибка загрузки проектов');
    }
  };

  const loadManagerAccess = async (managerAccountId: string) => {
    try {
      const { data: accessRules, error } = await supabase
        .from('manager_project_access')
        .select('project_id')
        .eq('manager_account_id', managerAccountId);

      if (error) throw error;

      const projectIds = (accessRules || []).map((rule) => rule.project_id);
      setSelectedProjectIds(projectIds);
    } catch (error) {
      console.error('Error loading manager access:', error);
      toast.error('Ошибка загрузки доступа');
    }
  };

  const handleManageAccess = async (manager: ManagerAccount) => {
    setSelectedManager(manager);
    setLoadingAccess(true);
    setIsAccessDialogOpen(true);
    
    await loadDeveloperProjects();
    await loadManagerAccess(manager.id);
    
    setLoadingAccess(false);
  };

  const handleSaveAccess = async () => {
    if (!selectedManager) return;

    try {
      // Удаляем все существующие записи доступа для этого менеджера
      const { error: deleteError } = await supabase
        .from('manager_project_access')
        .delete()
        .eq('manager_account_id', selectedManager.id);

      if (deleteError) throw deleteError;

      // Если выбраны конкретные проекты, добавляем их
      if (selectedProjectIds.length > 0) {
        const accessRecords = selectedProjectIds.map(projectId => ({
          manager_account_id: selectedManager.id,
          project_id: projectId
        }));

        const { error: insertError } = await supabase
          .from('manager_project_access')
          .insert(accessRecords);

        if (insertError) throw insertError;
      }
      // Если ничего не выбрано, удалили все записи - это означает доступ ко всем проектам

      toast.success(t('workspace.accessUpdated'));
      setIsAccessDialogOpen(false);
      setSelectedManager(null);
      setSelectedProjectIds([]);
    } catch (error) {
      console.error('Error saving access:', error);
      toast.error(t('workspace.errorUpdatingAccess'));
    }
  };

  const toggleProjectAccess = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const selectAllProjects = () => {
    setSelectedProjectIds(developerProjects.map(p => p.id));
  };

  const clearAllProjects = () => {
    setSelectedProjectIds([]);
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
                  onBlur={handleEmailBlur}
                  placeholder={t('managerAccounts.emailPlaceholder')}
                  disabled={checkingUser}
                />
                {checkingUser && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('managerAccounts.checkingUser')}
                  </p>
                )}
                {userExists === true && (
                  <p className="text-sm text-green-600 mt-1">
                    {t('managerAccounts.userExists')}
                  </p>
                )}
                {userExists === false && (
                  <p className="text-sm text-blue-600 mt-1">
                    {t('managerAccounts.userNotExists')}
                  </p>
                )}
              </div>
              
              {userExists === false && (
                <div>
                  <Label htmlFor="manager_password">{t('managerAccounts.setPassword')}</Label>
                  <Input
                    id="manager_password"
                    type="password"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    placeholder={t('managerAccounts.passwordPlaceholder')}
                  />
                </div>
              )}
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
              
              {/* Project Access Selection */}
              <div className="space-y-2">
                <Label>{t('workspace.projectAccess')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('workspace.leaveEmptyForAll')}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {t('workspace.selectProjects')}: {newManagerProjectIds.length} / {developerProjects.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewManagerProjectIds(developerProjects.map(p => p.id))}
                    >
                      {t('workspace.allProjects')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewManagerProjectIds([])}
                    >
                      {t('common.clear')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {developerProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('workspace.noProjectsSelected')}
                    </p>
                  ) : (
                    developerProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`new-project-${project.id}`}
                          checked={newManagerProjectIds.includes(project.id)}
                          onCheckedChange={() => {
                            setNewManagerProjectIds(prev => {
                              if (prev.includes(project.id)) {
                                return prev.filter(id => id !== project.id);
                              } else {
                                return [...prev, project.id];
                              }
                            });
                          }}
                        />
                        <label
                          htmlFor={`new-project-${project.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium text-sm">{project.name}</div>
                          {project.description && (
                            <div className="text-xs text-muted-foreground">
                              {project.description}
                            </div>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewManagerProjectIds([]);
                }}>
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
                    {/* Project Access Management Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageAccess(manager)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {t('workspace.manageAccess')}
                    </Button>
                    
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

      {/* Project Access Management Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('workspace.projectAccess')}</DialogTitle>
            <DialogDescription>
              {selectedManager && (
                <>
                  {t('workspace.grantAccessToProjects')} <strong>{selectedManager.full_name}</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {t('workspace.leaveEmptyForAll')}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingAccess ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('workspace.selectProjects')}: {selectedProjectIds.length} / {developerProjects.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllProjects}
                  >
                    {t('workspace.allProjects')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllProjects}
                  >
                    {t('common.clear')}
                  </Button>
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
                {developerProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('workspace.noProjectsSelected')}
                  </p>
                ) : (
                  developerProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={() => toggleProjectAccess(project.id)}
                      />
                      <label
                        htmlFor={`project-${project.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground">
                            {project.description}
                          </div>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>

              {/* Info Message */}
              {selectedProjectIds.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  {t('workspace.leaveEmptyForAll')}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAccessDialogOpen(false);
                    setSelectedManager(null);
                    setSelectedProjectIds([]);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveAccess}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerAccountsManager;
