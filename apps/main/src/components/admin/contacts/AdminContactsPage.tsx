import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, FileDown, Search, User } from 'lucide-react';
import { supabase } from "@gridix/utils/api";
import { Input } from "@gridix/ui";
import { showToast } from "@gridix/utils/lib";
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useLeads } from '@/entities/lead/queries/useLeads';
import { Button } from "@gridix/ui";

type ContactKind = 'lead' | 'agent';

interface ContactRow {
  id: string;
  kind: ContactKind;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
  meta?: {
    leadCount?: number;
    agentStatus?: string | null;
    agentType?: string | null;
  };
}

const normalizePhone = (value: string | null | undefined) => (value ? value.replace(/[^0-9+]/g, '') : '');
const normalizeEmail = (value: string | null | undefined) => (value ? value.trim().toLowerCase() : '');

export function AdminContactsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();

  const developerId = isManagerMode ? activeWorkspaceId : user?.id ?? null;

  const { leads, loading: leadsLoading } = useLeads();

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | ContactKind>('all');

  const noName = t('admin.contactsPage.noName');

  const agentsQuery = useQuery({
    queryKey: ['agent_applications', developerId],
    enabled: !!developerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_applications')
        .select('id, full_name, email, phone, status, type, created_at, developer_user_id')
        .eq('developer_user_id', developerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const leadContacts: ContactRow[] = useMemo(() => {
    // Aggregate multiple leads per same person (by email/phone), keep leadCount.
    const byKey = new Map<string, ContactRow>();

    for (const lead of leads) {
      const name = (lead.name || '').trim();
      const email = normalizeEmail(lead.email);
      const phone = normalizePhone(lead.phone);

      // Fallback key: lead id (so we still show it even if missing contact fields)
      const key = email || phone || `lead:${lead.id}`;

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          id: lead.id,
          kind: 'lead',
          name: name || noName,
          email: lead.email?.trim() || null,
          phone: lead.phone?.trim() || null,
          createdAt: lead.created_at || null,
          meta: { leadCount: 1 },
        });
      } else {
        const nextCount = (existing.meta?.leadCount ?? 1) + 1;
        byKey.set(key, {
          ...existing,
          // Prefer non-empty fields if present in later leads
          name: existing.name !== noName ? existing.name : name || existing.name,
          email: existing.email || (lead.email?.trim() || null),
          phone: existing.phone || (lead.phone?.trim() || null),
          createdAt: existing.createdAt && lead.created_at
            ? (new Date(existing.createdAt) > new Date(lead.created_at) ? existing.createdAt : lead.created_at)
            : (existing.createdAt || lead.created_at || null),
          meta: { ...existing.meta, leadCount: nextCount },
        });
      }
    }

    return Array.from(byKey.values());
  }, [leads, noName]);

  const agentContacts: ContactRow[] = useMemo(() => {
    const rows = agentsQuery.data ?? [];
    return rows.map((a) => ({
      id: a.id,
      kind: 'agent',
      name: (a.full_name || '').trim() || noName,
      email: a.email?.trim() || null,
      phone: a.phone?.trim() || null,
      createdAt: a.created_at || null,
      meta: {
        agentStatus: a.status ?? null,
        agentType: a.type ?? null,
      },
    }));
  }, [agentsQuery.data, noName]);

  const allContacts: ContactRow[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = [...leadContacts, ...agentContacts]
      .filter((c) => (kindFilter === 'all' ? true : c.kind === kindFilter))
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bd - ad;
      });

    return filtered;
  }, [agentContacts, leadContacts, kindFilter, query]);

  const isLoading = leadsLoading || agentsQuery.isLoading;

  const handleExportCSV = () => {
    if (allContacts.length === 0) {
      showToast(
        'info',
        t('admin.contactsPage.toastNothingToExportTitle'),
        t('admin.contactsPage.toastNothingToExportDesc'),
      );
      return;
    }
    const headers = [
      t('admin.contactsPage.tableContact'),
      t('admin.contactsPage.tableType'),
      t('admin.contactsPage.tablePhone'),
      t('admin.contactsPage.tableEmail'),
      t('admin.contactsPage.tableDetails'),
      t('admin.contactsPage.tableDate'),
    ];
    const typeLabel = (kind: ContactKind) =>
      kind === 'agent' ? t('admin.contactsPage.typeAgent') : t('admin.contactsPage.typeClient');
    const rows = allContacts.map((c) => {
      const safeName = (c.name || '').replace(/"/g, '""');
      const details =
        c.kind === 'agent'
          ? `${c.meta?.agentStatus ?? '—'}${c.meta?.agentType ? ` • ${c.meta.agentType}` : ''}`
          : t('admin.contactsPage.detailsLeads', { count: c.meta?.leadCount ?? 1 });
      const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—';
      return `"${safeName}","${typeLabel(c.kind)}","${(c.phone ?? '').replace(/"/g, '""')}","${(c.email ?? '').replace(/"/g, '""')}","${details.replace(/"/g, '""')}","${date}"`;
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      t('admin.contactsPage.toastExportDoneTitle'),
      t('admin.contactsPage.toastExportDoneDesc'),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('admin.contactsPage.title')}</h2>
          <p className="text-sm text-slate-500">{t('admin.contactsPage.description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isLoading || allContacts.length === 0}
          className="shrink-0 gap-2"
        >
          <FileDown size={16} />
          {t('admin.contactsPage.exportBtn')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder={t('admin.contactsPage.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex gap-2">
            {(
              [
                { id: 'all', labelKey: 'admin.contactsPage.filterAll' },
                { id: 'lead', labelKey: 'admin.contactsPage.filterClients' },
                { id: 'agent', labelKey: 'admin.contactsPage.filterAgents' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setKindFilter(opt.id)}
                className={`h-10 px-3 rounded-lg text-sm font-bold border transition-colors ${
                  kindFilter === opt.id
                    ? 'bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] border-[var(--admin-primary)]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">{t('admin.contactsPage.tableContact')}</th>
                <th className="px-6 py-4">{t('admin.contactsPage.tableType')}</th>
                <th className="px-6 py-4">{t('admin.contactsPage.tablePhone')}</th>
                <th className="px-6 py-4">{t('admin.contactsPage.tableEmail')}</th>
                <th className="px-6 py-4 text-right">{t('admin.contactsPage.tableDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    {t('admin.contactsPage.loading')}
                  </td>
                </tr>
              )}

              {!isLoading && allContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    {t('admin.contactsPage.noContacts')}
                  </td>
                </tr>
              )}

              {!isLoading &&
                allContacts.map((c) => {
                  const icon =
                    c.kind === 'agent' ? (
                      <Building2 size={18} className="text-purple-600" />
                    ) : (
                      <User size={18} className="text-[var(--admin-primary)]" />
                    );

                  const typeLabel =
                    c.kind === 'agent'
                      ? t('admin.contactsPage.typeAgent')
                      : t('admin.contactsPage.typeClient');
                  const details =
                    c.kind === 'agent'
                      ? `${c.meta?.agentStatus ?? '—'}${c.meta?.agentType ? ` • ${c.meta.agentType}` : ''}`
                      : t('admin.contactsPage.detailsLeads', { count: c.meta?.leadCount ?? 1 });

                  return (
                    <tr key={`${c.kind}:${c.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate max-w-[280px]">
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            c.kind === 'agent'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-[var(--admin-background-secondary)] text-[var(--admin-text-secondary)] border-[var(--admin-border)]'
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.email || '—'}</td>
                      <td className="px-6 py-4 text-right text-sm font-mono text-slate-700">{details}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

