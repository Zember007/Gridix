import React, { useState } from 'react';
import { 
  Search,
  UserPlus,
  LogIn,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  X,
  Save,
  CheckSquare,
} from 'lucide-react';
import { usePartnerClients } from '@/hooks/usePartnerClients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '../ui/card';

export const PartnerClientsSection: React.FC = () => {
  const { clients, loading, error } = usePartnerClients();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeNoteClient, setActiveNoteClient] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Преобразуем реальных клиентов: показываем только на сопровождении (managed)
  const managedClients = clients.filter((c) => c.type === 'managed');

  // Реальный вход в аккаунт клиента (старый функционал impersonate)
  const handleImpersonate = async (clientId: string) => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'partner-program',
        {
          body: {
            action: 'impersonate',
            client_id: clientId,
          },
        },
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.redirect_url) {
        window.open(data.redirect_url as string, '_blank');
      }
    } catch (error) {
      console.error('Error impersonating client:', error);
      toast({
        title: t('partners.error'),
        description: t('partners.loginAsFailed'),
        variant: 'destructive',
      });
    }
  };

  // Реальная информация по статусу и сроку подписки
  const getSubscriptionInfo = (
    status?: string | null,
    expiresAt?: string | null,
  ) => {
    if (!status || status === 'none') {
      return {
        label: 'Нет активной подписки',
        daysLeft: null as number | null,
        color: 'bg-slate-300',
        textColor: 'text-slate-500',
        isExpired: false,
      };
    }

    const now = new Date();
    let daysLeft: number | null = null;

    if (expiresAt) {
      const end = new Date(expiresAt);
      daysLeft = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    if (
      status === 'expired' ||
      status === 'trial_expired' ||
      (daysLeft !== null && daysLeft < 0)
    ) {
      return {
        label: 'Истекла',
        daysLeft: 0,
        color: 'bg-slate-300',
        textColor: 'text-red-600',
        isExpired: true,
      };
    }

    if (daysLeft === null) {
      return {
        label: status === 'active' || status === 'trialing' ? 'Активна' : status,
        daysLeft: null,
        color: 'bg-green-500',
        textColor: 'text-green-600',
        isExpired: false,
      };
    }

    let color = 'bg-green-500';
    let textColor = 'text-green-600';

    if (daysLeft <= 5) {
      color = 'bg-red-500';
      textColor = 'text-red-600';
    } else if (daysLeft <= 15) {
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    }

    const label =
      daysLeft >= 0 ? `Осталось ${daysLeft} дн.` : 'Истекла';

    return {
      label,
      daysLeft: daysLeft < 0 ? 0 : daysLeft,
      color,
      textColor,
      isExpired: daysLeft < 0,
    };
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === managedClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(managedClients.map((c) => c.id)));
    }
  };

  const handleAddManagedClient = async () => {
    if (!newClientEmail.trim()) {
      toast({
        title: t('partners.error'),
        description: t('partners.clientEmail'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAddingClient(true);

      const {
        data: result,
        error,
      }: {
        data: { success: boolean; error?: string; invitation_link?: string } | null;
        error: { message?: string } | null;
      } = await supabase.functions.invoke(
        'partner-program',
        {
          body: {
            action: 'send_invitation',
            email: newClientEmail.trim(),
            invitation_type: 'managed',
          },
        },
      );

      if (error) {
        throw new Error(error.message || 'Ошибка отправки приглашения');
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Не удалось отправить приглашение');
      }

      toast({
        title: t('partners.invitationSent'),
        description: t('partners.invitationSentDesc', {
          email: newClientEmail.trim(),
          link: result.invitation_link ?? '',
        }),
      });

      setNewClientEmail('');
      setIsAddClientModalOpen(false);
    } catch (error) {
      console.error('Error adding managed client:', error);
      toast({
        title: t('partners.error'),
        description:
          error instanceof Error
            ? error.message
            : t('partners.invitationFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const openNoteModal = (clientId: string) => {
    setActiveNoteClient(clientId);
    setNoteText(notes[clientId] || '');
    setIsNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!activeNoteClient) return;
    setNotes((prev) => ({ ...prev, [activeNoteClient]: noteText }));
    setIsNoteModalOpen(false);
  };

  const totalSelectedAmount = managedClients
    .filter((c) => selectedIds.has(c.id))
    // пока берём фиксированную цену, так как реальные тарифы на стороне клиента
    .reduce((sum) => sum + 199, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Ошибка загрузки клиентов: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      {/* Модалка заметок */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Заметки о клиенте
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              className="w-full h-32 border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none mb-4"
              placeholder="Введите заметку (например: обещал оплатить в понедельник)..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Save size={16} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления клиента */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {t('partners.inviteNewClient')}
              </h3>
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              {t('partners.inviteNewClientDesc')}
            </p>

            <div className="space-y-3 mb-4">
              <label
                htmlFor="partner-client-email"
                className="text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                {t('partners.clientEmail')}
              </label>
              <input
                id="partner-client-email"
                type="email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder={t('partners.clientEmailPlaceholder')}
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg"
                disabled={isAddingClient}
              >
                {t('partners.cancel')}
              </button>
              <button
                onClick={handleAddManagedClient}
                disabled={isAddingClient}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2"
              >
                {isAddingClient ? t('partners.sending') : t('partners.sendInvitation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шапка секции */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Клиенты</h2>
            <p className="text-slate-500 text-sm mt-1">
              Управляйте клиентами на сопровождении (Интегратор)
            </p>
          </div>
          <button
            className="bg-[#1a1a1a] hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
            onClick={() => setIsAddClientModalOpen(true)}
          >
            <UserPlus size={18} />
            Добавить клиента
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 hover:bg-white focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-auto w-full">
            <select className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 hover:bg-white outline-none focus:border-blue-500 transition-colors">
              <option value="all">Все клиенты</option>
              <option value="active">Активная подписка</option>
              <option value="expired">Истекшие</option>
            </select>
            <button
              onClick={toggleAll}
              className={`p-2.5 rounded-lg border transition-colors ${
                selectedIds.size === clients.length
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              title="Выбрать всех"
            >
              <CheckSquare size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Список клиентов */}
      <div className="space-y-4">
        {managedClients.map((client) => {
          const sub = getSubscriptionInfo(
            client.subscription_status,
            client.subscription_expires_at,
          );
          const isExpired = sub.isExpired;
          const isUrgent =
            !isExpired && sub.daysLeft !== null && sub.daysLeft <= 5;
          const isSelected = selectedIds.has(client.id);
          const hasNote = !!notes[client.id];
          const widthPercent =
            sub.daysLeft !== null
              ? Math.max(5, Math.min(100, (sub.daysLeft / 30) * 100))
              : 0;

          const name = client.user_profiles.full_name || client.user_profiles.email;
          const email = client.user_profiles.email;

          return (
            <div
              key={client.id}
              className={`relative bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all ${
                isSelected
                  ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Чекбокс выбора */}
              <div
                className="absolute left-0 top-0 bottom-0 w-12 cursor-pointer z-10 flex items-center justify-center group/checkbox"
                onClick={() => toggleSelection(client.id)}
              >
                <div
                  className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300 bg-white group-hover/checkbox:border-blue-400'
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 size={14} className="text-white" />
                  )}
                </div>
              </div>

              <div className="pl-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Информация о клиенте */}
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      !isExpired ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {name}
                      {hasNote && (
                        <StickyNote
                          size={14}
                          className="text-amber-500 fill-amber-100"
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {email}
                    </div>
                  </div>
                </div>

                {/* Подписка */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Тариф
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-slate-800">
                        Сопровождение
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {client.status === 'active' ? 'Активен' : client.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Подписка
                      </span>
                      <span
                        className={`text-xs font-bold ${sub.textColor} ${
                          isUrgent ? 'animate-pulse' : ''
                        }`}
                      >
                      {sub.label}
                      </span>
                    </div>
                    {isExpired ? (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <AlertCircle size={14} />
                        <span className="text-xs font-bold">Требуется оплата</span>
                      </div>
                    ) : sub.daysLeft !== null ? (
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${sub.color}`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    ) : null}
                    {!isExpired && client.subscription_expires_at && (
                      <div className="text-[10px] text-slate-400 mt-1 text-right">
                        до{' '}
                        {new Date(
                          client.subscription_expires_at,
                        ).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0">
                  <button
                    onClick={() => openNoteModal(client.id)}
                    className={`p-2 rounded-lg transition-colors border ${
                      hasNote
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Заметки"
                  >
                    <StickyNote
                      size={18}
                      className={hasNote ? 'fill-amber-100' : ''}
                    />
                  </button>

                  {(isExpired || isUrgent) && (
                    <button
                      className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        isExpired
                          ? 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-md'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <CreditCard size={16} />
                      {isExpired ? 'Оплатить' : 'Продлить'}
                    </button>
                  )}

                  <button
                    onClick={() => handleImpersonate(client.client_id)}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <LogIn
                      size={16}
                      className="group-hover:text-blue-600 transition-colors"
                    />
                    Войти
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Плавающая панель массовых действий */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-2xl p-2 px-6 flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">
              Выбрано клиентов: {selectedIds.size}
            </span>
            <span className="text-sm font-bold">
              К оплате: ${totalSelectedAmount}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <button
            onClick={() =>
              alert(
                `Оплата за ${selectedIds.size} клиентов на сумму $${totalSelectedAmount}`,
              )
            }
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md flex items-center gap-2"
          >
            <CreditCard size={16} /> Оплатить выбранные
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start mt-8">
        <div className="text-blue-500 mt-0.5">💡</div>
        <div className="text-sm text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">Кабинет Интегратора</p>
          Вы можете выбрать несколько клиентов галочками и оплатить их подписки
          одним платежом с вашего партнерского счета. Комиссия (ваша скидка)
          будет учтена автоматически.
        </div>
      </div>
    </div>
  );
};


