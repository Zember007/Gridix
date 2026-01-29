import { useEffect, useMemo, useState } from 'react';
import { AgencyPartner, PartnerFilter } from './types';
import { supabase } from "@gridix/utils/api";
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { Database } from '@gridix/types/database';

export function useAgencyPartners() {
    const [partners, setPartners] = useState<AgencyPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<PartnerFilter>({ search: '', status: 'all', type: 'all' });
    const { language } = useLanguage();
    const { user } = useAuth();
    const { activeWorkspaceId, isManagerMode } = useWorkspace();

    const developerId = isManagerMode ? activeWorkspaceId : (user?.id ?? null);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            if (!developerId) {
                setPartners([]);
                return;
            }

            const { data, error } = await supabase
                .from('agent_applications')
                .select('*')
                .eq('developer_user_id', developerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            type AgentApplicationRow = Database['public']['Tables']['agent_applications']['Row'];

            // Map DB rows to AgencyPartner type
            const rows: AgentApplicationRow[] = data ?? [];
            const mappedPartners: AgencyPartner[] = rows.map((item) => {
                const dbStatus = String(item.status || 'pending');
                const uiStatus: AgencyPartner['status'] =
                    dbStatus === 'approved' ? 'active' :
                        dbStatus === 'rejected' ? 'blocked' :
                            // fallback for unexpected values
                            'pending';

                return ({
                id: item.id,
                name: item.full_name,
                type: (item.type || 'individual') as 'agency' | 'individual',
                contactPerson: item.full_name,
                phone: item.phone,
                email: item.email,
                status: uiStatus,
                commissionRate: item.commission_rate || 4,
                source: 'website',
                joinedAt: item.created_at,
                agreementSigned: item.agreement_signed || false,
                    bankDetails:
                        typeof item.bank_details === 'object' && item.bank_details !== null
                            ? JSON.stringify(item.bank_details)
                            : item.bank_details !== null && item.bank_details !== undefined
                                ? String(item.bank_details)
                                : undefined,
                stats: {
                    totalLeads: 0,
                    activeDeals: 0,
                    closedDeals: 0,
                    totalRevenue: 0,
                    commissionPaid: 0,
                    commissionPending: 0
                }
            });
            });

            // Enrich stats: leads + commission (agent_payouts)
            const agentIds = mappedPartners.map((p) => p.id);
            const [leadsRes, payoutsRes] = await Promise.all([
                agentIds.length
                    ? supabase.from('leads').select('id, agent_id').in('agent_id', agentIds)
                    : Promise.resolve({ data: [], error: null } as any),
                agentIds.length
                    ? supabase.from('agent_payouts').select('agent_id, amount, status').in('agent_id', agentIds)
                    : Promise.resolve({ data: [], error: null } as any),
            ]);

            if (leadsRes.error) throw leadsRes.error;
            if (payoutsRes.error) throw payoutsRes.error;

            const leadCounts = new Map<string, number>();
            for (const row of (leadsRes.data ?? []) as Array<{ agent_id: string | null }>) {
                if (!row.agent_id) continue;
                leadCounts.set(row.agent_id, (leadCounts.get(row.agent_id) ?? 0) + 1);
            }

            const payoutAgg = new Map<string, { pending: number; paid: number }>();
            for (const row of (payoutsRes.data ?? []) as Array<{ agent_id: string | null; amount: number; status: string }>) {
                if (!row.agent_id) continue;
                const entry = payoutAgg.get(row.agent_id) ?? { pending: 0, paid: 0 };
                const amount = typeof row.amount === 'number' ? row.amount : 0;
                if (String(row.status) === 'paid') entry.paid += amount;
                else entry.pending += amount;
                payoutAgg.set(row.agent_id, entry);
            }

            setPartners(
                mappedPartners.map((p) => {
                    const leadCount = leadCounts.get(p.id) ?? 0;
                    const pa = payoutAgg.get(p.id) ?? { pending: 0, paid: 0 };
                    return {
                        ...p,
                        stats: {
                            ...p.stats,
                            totalLeads: leadCount,
                            commissionPending: Math.round(pa.pending * 100) / 100,
                            commissionPaid: Math.round(pa.paid * 100) / 100,
                        },
                    };
                }),
            );
        } catch (error: unknown) {
            console.error('Error fetching partners:', error);
            toast.error('Ошибка при загрузке партнеров');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [developerId]);

    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                p.phone.includes(filters.search) ||
                p.email.toLowerCase().includes(filters.search.toLowerCase());
            const matchesStatus = filters.status === 'all' || p.status === filters.status;
            const matchesType = filters.type === 'all' || p.type === filters.type;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [partners, filters]);

    const approvePartner = async (id: string) => {
        try {
            const siteUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: {
                    action: 'approve_application',
                    application_id: id,
                    lang: language,
                    site_url: siteUrl,
                },
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Approve failed');

            setPartners(prev => prev.map(p => (p.id === id ? { ...p, status: 'active' } : p)));
            toast.success('Партнёр активирован. Письмо отправлено.');
        } catch (error: unknown) {
            console.error('approvePartner error:', error);
            toast.error(error instanceof Error ? error.message : 'Ошибка при активации партнёра');
        }
    };

    const updatePartnerStatus = async (id: string, status: AgencyPartner['status']) => {
        try {
            const dbStatus =
                status === 'active' ? 'approved' :
                    status === 'blocked' ? 'rejected' :
                        'pending';

            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: {
                    action: 'update_application_status',
                    application_id: id,
                    status: dbStatus,
                },
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Status update failed');

            setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            toast.success('Статус обновлен');
        } catch (error: unknown) {
            console.error('updatePartnerStatus error:', error);
            toast.error('Ошибка при обновлении статуса');
        }
    };

    const updatePartnerCommission = async (id: string, rate: number) => {
        try {
            const { error } = await supabase
                .from('agent_applications')
                .update({ commission_rate: rate })
                .eq('id', id);

            if (error) throw error;

            setPartners(prev => prev.map(p => p.id === id ? { ...p, commissionRate: rate } : p));
            toast.success('Ставка обновлена');
        } catch (error: unknown) {
            toast.error('Ошибка при обновлении ставки');
        }
    };

    const markPaid = async (partnerId: string) => {
        try {
            const nowIso = new Date().toISOString();
            const { error } = await supabase
                .from('agent_payouts')
                .update({ status: 'paid', payout_date: nowIso })
                .eq('agent_id', partnerId)
                .eq('status', 'pending');

            if (error) throw error;

            toast.success('Отмечено как выплачено');
            fetchPartners(); // Refresh stats
        } catch (error: unknown) {
            toast.error('Ошибка при обновлении статуса выплат');
        }
    };

    const stats = useMemo(() => {
        return {
            totalPartners: partners.length,
            activePartners: partners.filter(p => p.status === 'active').length,
            totalSalesVolume: partners.reduce((acc, p) => acc + p.stats.totalRevenue, 0),
            pendingRequests: partners.filter(p => p.status === 'pending').length,
            totalPendingCommission: partners.reduce((acc, p) => acc + p.stats.commissionPending, 0)
        };
    }, [partners]);

    return {
        partners: filteredPartners,
        loading,
        filters,
        setFilters,
        approvePartner,
        updatePartnerStatus,
        updatePartnerCommission,
        markPaid,
        stats,
        refresh: fetchPartners
    };
}
