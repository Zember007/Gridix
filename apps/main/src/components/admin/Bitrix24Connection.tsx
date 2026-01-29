import { useState, useEffect } from 'react';
import { Bitrix24ProjectList } from '@/components/admin/integrations/Bitrix24ProjectList';
import { Button } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Alert, AlertDescription } from "@gridix/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@gridix/ui";
import { ExternalLink, CheckCircle, RefreshCw, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import { useLanguage } from '@/contexts/LanguageContext';
import { trackUsertourEvent } from '@gridix/utils/integrations';


interface CRMConnection {
    id: string;
    crm_type: string;
    subdomain: string;
    base_domain: string | null;
    token_expires_at: string | null;
}

export const Bitrix24Connection = () => {
    const { t } = useLanguage();
    const [connection, setConnection] = useState<CRMConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
    const [showProjectsModal, setShowProjectsModal] = useState(false);

    // Note: Bitrix24 auth usually implies installing the app in Bitrix marketplace
    // which then calls back to our app.

    const checkConnection = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('bitrix-app', {
                body: { action: 'bitrix_get_state' }
            });

            if (error) throw error;
            setConnection(data?.connection || null);
        } catch (error) {
            console.error('Error checking Bitrix24:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    useEffect(() => {
        if (!connection) return;
        void trackUsertourEvent({
            eventName: 'gridix_crm_connected',
            properties: { crm: 'bitrix24' },
            onceKey: 'gridix_crm_connected',
        });
    }, [connection]);

    const handleDisconnect = async () => {
        try {
            setBusy(true);
            if (connection) {
                const { error } = await supabase
                    .from('crm_connections')
                    .delete()
                    .eq('id', connection.id);

                if (error) throw error;
            }
            setConnection(null);
            setShowDisconnectDialog(false);
            toast.success('Bitrix24 disconnected');
        } catch (error) {
            console.error('Error disconnecting Bitrix24:', error);
            toast.error('Failed to disconnect');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center animate-pulse bg-muted/50 rounded-xl" />;
    }

    return (
        <>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="h-2 bg-[#2fc6f6] w-full" />
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="rounded-lg overflow-hidden">
                                <img src="/images/bitrixLogo.jpeg" alt="Bitrix24" className="w-16 h-16 object-contain" />
                            </div>
                        </CardTitle>
                        {connection ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                Inactive
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="mt-2">
                        Connect your Bitrix24 portal to sync leads and deals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                    {connection ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-green-50/50 border border-green-100 rounded-lg flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-green-900">
                                        Connected to <span className="font-bold">{connection.base_domain || connection.subdomain}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => setShowDisconnectDialog(true)}
                            >
                                Disconnect
                            </Button>

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
                            <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-xs">
                                    To connect, install the Gridix app from the Bitrix24 Marketplace in your portal.
                                </AlertDescription>
                            </Alert>
                            <Button
                                className="w-full bg-[#2fc6f6] hover:bg-[#20b0dd] text-white"
                                onClick={() => window.open('https://www.bitrix24.com/apps/', '_blank')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Go to Marketplace
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Bitrix24?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this connection? You will need to reinstall the app to reconnect.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect} disabled={busy}>
                            {busy ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>{t('admin.projectsConfig') || 'Projects configuration'}</DialogTitle>
                        <DialogDescription>
                            {t('admin.bitrix24.configureProjectDesc') || 'Select the Bitrix24 funnel for each project.'}
                        </DialogDescription>
                    </DialogHeader>

                    {connection && (
                        <Bitrix24ProjectList connection={connection} open={showProjectsModal} />
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
