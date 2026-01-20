import { useState, useEffect, useCallback } from 'react';
import { AmoCRMProjectList } from '@/components/admin/integrations/AmoCRMProjectList';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ExternalLink, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';

interface CRMConnection {
    id: string;
    user_id: string;
    crm_type: string;
    subdomain: string;
    access_token?: string | null;
    refresh_token?: string | null;
    token_expires_at?: string | null;
    account_name?: string | null;
}

export const AmoCRMConnection = () => {
    const { t } = useLanguage();
    const { getPathWithLanguage } = useLanguageNavigation();
    const [connection, setConnection] = useState<CRMConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorizing, setAuthorizing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
    const [showProjectsModal, setShowProjectsModal] = useState(false);

    const isAuthorized = connection?.access_token && connection?.refresh_token;
    const tokenExpired = connection?.token_expires_at && !connection.refresh_token ? new Date(connection.token_expires_at) < new Date() : false;

    const fetchConnection = useCallback(async () => {
        try {
            const { data, error } = await supabase.functions.invoke('amocrm-api', {
                body: { action: 'get_connection' }
            });

            if (error) throw error;
            setConnection(data.connection);
        } catch (error) {
            console.error('Error fetching AmoCRM connection:', error);
            // toast.error(t('amocrm.settingsLoadError')); // Optionally suppress error on load if not critical
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnection();
        // Check for success param in URL (after auth redirect)
        const params = new URLSearchParams(window.location.search);
        if (params.get('crm') === 'amocrm' && params.get('auth') === 'success') {
            toast.success(t('admin.common.active')); // Or some success message
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchConnection();
        }
    }, [fetchConnection, t]);

    const handleAuth = async () => {
        try {
            setAuthorizing(true);
            const { data, error } = await supabase.functions.invoke('amocrm-start-auth', {
                body: {
                    // Admin-panel global auth (not tied to a specific project)
                    return_to:
                        `${getPathWithLanguage('/admin')}?page=integrations&crm=amocrm&auth=success`,
                }
            });

            if (error) throw error;
            if (data?.auth_url) {
                window.open(data.auth_url, '_self');
            } else {
                throw new Error('No auth URL received');
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error(t('amocrm.authError') || 'Authentication failed');
        } finally {
            setAuthorizing(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setDisconnecting(true);
            // We'll use a direct delete or a special action if needed
            // Assuming we can delete from crm_connections directly or via edge function

            // Using edge function is safer if it handles cleanup
            const { error } = await supabase.functions.invoke('amocrm-api', {
                body: {
                    action: 'disconnect_user_connection'
                }
            });

            /* 
               Fallback if 'disconnect_user_connection' isn't implemented yet in the function:
               We can try to delete row directly if RLS allows.
            */
            if (error) {
                // Try direct delete
                const { error: deleteError } = await supabase
                    .from('crm_connections')
                    .delete()
                    .eq('crm_type', 'amocrm')
                    .eq('id', connection?.id || '');

                if (deleteError) throw deleteError;
            }

            setConnection(null);
            setShowDisconnectDialog(false);
            toast.success(t('amocrm.disconnectSuccess') || 'Disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting AmoCRM:', error);
            toast.error(t('amocrm.disconnectError') || 'Failed to disconnect');
        } finally {
            setDisconnecting(false);
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center animate-pulse bg-muted/50 rounded-xl" />;
    }

    return (
        <>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
                <div className="h-2 bg-[#4c8bf7] w-full" />
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="rounded-lg overflow-hidden">
                                <img src="/images/amoLogo.jpeg" alt="AmoCRM" className="w-16 h-16 object-contain" />
                            </div>
                        </CardTitle>
                        {isAuthorized && !tokenExpired && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                {t('admin.common.active') || 'Active'}
                            </Badge>
                        )}
                        {(!isAuthorized || tokenExpired) && (
                            <Badge variant="outline" className="text-muted-foreground">
                                {t('admin.common.inactive') || 'Inactive'}
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="mt-2">
                        {t('amocrm.description') || 'Automate sales and manage leads with AmoCRM integration.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isAuthorized && !tokenExpired ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-green-50/50 border border-green-100 rounded-lg flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-green-900">
                                        {t('amocrm.connectedTo') || 'Connected to'} <span className="font-bold">{connection?.account_name || connection?.subdomain}</span>
                                    </p>
                                    <p className="text-xs text-green-700 break-all">
                                        {connection?.subdomain}.amocrm.ru
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    className="w-full border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => setShowDisconnectDialog(true)}
                                >
                                    {t('amocrm.disconnect') || 'Disconnect'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleAuth}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {t('amocrm.reconnect') || 'Reconnect'}
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowProjectsModal(true)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                {t('admin.configureProjects') || 'Configure projects'}
                            </Button>
                        </div>

                    ) : (
                        <div className="space-y-4">
                            {tokenExpired && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{t('admin.amocrm.tokenExpired') || 'Token expired'}</AlertDescription>
                                </Alert>
                            )}
                            <Button
                                className="w-full bg-[#4c8bf7] hover:bg-[#3b72d1] text-white shadow-blue-200 shadow-lg"
                                onClick={handleAuth}
                                disabled={authorizing}
                            >
                                {authorizing ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                )}
                                {t('amocrm.connectAmoCRM') || 'Connect AmoCRM'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card >

            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('amocrm.disconnectWarningTitle') || 'Disconnect Integration?'}</DialogTitle>
                        <DialogDescription>
                            {t('amocrm.disconnectWarningMessage') || 'This will stop all sync processes. You can reconnect later.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                            {t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                            {disconnecting ? <RefreshCw className="animate-spin w-4 h-4" /> : t('common.confirm') || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>{t('admin.projectsConfig') || 'Projects configuration'}</DialogTitle>
                        <DialogDescription>
                            {t('amocrm.globalConnectionInfo') || 'Configure funnel and responsible user per project.'}
                        </DialogDescription>
                    </DialogHeader>

                    {connection && (
                        <AmoCRMProjectList connection={connection} open={showProjectsModal} />
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProjectsModal(false)}>
                            {t('common.close') || 'Close'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
