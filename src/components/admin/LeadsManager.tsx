import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  X,
  Edit,
  Phone,
  Mail,
  Building,
  Home,
  Minus,
} from 'lucide-react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeadsManagerProps {
  projectId?: string;
  showProjectColumn?: boolean;
}

export function LeadsManager({ projectId, showProjectColumn = false }: LeadsManagerProps) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const filters = {
    projectId,
    ...(statusFilter !== 'all' && { status: statusFilter as Lead['status'] }),
    ...(dateFromFilter && { dateFrom: dateFromFilter }),
    ...(dateToFilter && { dateTo: dateToFilter }),
  };

  const { leads, loading, error, cancelLead, updateLeadNotes, getLeadCounts } = useLeads(filters);
  const { toast } = useToast();

  const leadCounts = getLeadCounts();

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />{t('leads.status.pending')}</Badge>;
      case 'sent_to_crm':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t('leads.status.sent_to_crm')}</Badge>;
      case 'saved_only':
        return <Badge variant="outline" className="text-blue-600"><AlertCircle className="w-3 h-3 mr-1" />{t('leads.status.saved_only')}</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600"><AlertCircle className="w-3 h-3 mr-1" />{t('leads.status.failed')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-gray-600"><X className="w-3 h-3 mr-1" />{t('leads.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCopyLead = (lead: Lead) => {
    const leadInfo = `Имя: ${lead.name}
Телефон: ${lead.phone}
Email: ${lead.email}
Проект: ${lead.projects?.name || 'Не указан'}
Квартира: №${lead.apartments?.apartment_number}${lead.apartments?.area ? ` (${lead.apartments.area}м²)` : ''}
Дата заявки: ${format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}`;
    
    navigator.clipboard.writeText(leadInfo).then(() => {
      toast({
        title: t('leads.toast.copied.title'),
        description: t('leads.toast.copied.desc'),
      });
    }).catch(() => {
      toast({
        title: t('leads.toast.copyError.title'),
        description: t('leads.toast.copyError.desc'),
        variant: "destructive",
      });
    });
  };

  const handleCancel = async (leadId: string) => {
    try {
      await cancelLead(leadId);
      toast({
        title: t('leads.toast.cancelled.title'),
        description: t('leads.toast.cancelled.desc'),
      });
    } catch (error) {
      toast({
        title: t('leads.toast.cancelError.title'),
        description: t('leads.toast.cancelError.desc'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedLead) return;
    
    try {
      await updateLeadNotes(selectedLead.id, notes);
      setIsNotesDialogOpen(false);
      setSelectedLead(null);
      setNotes('');
      toast({
        title: t('leads.toast.notesSaved.title'),
        description: t('leads.toast.notesSaved.desc'),
      });
    } catch (error) {
      toast({
        title: t('leads.toast.notesError.title'),
        description: t('leads.toast.notesError.desc'),
        variant: "destructive",
      });
    }
  };

  const openNotesDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
    setIsNotesDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            {t('leads.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('leads.error')}: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{leadCounts.total}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.total')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{leadCounts.pending}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.pending')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{leadCounts.sent}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.sent')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{leadCounts.savedOnly}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.savedOnly')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{leadCounts.failed}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.failed')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{leadCounts.cancelled}</div>
            <div className="text-sm text-muted-foreground">{t('leads.stats.cancelled')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('leads.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('leads.filters.status')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('leads.status.all')}</SelectItem>
                  <SelectItem value="pending">{t('leads.status.pending')}</SelectItem>
                  <SelectItem value="sent_to_crm">{t('leads.status.sent_to_crm')}</SelectItem>
                  <SelectItem value="saved_only">{t('leads.status.saved_only')}</SelectItem>
                  <SelectItem value="failed">{t('leads.status.failed')}</SelectItem>
                  <SelectItem value="cancelled">{t('leads.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('leads.filters.dateFrom')}</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('leads.filters.dateTo')}</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('leads.title')}</CardTitle>
          <CardDescription>
            {t('leads.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('leads.table.date')}</TableHead>
                <TableHead>{t('leads.table.client')}</TableHead>
                <TableHead>{t('leads.table.contacts')}</TableHead>
                {showProjectColumn && <TableHead>{t('leads.table.project')}</TableHead>}
                <TableHead>{t('leads.table.apartment')}</TableHead>
                <TableHead>{t('leads.table.status')}</TableHead>
                <TableHead>{t('leads.table.crm')}</TableHead>
                <TableHead>{t('leads.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{lead.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        {lead.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email}
                      </div>
                    </div>
                  </TableCell>
                  {showProjectColumn && (
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {lead.projects?.name}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center">
                      <Home className="w-4 h-4 mr-1" />
                      №{lead.apartments?.apartment_number}
                      {lead.apartments?.area && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({lead.apartments.area}м²)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    {lead.amocrm_lead_id ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">AmoCRM</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {lead.amocrm_lead_id}
                        </div>
                        {lead.amocrm_sent_at && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(lead.amocrm_sent_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <Minus className="w-3 h-3 mr-1" />
                        <span className="text-sm">{t('leads.crm.notSent')}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(lead.status === 'saved_only' || lead.status === 'failed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLead(lead)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {t('leads.actions.copy')}
                        </Button>
                      )}
                      {lead.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(lead.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          {t('leads.actions.cancel')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openNotesDialog(lead)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {lead.amocrm_lead_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // This would need the subdomain from AmoCRM settings
                            // For now, just show a placeholder
                            toast({
                              title: t('leads.actions.openInCrm'),
                              description: `ID: ${lead.amocrm_lead_id}`,
                            });
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {leads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('leads.empty')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leads.notes.title')}</DialogTitle>
            <DialogDescription>
              {t('leads.notes.client')}: {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={t('leads.notes.placeholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
              {t('leads.cancel')}
            </Button>
            <Button onClick={handleUpdateNotes}>
              {t('leads.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
