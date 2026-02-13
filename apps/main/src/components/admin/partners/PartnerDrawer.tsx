import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User, Phone, Mail, Clock, CheckCircle2, Ban, Search, FileText, AlertTriangle, Download } from 'lucide-react';
import { AgencyPartner } from './types';
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
    partner: AgencyPartner | null;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<AgencyPartner>) => void;
    onPayout: (partner: AgencyPartner) => void;
    developerId?: string | null;
}

type Tab = 'overview' | 'leads' | 'finance' | 'settings';

interface SignedContract {
    id: string;
    application_id: string;
    contract_template_path: string;
    signed_contract_path: string | null;
    signed_contract_mime: string | null;
    signed_at: string | null;
    template_lang: string | null;
    signed_download_url: string | null;
}

export const PartnerDrawer: React.FC<Props> = ({ partner, onClose, onUpdate, onPayout }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [leadsSearch, setLeadsSearch] = useState('');
    const [rejectionReasonDraft, setRejectionReasonDraft] = useState('');
    const partnerId = partner?.id ?? null;

    useEffect(() => {
        setRejectionReasonDraft(partner?.rejectionReason ?? '');
    }, [partnerId, partner?.rejectionReason]);

    const partnerLeadsQuery = useQuery({
        queryKey: ['partner_leads', partnerId],
        enabled: activeTab === 'leads' && !!partnerId,
        queryFn: async () => {
            if (!partnerId) return [];
            const { data, error } = await supabase
                .from('leads')
                .select(
                    `
          id,
          created_at,
          name,
          phone,
          email,
          status,
          pipeline_stage_id,
          projects ( name ),
          apartments ( apartment_number, area, price )
        `,
                )
                .eq('agent_id', partnerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data ?? [];
        },
    });

    const filteredPartnerLeads = useMemo(() => {
        const q = leadsSearch.trim().toLowerCase();
        const rows = partnerLeadsQuery.data ?? [];
        if (!q) return rows;
        return rows.filter((l) => {
            const n = String(l.name ?? '').toLowerCase();
            const p = String(l.phone ?? '').toLowerCase();
            const e = String(l.email ?? '').toLowerCase();
            const proj = String((l as Record<string, unknown>).projects && typeof (l as Record<string, unknown>).projects === 'object' ? ((l as Record<string, unknown>).projects as Record<string, unknown>)?.name ?? '' : '').toLowerCase();
            return n.includes(q) || p.includes(q) || e.includes(q) || proj.includes(q);
        });
    }, [leadsSearch, partnerLeadsQuery.data]);

    const applicationDetailsQuery = useQuery({
        queryKey: ['agent_application', partnerId],
        enabled: !!partnerId,
        queryFn: async () => {
            if (!partnerId) return null;
            const { data, error } = await supabase
                .from('agent_applications')
                .select('id, developer_user_id, agreement_signed, agreement_signed_at, signature_path, signature_method, commission_rate')
                .eq('id', partnerId)
                .single();
            if (error) throw error;
            return data as Record<string, unknown>;
        },
    });

    const signatureUrl = useMemo(() => {
        const path = applicationDetailsQuery.data?.signature_path;
        if (!path) return null;
        return supabase.storage.from('project-images').getPublicUrl(String(path)).data.publicUrl;
    }, [applicationDetailsQuery.data]);

    // Fetch signed contracts for this application
    const signedContractsQuery = useQuery({
        queryKey: ['signed_contracts', partnerId],
        enabled: activeTab === 'settings' && !!partnerId,
        queryFn: async () => {
            if (!partnerId) return [];
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: {
                    action: 'list_application_signed_contracts',
                    application_id: partnerId,
                },
            });
            if (error) throw error;
            return (data?.contracts ?? []) as SignedContract[];
        },
    });

    if (!partner) return null;

    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-amber-100 text-amber-700',
        needs_correction: 'bg-orange-100 text-orange-700',
        blocked: 'bg-red-100 text-red-700',
    };

    const StatusIcon = {
        active: CheckCircle2,
        pending: Clock,
        needs_correction: AlertTriangle,
        blocked: Ban,
    }[partner.status];

    const tabLabels: Record<Tab, string> = {
        overview: t('partners.drawer.tabOverview'),
        leads: t('partners.drawer.tabLeads'),
        finance: t('partners.drawer.tabFinance'),
        settings: t('partners.drawer.tabSettings'),
    };

    const statusLabel = t(`partners.drawer.status_${partner.status}`);
    const typeLabel = partner.type === 'agency'
        ? t('partners.drawer.typeAgency')
        : t('partners.drawer.typePrivateBroker');

    return (
        <>
            <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-sm ${partner.type === 'agency' ? 'bg-purple-100 text-purple-600' : 'bg-[var(--admin-background-secondary)] text-[var(--admin-text-primary)]'}`}>
                            {partner.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{partner.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColors[partner.status] ?? ''}`}>
                                    {StatusIcon && <StatusIcon size={12} />} {statusLabel}
                                </span>
                                <span className="text-sm text-slate-500">•</span>
                                <span className="text-sm text-slate-500 font-medium">{typeLabel}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    {(['overview', 'leads', 'finance', 'settings'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t('partners.drawer.sales')}</div>
                                    <div className="text-2xl font-black text-slate-900 font-mono">${(partner.stats.totalRevenue / 1000).toFixed(0)}k</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t('partners.drawer.deals')}</div>
                                    <div className="text-2xl font-black text-slate-900 font-mono">{partner.stats.closedDeals} / {partner.stats.activeDeals}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t('partners.drawer.balance')}</div>
                                    <div className="text-2xl font-black text-amber-600 font-mono">${partner.stats.commissionPending.toLocaleString()}</div>
                                </div>
                            </div>

                            {partner.status === 'needs_correction' && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-orange-700 mt-0.5">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-orange-900">{t('partners.drawer.needsCorrection')}</div>
                                            <div className="text-xs text-orange-800 mt-1 whitespace-pre-wrap">
                                                {partner.rejectionReason ? partner.rejectionReason : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h3 className="font-bold text-slate-900 mb-4">{t('partners.drawer.contactsAndDetails')}</h3>
                                <div className="grid grid-cols-2 gap-y-4 text-sm text-center">
                                    <div>
                                        <div className="text-slate-500 text-xs mb-0.5">{t('partners.drawer.contactPerson')}</div>
                                        <div className="font-medium flex items-center justify-center gap-2"><User size={14} /> {partner.contactPerson}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-0.5">{t('partners.drawer.phone')}</div>
                                        <div className="font-medium flex items-center justify-center gap-2"><Phone size={14} /> {partner.phone}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-0.5">{t('partners.drawer.email')}</div>
                                        <div className="font-medium flex items-center justify-center gap-2"><Mail size={14} /> {partner.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-0.5">{t('partners.drawer.registrationDate')}</div>
                                        <div className="font-medium flex items-center justify-center gap-2"><Clock size={14} /> {new Date(partner.joinedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-slate-100 mt-2">
                                        <div className="text-slate-500 text-xs mb-1">{t('partners.drawer.bankDetails')}</div>
                                        <div className="font-mono bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-700">
                                            {partner.bankDetails?.details  || t('partners.drawer.noBankDetails')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'leads' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{t('partners.drawer.partnerLeads')}</div>
                                        <div className="text-xs text-slate-500">
                                            {t('partners.drawer.totalLeads')}: <span className="font-mono font-bold text-slate-700">{(partnerLeadsQuery.data ?? []).length}</span>
                                        </div>
                                    </div>
                                    <div className="relative w-full md:max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input
                                            placeholder={t('partners.drawer.searchLeadsPlaceholder')}
                                            value={leadsSearch}
                                            onChange={(e) => setLeadsSearch(e.target.value)}
                                            className="pl-10 h-10 bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">{t('partners.drawer.thClient')}</th>
                                                <th className="px-6 py-4">{t('partners.drawer.thProject')}</th>
                                                <th className="px-6 py-4">{t('partners.drawer.thApartment')}</th>
                                                <th className="px-6 py-4">{t('partners.drawer.thStatus')}</th>
                                                <th className="px-6 py-4 text-right">{t('partners.drawer.thDate')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {partnerLeadsQuery.isLoading && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                                        {t('partners.drawer.loadingLeads')}
                                                    </td>
                                                </tr>
                                            )}

                                            {!partnerLeadsQuery.isLoading && filteredPartnerLeads.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                                        {t('partners.drawer.noLeadsFound')}
                                                    </td>
                                                </tr>
                                            )}

                                            {!partnerLeadsQuery.isLoading &&
                                                filteredPartnerLeads.map((l) => {
                                                    const rec = l as Record<string, unknown>;
                                                    const projectObj = rec.projects && typeof rec.projects === 'object' ? (rec.projects as Record<string, unknown>) : null;
                                                    const projectName = String(projectObj?.name ?? '—');
                                                    const apt = rec.apartments && typeof rec.apartments === 'object' ? (rec.apartments as Record<string, unknown>) : null;
                                                    const apartmentLabel =
                                                        apt?.apartment_number
                                                            ? `#${String(apt.apartment_number)}${apt?.area ? ` (${String(apt.area)} m²)` : ''}`
                                                            : '—';
                                                    const status = (l.pipeline_stage_id ?? l.status ?? '—') as string;
                                                    const date = l.created_at ? new Date(l.created_at).toLocaleDateString() : '—';

                                                    return (
                                                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-slate-900 text-sm truncate max-w-[240px]">
                                                                        {l.name || t('partners.drawer.noName')}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Phone size={12} className="text-slate-400" /> {l.phone || '—'}
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Mail size={12} className="text-slate-400" /> {l.email || '—'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-700">{projectName}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-700">{apartmentLabel}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-50 text-slate-700 border-slate-200">
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-mono text-slate-700">{date}</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{t('partners.drawer.commission')}</div>
                                    <div className="text-xs text-slate-500">{t('partners.drawer.commissionResetHint')}</div>
                                </div>
                                <Button
                                    onClick={() => onPayout(partner)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 shadow-sm transition-colors"
                                >
                                    {t('partners.drawer.markAsPaid')}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t('partners.drawer.pendingPayout')}</div>
                                    <div className="text-2xl font-black text-amber-600 font-mono">
                                        ${partner.stats.commissionPending.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t('partners.drawer.paidOut')}</div>
                                    <div className="text-2xl font-black text-slate-900 font-mono">
                                        ${partner.stats.commissionPaid.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3">{t('partners.drawer.applicationReview')}</h4>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <Button
                                        onClick={() => onUpdate(partner.id, { status: 'active' })}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    >
                                        <CheckCircle2 size={16} /> {t('partners.drawer.activate')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => onUpdate(partner.id, { status: 'pending', rejectionReason: undefined })}
                                        className="font-bold"
                                    >
                                        <Clock size={16} /> {t('partners.drawer.returnToPending')}
                                    </Button>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        {t('partners.drawer.correctionReasonLabel')}
                                    </label>
                                    <textarea
                                        value={rejectionReasonDraft}
                                        onChange={(e) => setRejectionReasonDraft(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/20"
                                        placeholder={t('partners.drawer.correctionReasonPlaceholder')}
                                    />
                                    <div className="mt-2 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                onUpdate(partner.id, {
                                                    status: 'needs_correction',
                                                    rejectionReason: rejectionReasonDraft,
                                                })
                                            }
                                            className="font-bold"
                                        >
                                            <AlertTriangle size={16} /> {t('partners.drawer.sendForCorrection')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        {/*     <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{t('partners.drawer.commissionRateLabel')}</label>
                                <div className="flex gap-2">
                                    {[3, 4, 5, 6].map(rate => (
                                        <button
                                            key={rate}
                                            onClick={() => onUpdate(partner.id, { commissionRate: rate })}
                                            className={`w-10 h-10 rounded-lg font-bold transition-all ${partner.commissionRate === rate ? 'bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {rate}
                                        </button>
                                    ))}
                                </div>
                            </div> */}

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 mb-4">{t('partners.drawer.agentManagement')}</h4>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            onUpdate(partner.id, {
                                                status: partner.status === 'blocked' ? 'pending' : 'blocked',
                                                rejectionReason: partner.status === 'blocked' ? undefined : partner.rejectionReason,
                                            })
                                        }
                                        className="font-bold flex items-center gap-2"
                                    >
                                        <Ban size={16} /> {partner.status === 'blocked' ? t('partners.drawer.unblock') : t('partners.drawer.block')}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 mb-2">{t('partners.drawer.projectAccess')}</h4>
                                <div className="text-sm text-slate-600">
                                    {t('partners.drawer.projectAccessDescription')}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <h4 className="text-sm font-bold text-slate-900">{t('partners.drawer.signatureAndContract')}</h4>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${partner.agreementSigned ? 'bg-[var(--admin-background-secondary)] text-[var(--admin-primary)]' : 'bg-slate-100 text-slate-400'}`}>
                                        <FileText size={18} />
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-bold text-slate-900">
                                            {partner.agreementSigned ? t('partners.drawer.contractAccepted') : t('partners.drawer.contractNotAccepted')}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {applicationDetailsQuery.data?.agreement_signed_at
                                                ? `${t('partners.drawer.dateLabel')}: ${new Date(String(applicationDetailsQuery.data.agreement_signed_at)).toLocaleString()}`
                                                : '—'}
                                        </div>
                                    </div>
                                </div>
                                {signatureUrl ? (
                                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <div className="text-xs text-slate-500 mb-2">{t('partners.drawer.signature')}</div>
                                        <img src={signatureUrl} alt="Signature" className="max-h-32 w-auto" />
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500">{t('partners.drawer.noSignature')}</div>
                                )}
                            </div>

                            {/* Signed contracts section */}
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <h4 className="text-sm font-bold text-slate-900">{t('partners.drawer.signedContracts')}</h4>
                                {signedContractsQuery.isLoading && (
                                    <div className="text-xs text-slate-500">{t('partners.drawer.loadingContracts')}</div>
                                )}
                                {!signedContractsQuery.isLoading && (signedContractsQuery.data ?? []).length === 0 && (
                                    <div className="text-xs text-slate-500">{t('partners.drawer.noSignedContracts')}</div>
                                )}
                                {!signedContractsQuery.isLoading && (signedContractsQuery.data ?? []).map((sc, idx) => {
                                    const signedDate = sc.signed_at ? new Date(sc.signed_at).toLocaleString() : '—';
                                    const lang = sc.template_lang ? sc.template_lang.toUpperCase() : null;
                                    const isPdf = sc.signed_contract_mime === 'application/pdf';
                                    const label = lang
                                        ? `${t('partners.drawer.contract')} (${lang})`
                                        : `${t('partners.drawer.contract')} ${idx + 1}`;

                                    console.log(sc);
                                    const signed_download_url = sc.signed_download_url ?? sc.signed_contract_path;
                                    return (
                                        <div key={sc.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                                            <div className="p-2 rounded-lg bg-[var(--admin-background-secondary)] text-[var(--admin-primary)]">
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-slate-900 truncate">{label}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                        {isPdf ? 'PDF' : 'DOCX'}
                                                    </span>
                                                    {signedDate}
                                                </div>
                                            </div>
                                            {signed_download_url && (
                                                <a
                                                    href={signed_download_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 rounded-lg text-[var(--admin-primary)] hover:bg-[var(--admin-background-secondary)] transition-colors"
                                                    title={t('partners.drawer.downloadContract')}
                                                >
                                                    <Download size={16} />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
