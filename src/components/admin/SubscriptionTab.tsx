import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useSubscription, ProjectSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, AlertCircle, CheckCircle, Clock, FileText, Receipt, Loader2, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { toast } from 'sonner';
 
export default function SubscriptionTab() {
  const { projectSubscriptions, plans, loading, plansLoading, requestInvoice, requestInvoiceForMultiple, refreshProjectSubscriptions, error } = useSubscription();
  const { t } = useLanguage();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug logging
  console.log('SubscriptionTab: projectSubscriptions:', projectSubscriptions);
  console.log('SubscriptionTab: loading:', loading);
  console.log('SubscriptionTab: plansLoading:', plansLoading);
  
  // Debug subscription IDs
  projectSubscriptions.forEach(project => {
    console.log(`Project ${project.name} (${project.id}) subscriptions:`, project.user_subscriptions?.map(sub => ({ id: sub.id, status: sub.status })));
  });

  if (loading || plansLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error loading subscriptions</h3>
        <p className="text-muted-foreground text-center mb-4">{error}</p>
        <Button onClick={refreshProjectSubscriptions} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    
    if (status === 'active' && !isExpired) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (status === 'trialing' || status === 'trial') {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <Crown className="w-3 h-3 mr-1" />
          Trial
        </Badge>
      );
    }
    if (status === 'pending_payment') {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Clock className="w-3 h-3 mr-1" />
          Pending Payment
        </Badge>
      );
    }
    if (status === 'expired' || isExpired) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const activeProjects = projectSubscriptions.filter((proj: ProjectSubscription) => {
    const sub = proj.user_subscriptions?.[0];
    const isExpired = proj.subscription_expires_at && new Date(proj.subscription_expires_at) < new Date();
    return sub && ['active', 'trialing'].includes(sub.status) && !isExpired;
  });

  const expiredProjects = projectSubscriptions.filter((proj: ProjectSubscription) => {
    const sub = proj.user_subscriptions?.[0];
    const isExpired = proj.subscription_expires_at && new Date(proj.subscription_expires_at) < new Date();
    return !sub || sub.status === 'expired' || isExpired || !['active', 'trialing', 'pending_payment'].includes(sub.status);
  });

  const pendingProjects = projectSubscriptions.filter((proj: ProjectSubscription) => {
    const sub = proj.user_subscriptions?.[0];
    return sub && sub.status === 'pending_payment';
  });

  const handleRequestInvoice = async (projectId: string) => {
    if (!selectedPlanId) {
      toast.error('Please select a plan');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await requestInvoice(projectId, selectedPlanId, selectedDuration);
      toast.success('Invoice requested successfully! You can view it now.');
      await refreshProjectSubscriptions();
      setIsInvoiceDialogOpen(false);
      
      // Optionally open invoice in new tab
      if (result?.invoice?.subscription_id) {
        console.log('handleRequestInvoice: Got subscription ID from result:', result.invoice.subscription_id);
        // Add a small delay to ensure the subscription is fully created
        setTimeout(() => {
          handleViewInvoice(result.invoice.subscription_id);
        }, 1000);
      }
    } catch (error) {
      console.error('Error requesting invoice:', error);
      toast.error('Failed to request invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewInvoice = async (subscriptionId: string) => {
    try {
    
      
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        toast.error('Please log in to view invoice');
        return;
      }

      // Call edge function to get invoice HTML
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { subscription_id: subscriptionId },
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Download PDF file
      if (data.success && data.invoice?.url) {
        // Fetch the PDF file and create a blob for download
        try {
          const response = await fetch(data.invoice.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${data.invoice.number}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(url);
          toast.success('Invoice downloaded successfully');
        } catch (fetchError) {
          console.error('Error downloading PDF:', fetchError);
          // Fallback: open in new tab
          window.open(data.invoice.url, '_blank');
          toast.info('Invoice opened in new tab');
        }
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error opening invoice:', error);
      toast.error('Failed to open invoice');
    }
  };

  const handleRequestMultipleInvoices = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a plan');
      return;
    }

    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    setIsProcessing(true);
    try {
      await requestInvoiceForMultiple(selectedProjects, selectedPlanId, selectedDuration);
      toast.success(`Invoices requested for ${selectedProjects.length} project(s)`);
      await refreshProjectSubscriptions();
      setIsInvoiceDialogOpen(false);
      setSelectedProjects([]);
    } catch (error) {
      console.error('Error requesting invoices:', error);
      toast.error('Failed to request invoices');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (project: ProjectSubscription) => {
    if (!project.user_profiles) return project.user_id.substring(0, 8);
    
    if (project.user_profiles.full_name) return project.user_profiles.full_name;
    if (project.user_profiles.company_name) return project.user_profiles.company_name;
    if (project.user_profiles.email) return project.user_profiles.email.split('@')[0];
    
    return project.user_id.substring(0, 8);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Project Subscriptions
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage subscriptions for all your projects
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
          <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-4xl text-green-600">{activeProjects.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
              Projects with active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-4xl text-yellow-600">{pendingProjects.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
              Projects awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-4xl text-red-600">{expiredProjects.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
              Projects requiring renewal
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Action Buttons */}
      {expiredProjects.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-5 h-5" />
              Action Required
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              You have {expiredProjects.length} project(s) that need subscription renewal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setSelectedProjects(expiredProjects.map(p => p.id))}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renew All Expired Subscriptions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Renew Subscriptions</DialogTitle>
                  <DialogDescription>
                    Select a plan and duration to renew subscriptions for the selected projects
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.base_price}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duration</Label>
                    <Select value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Projects ({selectedProjects.length})</p>
                    <div className="space-y-1">
                      {selectedProjects.map(projectId => {
                        const project = projectSubscriptions.find(p => p.id === projectId);
                        return project ? (
                          <p key={projectId} className="text-sm text-muted-foreground">
                            • {project.name}
                          </p>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={handleRequestMultipleInvoices}
                    disabled={isProcessing || !selectedPlanId}
                    className="w-full"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Renew {selectedProjects.length} Subscription{selectedProjects.length > 1 ? 's' : ''}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Projects Table */}
          <Card>
            <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>View and manage subscriptions for each project</CardDescription>
            </CardHeader>
            <CardContent>
          {projectSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects found</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Create a project to get started
              </p>
              <Button onClick={refreshProjectSubscriptions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSubscriptions.map((project: ProjectSubscription) => {
                  const subscription = project.user_subscriptions?.[0];
                  const isExpired = project.subscription_expires_at && new Date(project.subscription_expires_at) < new Date();
                  const needsPayment = !subscription || isExpired || !['active', 'trialing'].includes(subscription?.status || '');

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        {needsPayment && (
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => toggleProjectSelection(project.id)}
                            className="rounded border-gray-300"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-muted-foreground">{getUserName(project)}</TableCell>
                      <TableCell>
                        {getStatusBadge(subscription?.status || project.subscription_status || 'trial', project.subscription_expires_at)}
                      </TableCell>
                      <TableCell>
                        {subscription?.subscription_plans?.name || '—'}
                      </TableCell>
                      <TableCell>{formatDate(project.subscription_expires_at)}</TableCell>
                      <TableCell>
                        {subscription?.invoice_number || subscription?.status === 'pending_payment' ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{subscription.invoice_number || 'Pending'}</span>
                            {subscription?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInvoice(subscription.id)}
                                className="h-6 w-6 p-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {needsPayment && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant={isExpired || subscription?.status === 'expired' ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => setSelectedProjects([project.id])}
                              >
                                {isExpired || subscription?.status === 'expired' ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Renew Subscription
                                  </>
                                ) : (
                                  <>
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Request Invoice
                                  </>
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {isExpired || subscription?.status === 'expired' 
                                    ? `Renew Subscription for ${project.name}`
                                    : `Request Invoice for ${project.name}`
                                  }
                                </DialogTitle>
                                <DialogDescription>
                                  Select a plan and duration for this project
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Select Plan</Label>
                                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                          {plan.name} - ${plan.base_price}/month
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Duration</Label>
                                  <Select value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(Number(v))}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 Month</SelectItem>
                                      <SelectItem value="3">3 Months</SelectItem>
                                      <SelectItem value="6">6 Months</SelectItem>
                                      <SelectItem value="12">12 Months</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {selectedPlanId && (
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium">Selected Plan Details</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {plans.find(p => p.id === selectedPlanId)?.name} - ${plans.find(p => p.id === selectedPlanId)?.base_price}/month
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Duration: {selectedDuration} month{selectedDuration > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                )}

                                <Button
                                  onClick={() => handleRequestInvoice(project.id)}
                                  disabled={isProcessing || !selectedPlanId}
                                  className="w-full"
                                >
                                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  {isExpired || subscription?.status === 'expired' 
                                    ? 'Renew Subscription'
                                    : 'Request Invoice'
                                  }
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
            </CardContent>
          </Card>
    </div>
  );
}
