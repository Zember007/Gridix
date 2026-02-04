import React, { useMemo, useState } from 'react';
import { Search, Link as LinkIcon, Handshake, ShieldCheck, LayoutList, Users, DollarSign, TrendingUp, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useAgencyPartners } from './useAgencyPartners';
import { PartnerInviteModal } from './PartnerInviteModal';
import { PartnerDrawer } from './PartnerDrawer';
import { PartnerPayoutModal } from './PartnerPayoutModal';
import { AgencyGeneralConditions } from './AgencyGeneralConditions';
import { PartnerFiltersPanel } from './PartnerFiltersPanel';
import { AgencyPartner } from './types';
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Popover, PopoverTrigger } from "@gridix/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@gridix/ui";
import { UserAvatar } from '@/components/admin/UserAvatar';
import { useLanguage } from '@/contexts/LanguageContext';

export const AgencyPartnersPage: React.FC = () => {
    const { t } = useLanguage();
    const { partners, filters, setFilters, approvePartner, updatePartnerStatus, updatePartnerCommission, markPaid, stats, loading, developerId } = useAgencyPartners();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<AgencyPartner | null>(null);
    const [payoutTarget, setPayoutTarget] = useState<AgencyPartner | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'conditions'>('list');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    const handleStatusFilterCycle = () => {
        const cycle: Array<NonNullable<typeof filters.status>> = ['all', 'pending', 'needs_correction', 'active', 'blocked'];
        const current = (filters.status ?? 'all') as NonNullable<typeof filters.status>;
        const currentIndex = cycle.indexOf(current);
        const next = cycle[(currentIndex + 1) % cycle.length] ?? 'all';
        setFilters((prev) => ({ ...prev, status: next }));
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles =
            {
                active: 'bg-green-50 text-green-700 ring-green-600/20',
                pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
                blocked: 'bg-red-50 text-red-700 ring-red-600/20',
                needs_correction: 'bg-orange-50 text-orange-700 ring-orange-600/20',
            }[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20';
        const label =
            status === 'active'
                ? t('partners.status.active')
                : status === 'pending'
                    ? t('partners.status.pending')
                    : status === 'needs_correction'
                        ? t('partners.status.needsCorrection')
                        : status === 'blocked'
                            ? t('partners.status.blocked')
                            : status;
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${styles}`}>
                {label}
            </span>
        );
    };

    const activeFiltersCount = useMemo(() => {
        return [
            filters.status !== 'all',
            filters.type !== 'all',
            typeof filters.minCommission === 'number',
            typeof filters.maxCommission === 'number',
            Boolean(filters.dateFrom),
            Boolean(filters.dateTo),
        ].filter(Boolean).length;
    }, [filters]);

    const handlePartnerUpdate = (id: string, data: Partial<AgencyPartner>) => {
        if (data.commissionRate) updatePartnerCommission(id, data.commissionRate);
        if (data.status) {
            const nextStatus = data.status as AgencyPartner['status'];
            const current = selectedPartner?.id === id ? selectedPartner : null;
            if (nextStatus === 'active' && (current?.status === 'pending' || current?.status === 'needs_correction')) {
                approvePartner(id);
            } else {
                updatePartnerStatus(
                    id,
                    nextStatus,
                    nextStatus === 'needs_correction' ? data.rejectionReason : undefined,
                );
            }
        }
    };

    return (
        <div className="flex flex-col">
            <PartnerInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            <PartnerPayoutModal
                isOpen={!!payoutTarget}
                onClose={() => setPayoutTarget(null)}
                partner={payoutTarget}
                onPayout={async (_amount) => {
                    // MVP: we mark all pending payouts as paid (existing behavior)
                    if (!payoutTarget) return;
                    await markPaid(payoutTarget.id);
                }}
            />

            <PartnerDrawer
                partner={selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onUpdate={handlePartnerUpdate}
                onPayout={(partner: AgencyPartner) => {
                    setSelectedPartner(null);
                    setPayoutTarget(partner);
                }}
                developerId={developerId}
            />

            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('partners.title')}</h1>
                        <p className="text-slate-500 text-sm mt-1">{t('partners.subtitle')}</p>
                    </div>

                    {activeTab === 'list' ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full md:w-[340px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    placeholder={t('partners.searchPlaceholder')}
                                    value={filters.search}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                    className="pl-10 h-10 bg-white border-slate-200"
                                />
                            </div>

                            <Popover open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="font-bold flex items-center gap-2">
                                        <Filter size={16} />
                                        {t('partners.filters')}
                                        {activeFiltersCount > 0 ? (
                                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)]">
                                                {activeFiltersCount}
                                            </span>
                                        ) : null}
                                    </Button>
                                </PopoverTrigger>
                                <PartnerFiltersPanel
                                    filters={filters}
                                    setFilters={setFilters}
                                    onClose={() => setIsFilterPanelOpen(false)}
                                />
                            </Popover>

                            <Button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)] text-[var(--admin-text-on-primary)] font-bold h-10 px-4 shadow-sm flex items-center gap-2"
                            >
                                <LinkIcon size={18} /> {t('partners.invite')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)] text-[var(--admin-text-on-primary)] font-bold h-10 px-4 shadow-sm flex items-center gap-2"
                            >
                                <LinkIcon size={18} /> {t('partners.invite')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className=" bg-white border-b border-slate-200 sticky top-[72px] z-10 mt-6">
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => {
                            setActiveTab('list');
                            setFilters((f) => ({ ...f, status: 'all' }));
                        }}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'list' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <LayoutList size={16} /> {t('partners.tabs.list')}
                        {stats.pendingRequests > 0 && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilters((prev) => ({ ...prev, status: prev.status === 'pending' ? 'all' : 'pending' }));
                                    setActiveTab('list');
                                }}
                                className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform ${filters.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}
                                title={t('partners.showPendingOnly')}
                            >
                                {stats.pendingRequests}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('conditions')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'conditions' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <ShieldCheck size={16} /> {t('partners.tabs.conditions')}
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <div className="py-6">

                    {activeTab === 'list' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 text-[var(--admin-primary)] rounded-lg"><Users size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{t('partners.stats.totalPartners')}</p>
                                        <p className="text-xl font-bold text-slate-900">{stats.totalPartners}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Handshake size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{t('partners.stats.active')}</p>
                                        <p className="text-xl font-bold text-slate-900">{stats.activePartners}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{t('partners.stats.salesVolume')}</p>
                                        <p className="text-xl font-bold text-slate-900">${(stats.totalSalesVolume / 1000000).toFixed(1)}M</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{t('partners.stats.pendingPayout')}</p>
                                        <p className="text-xl font-bold text-slate-900">${stats.totalPendingCommission.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {partners.length > 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4">{t('partners.table.agent')}</th>
                                                    <th
                                                        className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                                        onClick={handleStatusFilterCycle}
                                                        title={t('partners.clickToFilter')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {t('partners.table.status')}
                                                            <ArrowUpDown
                                                                size={12}
                                                                className={`text-slate-400 ${filters.status !== 'all' ? 'text-[var(--admin-primary)]' : 'opacity-0 group-hover:opacity-100'}`}
                                                            />
                                                            {filters.status !== 'all' && (
                                                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 rounded">
                                                                    {String(filters.status).slice(0, 3)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-center">{t('partners.table.rate')}</th>
                                                    <th className="px-6 py-4 text-right">{t('partners.table.leads')}</th>
                                                    <th className="px-6 py-4 text-right">{t('partners.table.balance')}</th>
                                                    <th className="px-6 py-4 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {partners.map((p) => (
                                                    <tr
                                                        key={p.id}
                                                        onClick={() => setSelectedPartner(p)}
                                                        className="hover:bg-slate-50 cursor-pointer group transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar name={p.name} className="w-9 h-9 text-xs" />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-slate-900 group-hover:text-[var(--admin-primary)] transition-colors truncate">
                                                                        {p.name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 truncate">{p.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={p.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono font-bold text-xs">
                                                                {p.commissionRate}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-medium text-slate-900">{p.stats.totalLeads}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-mono font-bold text-slate-900">${p.stats.commissionPending.toLocaleString()}</div>
                                                            <div className="text-[10px] text-slate-400">{t('partners.table.accrued')}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                                                        <span className="sr-only">Actions</span>
                                                                        <MoreHorizontal className="size-5" aria-hidden />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    {(p.status === 'pending' || p.status === 'needs_correction') && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => approvePartner(p.id)}
                                                                            className="text-green-600 font-bold"
                                                                        >
                                                                            {t('partners.actions.approve')}
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem onClick={() => { setPayoutTarget(p); }}>
                                                                        {t('partners.actions.payout')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => updatePartnerStatus(p.id, p.status === 'blocked' ? 'pending' : 'blocked')}
                                                                        className="text-red-600"
                                                                    >
                                                                        {p.status === 'blocked' ? t('partners.actions.unblock') : t('partners.actions.block')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500">{t('partners.noPartners')}</div>
                            )}
                        </>
                    )}

                    {activeTab === 'conditions' && <AgencyGeneralConditions />}
                </div>
            </div>
        </div>
    );
};
