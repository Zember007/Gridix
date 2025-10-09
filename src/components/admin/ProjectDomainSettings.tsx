import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Plus, Trash2, ExternalLink, Globe, Info, Copy } from "lucide-react";
import { useProjectDomains } from "@/hooks/useProjectDomains";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProjectDomainSettingsProps {
  projectId: string;
  projectName: string;
}

export default function ProjectDomainSettings({ projectId, projectName }: ProjectDomainSettingsProps) {
  const { domains, loading, updateDomain, deleteDomain } = useProjectDomains(projectId);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [dnsProvider, setDnsProvider] = useState<'manual' | 'cloudflare'>('manual');
  const [dnsApiKey, setDnsApiKey] = useState("");
  const [dnsZoneId, setDnsZoneId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { t } = useLanguage();

  // Получаем IP адрес VPS из переменных окружения или используем дефолтный
  const serverIP = import.meta.env.VITE_SERVER_IP || "YOUR_VPS_IP";
  const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "your-domain.com";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('domains.copyValue'));
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setIsAddingDomain(true);
    
    try {
      // Directly call the Edge Function via Supabase client
      const { data: result, error } = await supabase.functions.invoke('auto-domain-manager', {
        body: {
          domain: newDomain.trim(),
          project_id: projectId,
          dns_provider: dnsProvider,
          api_key: dnsApiKey,
          zone_id: dnsZoneId,
        },
      });

      if (error) {
        throw error;
      }

      if (result.success) {
        toast.success(result.message);
        setNewDomain("");
        
        // Show automation results
        if (result.automation.dns_created) {
          toast.success(t('domains.automation.dnsCreated'));
        }
        if (result.automation.hosting_added) {
          toast.success(t('domains.automation.hostingAdded'));
        }
        
        // Refresh domains list
        window.location.reload();
      } else {
        toast.error(result.error || t('domains.automation.failed'));
      }
    } catch (error) {
      console.error('Domain automation error:', error);
      toast.error(t('domains.automation.error'));
    }
    
    setIsAddingDomain(false);
  };

  const handleDeleteDomain = async (domainId: string) => {
    await deleteDomain(domainId);
  };

  const handleTogglePrimary = async (domainId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // First, set all other domains as non-primary
      for (const domain of domains) {
        if (domain.id !== domainId && domain.is_primary) {
          await updateDomain(domain.id, { is_primary: false });
        }
      }
    }
    
    await updateDomain(domainId, { is_primary: isPrimary });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('domains.title')}
        </CardTitle>
        <CardDescription>
          {t('domains.description', { projectName })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div className="font-medium">{t('domains.instructions.title')}</div>
            <div className="text-sm space-y-2">
              <div><strong>1.</strong> {t('domains.instructions.step1')}</div>
              <div><strong>2.</strong> {t('domains.instructions.step2')}</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* DNS Records Table */}
        {newDomain && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div className="font-medium">{t('domains.instructions.dnsRecords')}</div>
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="font-medium text-sm mb-2">{t('domains.instructions.rootDomain')}</div>
                  <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <div className="font-semibold text-foreground">{t('domains.dnsType')}</div>
                      <div className="bg-background p-2 rounded border">A</div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{t('domains.dnsName')}</div>
                      <div className="bg-background p-2 rounded border">@</div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {t('domains.dnsValue')}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(serverIP)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-background p-2 rounded border">{serverIP}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="font-medium text-sm mb-2">{t('domains.instructions.subdomain')}</div>
                  <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <div className="font-semibold text-foreground">{t('domains.dnsType')}</div>
                      <div className="bg-background p-2 rounded border">CNAME</div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{t('domains.dnsName')}</div>
                      <div className="bg-background p-2 rounded border">www</div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {t('domains.dnsValue')}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(serverDomain)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-background p-2 rounded border">{serverDomain}</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>3.</strong> {t('domains.instructions.step3')}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Add new domain */}
        <div className="space-y-4">
          <Label htmlFor="new-domain">{t('domains.addNew')}</Label>
          <div className="flex gap-2">
            <Input
              id="new-domain"
              placeholder={t('domains.placeholder')}
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
            />
            <Button 
              onClick={handleAddDomain}
              disabled={!newDomain.trim() || isAddingDomain}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingDomain ? t('domains.adding') : t('domains.addButton')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('domains.inputHelp')}
          </p>

          {/* DNS Automation Settings */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-3"
            >
              {showAdvanced ? 'Hide' : 'Show'} DNS Automation
            </Button>
            
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>DNS Provider</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={dnsProvider}
                    onChange={(e) => setDnsProvider(e.target.value as 'manual' | 'cloudflare')}
                  >
                    <option value="manual">Manual Setup</option>
                    <option value="cloudflare">Cloudflare (Auto)</option>
                  </select>
                </div>

                {dnsProvider === 'cloudflare' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Cloudflare API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Your Cloudflare API Key"
                        value={dnsApiKey}
                        onChange={(e) => setDnsApiKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone-id">Zone ID</Label>
                      <Input
                        id="zone-id"
                        placeholder="Your Cloudflare Zone ID"
                        value={dnsZoneId}
                        onChange={(e) => setDnsZoneId(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      With API credentials, DNS records will be created automatically.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Domains list */}
        <div className="space-y-4">
          <Label>{t('domains.connectedDomains')}</Label>
          
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              {t('loading')}
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('domains.noDomains')}</p>
              <p className="text-sm">{t('domains.addFirst')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{domain.domain}</span>
                        {domain.is_primary && (
                          <Badge variant="default" className="text-xs">
                            {t('domains.primary')}
                          </Badge>
                        )}
                        <Badge 
                          variant={domain.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {domain.status === 'active' ? t('domains.active') : domain.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('domains.addedOn')} {new Date(domain.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`primary-${domain.id}`} className="text-sm">
                        {t('domains.setPrimary')}
                      </Label>
                      <Switch
                        id={`primary-${domain.id}`}
                        checked={domain.is_primary}
                        onCheckedChange={(checked) => handleTogglePrimary(domain.id, checked)}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('domains.deleteConfirm')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('domains.deleteDescription', { domain: domain.domain })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('domains.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('domains.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning about DNS */}
        {domains.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('domains.warning')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
