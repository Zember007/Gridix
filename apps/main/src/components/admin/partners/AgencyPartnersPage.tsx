import React, { useState } from 'react';
import { Search, Building2, User, CheckCircle2, Clock, Link as LinkIcon, DollarSign, Handshake, LayoutList, ShieldCheck, MoreVertical, Ban } from 'lucide-react';
import { useAgencyPartners } from './useAgencyPartners';
import { PartnerInviteModal } from './PartnerInviteModal';
import { PartnerDrawer } from './PartnerDrawer';
import { AgencyGeneralConditions } from './AgencyGeneralConditions';
import { AgencyPartner } from './types';
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@gridix/ui";

export const AgencyPartnersPage: React.FC = () => {
    const { partners, filters, setFilters, approvePartner, updatePartnerStatus, updatePartnerCommission, markPaid, stats, loading } = useAgencyPartners();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<AgencyPartner | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'conditions'>('list');

    const handleAction = (partner: AgencyPartner, action: 'approve' | 'block') => {
        if (action === 'approve') {
            approvePartner(partner.id);
        } else if (action === 'block') {
            updatePartnerStatus(partner.id, partner.status === 'blocked' ? 'active' : 'blocked');
        }
    };

    const handlePartnerUpdate = (id: string, data: Partial<AgencyPartner>) => {
        if (data.commissionRate) updatePartnerCommission(id, data.commissionRate);
        if (data.status) {
            const nextStatus = data.status as AgencyPartner['status'];
            const current = selectedPartner?.id === id ? selectedPartner : null;
            if (nextStatus === 'active' && current?.status === 'pending') {
                approvePartner(id);
            } else {
                updatePartnerStatus(id, nextStatus);
            }
        }
    };

    return (
        <div className="flex flex-col ">
            <PartnerInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />

            <PartnerDrawer
                partner={selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onUpdate={handlePartnerUpdate}
                onPayout={(partner: AgencyPartner) => markPaid(partner.id)}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Агентская сеть</h1>
                    <p className="text-slate-500 text-sm mt-1">Управление внешними продажами и партнерами</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)] text-[var(--admin-text-on-primary)] font-bold h-11 px-6 shadow-sm flex items-center gap-2"
                    >
                        <LinkIcon size={18} /> Пригласить
                    </Button>
                </div>
            </div>

            <div className="flex gap-6 mt-6">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'list' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <LayoutList size={16} /> Список партнеров
                </button>
                <button
                    onClick={() => setActiveTab('conditions')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'conditions' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <ShieldCheck size={16} /> Условия сотрудничества
                </button>
            </div>

            <div className="flex flex-col gap-4 mt-6 flex-1">

                {activeTab === 'conditions' ? (
                    <AgencyGeneralConditions />
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Всего партнеров</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalPartners}</h3>
                                    </div>
                                    <div className="p-2 bg-[var(--admin-background-secondary)] text-[var(--admin-primary)] rounded-lg"><Handshake size={20} /></div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Заявки</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.pendingRequests}</h3>
                                    </div>
                                    <div className={`p-2 rounded-lg ${stats.pendingRequests > 0 ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}><Clock size={20} /></div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">К выплате</p>
                                        <h3 className="text-2xl font-black text-amber-600 mt-1">${stats.totalPendingCommission.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={20} /></div>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Объем продаж</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">${(stats.totalSalesVolume / 1000).toFixed(0)}k</h3>
                                    </div>
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        placeholder="Поиск по имени, телефону или email..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="pl-10 h-10 bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Партнер</th>
                                            <th className="px-6 py-4 text-center">Статус</th>
                                            <th className="px-6 py-4 text-center">Ставка (%)</th>
                                            <th className="px-6 py-4 text-right">Лиды / Сделки</th>
                                            <th className="px-6 py-4 text-right">К выплате</th>
                                            <th className="px-6 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {partners.map(partner => (
                                            <tr
                                                key={partner.id}
                                                onClick={() => setSelectedPartner(partner)}
                                                className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${partner.type === 'agency' ? 'bg-purple-100 text-purple-600' : 'bg-[var(--admin-background-secondary)] text-[var(--admin-primary)]'}`}>
                                                            {partner.type === 'agency' ? <Building2 size={18} /> : <User size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">{partner.name}</div>
                                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{partner.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${partner.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : partner.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {partner.status === 'active' ? 'Активен' : partner.status === 'pending' ? 'Новый' : 'Блок'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-sm border border-slate-200">
                                                        {partner.commissionRate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-sm">
                                                    <span className="text-slate-900 font-bold">{partner.stats.closedDeals}</span>
                                                    <span className="text-slate-400 ml-1">/ {partner.stats.totalLeads}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-mono font-bold ${partner.stats.commissionPending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        ${partner.stats.commissionPending.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            {partner.status === 'pending' && (
                                                                <DropdownMenuItem onClick={() => handleAction(partner, 'approve')} className="text-green-600 font-bold">
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Одобрить партнера
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => markPaid(partner.id)}>
                                                                <DollarSign className="mr-2 h-4 w-4" /> Отметить как выплачено
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAction(partner, 'block')} className="text-red-600">
                                                                <Ban className="mr-2 h-4 w-4" /> {partner.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                        {partners.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                                        <Users size={32} className="opacity-20" />
                                                        <p className="text-sm font-medium">Нет зарегистрированных партнеров</p>
                                                        <Button
                                                            variant="link"
                                                            onClick={() => setIsInviteModalOpen(true)}
                                                            className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)]"
                                                        >
                                                            Пригласить первого партнера
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const Users = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
