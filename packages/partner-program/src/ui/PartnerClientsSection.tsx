import React, { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  LogIn,
  CheckCircle2,
  StickyNote,
  X,
  Save,
  CheckSquare,
} from "lucide-react";
import { usePartnerClients } from "../queries/usePartnerClients";
import { useToast } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";
import { Card, CardContent } from "@gridix/ui";
import { Input } from "@gridix/ui";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";

export const PartnerClientsSection: React.FC = () => {
  const { clients, loading, error } = usePartnerClients();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired"
  >("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeNoteClient, setActiveNoteClient] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Загружаем заметки из localStorage при монтировании
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("partner_client_notes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setNotes(parsed);
        }
      }
    } catch (err) {
      console.error(
        "Failed to load partner client notes from localStorage:",
        err,
      );
    }
  }, []);

  // Сохраняем заметки в localStorage при изменениях
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        "partner_client_notes",
        JSON.stringify(notes),
      );
    } catch (err) {
      console.error(
        "Failed to save partner client notes to localStorage:",
        err,
      );
    }
  }, [notes]);

  // Преобразуем реальных клиентов: показываем только на сопровождении (managed)
  const managedClients = clients.filter((c) => c.type === "managed");

  // Применяем поиск и фильтр статуса
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredClients = managedClients.filter((client) => {
    const name =
      client.user_profiles.full_name || client.user_profiles.email || "";
    const email = client.user_profiles.email || "";

    const matchesSearch =
      !normalizedSearch ||
      name.toLowerCase().includes(normalizedSearch) ||
      email.toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;

    const projects = client.projects ?? [];

    if (statusFilter === "active") {
      // активен, если есть хотя бы один активный/пробный проект
      const hasActiveProject = projects.some(
        (p) =>
          p.subscription_status === "active" ||
          p.subscription_status === "trialing",
      );
      const isAggregatedActive =
        client.subscription_status === "active" ||
        client.subscription_status === "trialing";

      return hasActiveProject || isAggregatedActive;
    }

    if (statusFilter === "expired") {
      // истекшие — если все проекты либо истекли, либо нет активных, и агрегированный статус об этом говорит
      const hasProjects = projects.length > 0;
      const allProjectsExpired =
        hasProjects &&
        projects.every(
          (p) =>
            p.subscription_status === "expired" ||
            p.subscription_status === "trial_expired",
        );

      const isAggregatedExpired =
        client.subscription_status === "expired" ||
        client.subscription_status === "trial_expired";

      return allProjectsExpired || (!hasProjects && isAggregatedExpired);
    }

    return true;
  });

  // Реальный вход в аккаунт клиента (старый функционал impersonate)
  const handleImpersonate = async (clientId: string) => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "impersonate",
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
        window.open(data.redirect_url as string, "_blank");
      }
    } catch (error) {
      console.error("Error impersonating client:", error);
      toast({
        title: t("partners.error"),
        description: t("partners.loginAsFailed"),
        variant: "destructive",
      });
    }
  };

  // Реальная информация по статусу и сроку подписки
  const getSubscriptionInfo = (
    status?: string | null,
    expiresAt?: string | null,
  ) => {
    if (!status || status === "none") {
      return {
        label: t("partners.noActiveSubscription"),
        daysLeft: null as number | null,
        color: "bg-slate-300",
        textColor: "text-slate-500",
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
      status === "expired" ||
      status === "trial_expired" ||
      (daysLeft !== null && daysLeft < 0)
    ) {
      return {
        label: t("partners.subscriptionExpired"),
        daysLeft: 0,
        color: "bg-slate-300",
        textColor: "text-red-600",
        isExpired: true,
      };
    }

    if (daysLeft === null) {
      return {
        label:
          status === "active" || status === "trialing"
            ? t("partners.subscriptionActive")
            : status,
        daysLeft: null,
        color: "bg-green-500",
        textColor: "text-green-600",
        isExpired: false,
      };
    }

    let color = "bg-green-500";
    let textColor = "text-green-600";

    if (daysLeft <= 5) {
      color = "bg-red-500";
      textColor = "text-red-600";
    } else if (daysLeft <= 15) {
      color = "bg-amber-500";
      textColor = "text-amber-600";
    }

    const label =
      daysLeft >= 0
        ? t("partners.subscriptionDaysLeft", { days: daysLeft })
        : t("partners.subscriptionExpired");

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
        title: t("partners.error"),
        description: t("partners.clientEmail"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingClient(true);

      const {
        data: result,
        error,
      }: {
        data: {
          success: boolean;
          error?: string;
          invitation_link?: string;
        } | null;
        error: { message?: string } | null;
      } = await supabase.functions.invoke("partner-program", {
        body: {
          action: "send_invitation",
          email: newClientEmail.trim(),
          invitation_type: "managed",
        },
      });

      if (error) {
        throw new Error(error.message || t("partners.invitationFailed"));
      }

      if (!result?.success) {
        throw new Error(result?.error || t("partners.invitationFailed"));
      }

      toast({
        title: t("partners.invitationSent"),
        description: t("partners.invitationSentDesc", {
          email: newClientEmail.trim(),
          link: result.invitation_link ?? "",
        }),
      });

      setNewClientEmail("");
      setIsAddClientModalOpen(false);
    } catch (error) {
      console.error("Error adding managed client:", error);
      toast({
        title: t("partners.error"),
        description:
          error instanceof Error
            ? error.message
            : t("partners.invitationFailed"),
        variant: "destructive",
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const openNoteModal = (clientId: string) => {
    setActiveNoteClient(clientId);
    setNoteText(notes[clientId] || "");
    setIsNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!activeNoteClient) return;
    setNotes((prev) => ({ ...prev, [activeNoteClient]: noteText }));
    setIsNoteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded bg-gray-200" />
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
            {t("partners.clientsLoadError", { error })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-in fade-in relative space-y-6 pb-20 duration-500">
      {/* Модалка заметок */}
      {isNoteModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {t("partners.notesTitle")}
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              className="mb-4 h-32 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
              placeholder={t("partners.notesPlaceholder")}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                {t("partners.cancel")}
              </button>
              <button
                onClick={saveNote}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Save size={16} /> {t("partners.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления клиента */}
      {isAddClientModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {t("partners.inviteNewClient")}
              </h3>
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-500">
              {t("partners.inviteNewClientDesc")}
            </p>

            <div className="mb-4 space-y-3">
              <label
                htmlFor="partner-client-email"
                className="text-xs font-medium tracking-wide text-slate-600 uppercase"
              >
                {t("partners.clientEmail")}
              </label>
              <input
                id="partner-client-email"
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={t("partners.clientEmailPlaceholder")}
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
                disabled={isAddingClient}
              >
                {t("partners.cancel")}
              </button>
              <button
                onClick={handleAddManagedClient}
                disabled={isAddingClient}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isAddingClient
                  ? t("partners.sending")
                  : t("partners.sendInvitation")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шапка секции */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className={"self-start"}>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("partners.clients")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("partners.managedClientsHint")}
            </p>
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-black hover:shadow-xl md:w-auto"
            onClick={() => setIsAddClientModalOpen(true)}
          >
            <UserPlus size={18} />
            {t("partners.addClient")}
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="text"
              placeholder={t("partners.searchPlaceholder")}
              className="w-full pr-4 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <ShadcnSelect
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | "active" | "expired")
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={t("partners.subscriptionFilterPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("partners.filterAllClients")}
                </SelectItem>
                <SelectItem value="active">
                  {t("partners.filterActive")}
                </SelectItem>
                <SelectItem value="expired">
                  {t("partners.filterExpired")}
                </SelectItem>
              </SelectContent>
            </ShadcnSelect>
            <button
              onClick={toggleAll}
              className={`rounded-lg border p-2.5 transition-colors ${
                selectedIds.size === clients.length
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-400 hover:bg-slate-50"
              }`}
              title={t("partners.selectAllTitle")}
            >
              <CheckSquare size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Список клиентов */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const sub = getSubscriptionInfo(
            client.subscription_status,
            client.subscription_expires_at,
          );
          const clientProjects = client.projects ?? [];
          const isExpired = sub.isExpired;
          const isSelected = selectedIds.has(client.id);
          const hasNote = !!notes[client.id];

          const name =
            client.user_profiles.full_name || client.user_profiles.email;
          const email = client.user_profiles.email;

          return (
            <div
              key={client.id}
              className={`relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                isSelected
                  ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
                  : "border-slate-200"
              }`}
            >
              {/* Чекбокс выбора */}
              <div
                className="group/checkbox absolute top-0 bottom-0 left-0 z-10 flex w-12 cursor-pointer items-center justify-center"
                onClick={() => toggleSelection(client.id)}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white group-hover/checkbox:border-blue-400"
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 size={14} className="text-white" />
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 md:pl-8 lg:flex-row lg:items-center">
                {/* Информация о клиенте */}
                <div className="flex flex-col items-center gap-4 md:min-w-[250px] md:flex-row">
                  <div
                    className={`flex h-12 min-h-12 w-12 min-w-12 items-center justify-center rounded-full text-lg font-bold text-white ${
                      !isExpired ? "bg-blue-600" : "bg-slate-400"
                    }`}
                  >
                    {name.charAt(0)}
                  </div>
                  <div className="max-w-full truncate">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="truncate">{name}</span>
                      {hasNote && (
                        <StickyNote
                          size={14}
                          className="fill-amber-100 text-amber-500"
                        />
                      )}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {email}
                    </div>
                  </div>
                </div>

                {/* Подписки по проектам */}
                <div className="grid flex-1 grid-cols-1 gap-6 border-t border-slate-100 pt-4 pl-8 sm:grid-cols-2 md:pl-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {t("partners.tariffLabel")}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {t("partners.tariffManaged")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {client.status === "active"
                          ? t("partners.statusActive")
                          : client.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Подробности по каждому проекту клиента — только «Проекты и подписки» */}
                    {clientProjects.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {t("partners.projectsAndSubscriptions")}
                        </div>
                        {clientProjects.slice(0, 3).map((project) => {
                          const projectSub = getSubscriptionInfo(
                            project.subscription_status,
                            project.subscription_expires_at,
                          );
                          const projectExpired = projectSub.isExpired;

                          return (
                            <div
                              key={project.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs"
                            >
                              <div className="truncate text-slate-700">
                                {project.name}
                              </div>
                              <div
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  projectExpired
                                    ? "bg-red-50 text-red-600"
                                    : projectSub.color.replace(
                                        "bg-",
                                        "bg-opacity-20 bg-",
                                      ) +
                                      " " +
                                      projectSub.textColor
                                }`}
                              >
                                {projectSub.label}
                              </div>
                            </div>
                          );
                        })}
                        {clientProjects.length > 3 && (
                          <div className="text-right text-[10px] text-slate-400">
                            {t("partners.moreProjects", {
                              count: clientProjects.length - 3,
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex w-full flex-col items-center gap-3 pt-4 sm:flex-row lg:w-auto lg:pt-0">
                  <button
                    onClick={() => openNoteModal(client.id)}
                    className={`rounded-lg border p-2 transition-colors ${
                      hasNote
                        ? "border-amber-200 bg-amber-50 text-amber-600"
                        : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    }`}
                    title={t("partners.notesTitle")}
                  >
                    <StickyNote
                      size={18}
                      className={hasNote ? "fill-amber-100" : ""}
                    />
                  </button>

                  <button
                    onClick={() => handleImpersonate(client.client_id)}
                    className="group flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
                  >
                    <LogIn
                      size={16}
                      className="transition-colors group-hover:text-blue-600"
                    />
                    {t("partners.loginAs")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="mt-0.5 text-blue-500">💡</div>
        <div className="text-sm leading-relaxed text-blue-800">
          <p className="mb-1 font-semibold">
            {t("partners.integratorCabinetTitle")}
          </p>
          <span>{t("partners.integratorCabinetText")}</span>
        </div>
      </div>
    </div>
  );
};
