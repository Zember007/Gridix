import { useState, useEffect, useRef } from "react";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { Button } from "@gridix/ui";
import { Card } from "@gridix/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import {
  Plus,
  X,
  Check,
  Loader2,
  ExternalLink,
  FileText,
  Download,
  Eye,
  AlertCircle,
  Edit,
} from "lucide-react";
import { toast } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Input } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Alert, AlertDescription } from "@gridix/ui";
import { Checkbox } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

interface Subscription {
  id: string;
  user_id: string;
  project_id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  current_period_start: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_requested_at: string | null;
  final_price: number | null;
  subscription_plans: {
    name: string;
    slug: string;
  };
  user_profiles: {
    email: string;
    full_name: string;
  };
  projects: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  user_id: string;
}

export function SubscriptionsManagement() {
  const { t, language } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<
    Array<{ id: string; name: string; base_price: number }>
  >([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states for creating subscription
  const [createForm, setCreateForm] = useState({
    userEmail: "",
    projectId: "",
    planId: "",
    durationMonths: 1,
    invoiceNumber: "",
    invoiceUrl: "",
  });

  // Form states for editing subscription
  const [editForm, setEditForm] = useState({
    planId: "",
    status: "active",
    durationMonths: 1,
    isInfinite: false,
    customEndDate: "",
  });

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }

    didInitRef.current = true;
    void fetchSubscriptions();
    void fetchPlans();
    void fetchProjects();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          subscription_plans (name, slug),
          projects!user_subscriptions_project_id_fkey (name)
        `,
        )
        .not("status", "eq", "migrated")
        .not("project_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      const rawSubscriptions = (data ?? []) as Array<
        Omit<Subscription, "user_profiles"> & { user_profiles?: unknown }
      >;

      const userIds = Array.from(
        new Set(rawSubscriptions.map((sub) => sub.user_id).filter(Boolean)),
      );

      const profilesById = new Map<string, Subscription["user_profiles"]>();

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        if (profilesError) {
          throw profilesError;
        }

        (profiles ?? []).forEach((profile) => {
          if (!profile?.id) return;
          profilesById.set(profile.id, {
            email: profile.email ?? "Unknown",
            full_name: profile.full_name ?? "Unknown",
          });
        });
      }

      const subscriptionsWithProfiles = rawSubscriptions.map(
        (subscription) => ({
          ...subscription,
          user_profiles: profilesById.get(subscription.user_id) ?? {
            email: "Unknown",
            full_name: "Unknown",
          },
        }),
      );

      setSubscriptions(subscriptionsWithProfiles as Subscription[]);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.loadSubscriptionsError",
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, user_id")
        .order("name");

      if (error) throw error;
      setProjects((data as Project[]) || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleCreateSubscription = async () => {
    if (!createForm.userEmail || !createForm.projectId || !createForm.planId) {
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.fillRequiredFields",
        ),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", createForm.userEmail)
        .single();

      if (userError || !userData) {
        throw new Error("User not found with this email");
      }

      // Verify project belongs to user
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", createForm.projectId)
        .eq("user_id", userData.id)
        .single();

      if (projectError || !projectData) {
        throw new Error("Project not found or does not belong to this user");
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + createForm.durationMonths);

      // Create subscription
      const { error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userData.id,
          project_id: createForm.projectId,
          plan_id: createForm.planId,
          status: "active",
          duration_months: createForm.durationMonths,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          invoice_number: createForm.invoiceNumber || null,
          invoice_url: createForm.invoiceUrl || null,
        });

      if (insertError) throw insertError;

      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.subscriptionCreated",
        ),
      });

      setCreateForm({
        userEmail: "",
        projectId: "",
        planId: "",
        durationMonths: 1,
        invoiceNumber: "",
        invoiceUrl: "",
      });
      setIsCreateDialogOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "admin.superadmin.subscriptionsManagement.toast.createSubscriptionError",
              ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateInvoice = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke(
        "subscription-management",
        {
          body: {
            action: "generate-invoice",
            subscription_id: subscriptionId,
          },
          headers: {
            Authorization: `Bearer ${(await fetchCurrentSession()).session?.access_token}`,
          },
        },
      );

      if (error) throw error;

      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.invoiceGenerated",
        ),
      });

      fetchSubscriptions();
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "admin.superadmin.subscriptionsManagement.toast.generateInvoiceError",
              ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateSubscription = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke(
        "subscription-management",
        {
          body: {
            action: "confirm-payment",
            subscription_id: subscriptionId,
          },
          headers: {
            Authorization: `Bearer ${(await fetchCurrentSession()).session?.access_token}`,
          },
        },
      );

      if (error) throw error;

      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.paymentConfirmed",
        ),
      });

      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error activating subscription:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "admin.superadmin.subscriptionsManagement.toast.activateSubscriptionError",
              ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.subscriptionCancelled",
        ),
      });

      fetchSubscriptions();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.cancelSubscriptionError",
        ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    // Заполняем форму текущими значениями
    const currentEndDate = subscription.current_period_end
      ? new Date(subscription.current_period_end).toISOString().split("T")[0]
      : "";

    // Проверяем, является ли подписка "бесконечной" (дата после 2090 года)
    const isInfinite = subscription.current_period_end
      ? new Date(subscription.current_period_end) > new Date("2090-01-01")
      : false;

    let durationMonths = 1;
    if (
      subscription.current_period_start &&
      subscription.current_period_end &&
      !isInfinite
    ) {
      const start = new Date(subscription.current_period_start);
      const end = new Date(subscription.current_period_end);
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      durationMonths = Math.max(1, months);
    }

    // Получаем plan_id из данных подписки
    const planId =
      ("plan_id" in subscription ? subscription.plan_id : "") || "";

    setEditForm({
      planId,
      status: subscription.status ?? "active",
      durationMonths,
      isInfinite,
      customEndDate: isInfinite ? "" : currentEndDate || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedSubscription) return;

    setIsProcessing(true);
    try {
      let endDate: string;

      if (editForm.isInfinite) {
        // Бесконечная подписка - устанавливаем дату на 2099 год
        endDate = new Date("2099-12-31T23:59:59.999Z").toISOString();
      } else if (editForm.customEndDate) {
        // Используем указанную дату
        endDate = new Date(
          editForm.customEndDate + "T23:59:59.999Z",
        ).toISOString();
      } else {
        // Вычисляем дату окончания на основе длительности
        const startDate = selectedSubscription.current_period_start
          ? new Date(selectedSubscription.current_period_start)
          : new Date();
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(
          calculatedEndDate.getMonth() + editForm.durationMonths,
        );
        endDate = calculatedEndDate.toISOString();
      }

      const updateData: {
        plan_id: string;
        status: string;
        current_period_end: string;
        duration_months: number;
        updated_at: string;
        current_period_start?: string;
      } = {
        plan_id: editForm.planId,
        status: editForm.status,
        current_period_end: endDate,
        duration_months: editForm.durationMonths,
        updated_at: new Date().toISOString(),
      };

      // Если устанавливаем статус active, обновляем current_period_start
      if (
        editForm.status === "active" &&
        !selectedSubscription.current_period_start
      ) {
        updateData.current_period_start = new Date().toISOString();
      }

      const { error } = await supabase
        .from("user_subscriptions")
        .update(updateData)
        .eq("id", selectedSubscription.id);

      if (error) throw error;

      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.subscriptionUpdated",
        ),
      });

      setIsEditDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: t("admin.superadmin.subscriptionsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.subscriptionsManagement.toast.updateSubscriptionError",
        ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            {t("admin.superadmin.subscriptionsManagement.status.active")}
          </Badge>
        );
      case "trialing":
      case "trial":
        return (
          <Badge className="bg-blue-500">
            {t("admin.superadmin.subscriptionsManagement.status.trial")}
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge className="bg-yellow-500">
            {t(
              "admin.superadmin.subscriptionsManagement.status.pendingPayment",
            )}
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            {t("admin.superadmin.subscriptionsManagement.status.expired")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline">
            {t("admin.superadmin.subscriptionsManagement.status.cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        {t("admin.superadmin.subscriptionsManagement.loading")}
      </div>
    );
  }

  const pendingSubscriptions = subscriptions.filter(
    (s) => s.status === "pending_payment",
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            {t("admin.superadmin.subscriptionsManagement.title")}
          </h2>
          {pendingSubscriptions.length > 0 && (
            <p className="mt-1 text-sm text-yellow-600">
              {t("admin.superadmin.subscriptionsManagement.pendingCount", {
                count: pendingSubscriptions.length,
              })}
            </p>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.superadmin.subscriptionsManagement.actions.create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t(
                  "admin.superadmin.subscriptionsManagement.dialogs.createTitle",
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.userEmail",
                  )}{" "}
                  *
                </Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={createForm.userEmail}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      userEmail: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.subscriptionsManagement.fields.project")}{" "}
                  *
                </Label>
                <Select
                  value={createForm.projectId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "admin.superadmin.subscriptionsManagement.placeholders.selectProject",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.subscriptionsManagement.fields.plan")} *
                </Label>
                <Select
                  value={createForm.planId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, planId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "admin.superadmin.subscriptionsManagement.placeholders.selectPlan",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {t(
                          "admin.superadmin.subscriptionsManagement.planOption",
                          {
                            name: plan.name,
                            price: plan.base_price,
                          },
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.durationMonths",
                  )}{" "}
                  *
                </Label>
                <Input
                  type="number"
                  placeholder="1"
                  min="1"
                  value={createForm.durationMonths}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      durationMonths: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label>
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.invoiceNumber",
                  )}
                </Label>
                <Input
                  placeholder="INV-12345"
                  value={createForm.invoiceNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.invoiceUrl",
                  )}
                </Label>
                <Input
                  placeholder="https://..."
                  value={createForm.invoiceUrl}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      invoiceUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateSubscription}
                disabled={isProcessing}
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("admin.superadmin.subscriptionsManagement.actions.create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("admin.superadmin.subscriptionsManagement.dialogs.editTitle")}
            </DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p>
                  <strong>
                    {t(
                      "admin.superadmin.subscriptionsManagement.dialogs.labels.user",
                    )}
                    :
                  </strong>{" "}
                  {selectedSubscription.user_profiles?.full_name} (
                  {selectedSubscription.user_profiles?.email})
                </p>
                <p>
                  <strong>
                    {t(
                      "admin.superadmin.subscriptionsManagement.dialogs.labels.project",
                    )}
                    :
                  </strong>{" "}
                  {selectedSubscription.projects?.name}
                </p>
                <p>
                  <strong>
                    {t(
                      "admin.superadmin.subscriptionsManagement.dialogs.labels.currentPlan",
                    )}
                    :
                  </strong>{" "}
                  {selectedSubscription.subscription_plans?.name}
                </p>
                <p>
                  <strong>
                    {t(
                      "admin.superadmin.subscriptionsManagement.dialogs.labels.currentStatus",
                    )}
                    :
                  </strong>{" "}
                  {selectedSubscription.status}
                </p>
                {selectedSubscription.current_period_end && (
                  <p>
                    <strong>
                      {t(
                        "admin.superadmin.subscriptionsManagement.dialogs.labels.endsAt",
                      )}
                      :
                    </strong>{" "}
                    {new Date(
                      selectedSubscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.tariffPlan",
                  )}{" "}
                  *
                </Label>
                <Select
                  value={editForm.planId}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, planId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "admin.superadmin.subscriptionsManagement.placeholders.selectPlan",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {t(
                          "admin.superadmin.subscriptionsManagement.planOption",
                          {
                            name: plan.name,
                            price: plan.base_price,
                          },
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {t("admin.superadmin.subscriptionsManagement.fields.status")}{" "}
                  *
                </Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.active",
                      )}
                    </SelectItem>
                    <SelectItem value="trialing">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.trialing",
                      )}
                    </SelectItem>
                    <SelectItem value="pending_payment">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.pendingPayment",
                      )}
                    </SelectItem>
                    <SelectItem value="expired">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.expired",
                      )}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.cancelled",
                      )}
                    </SelectItem>
                    <SelectItem value="trial_expired">
                      {t(
                        "admin.superadmin.subscriptionsManagement.status.trialExpired",
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isInfinite"
                  checked={editForm.isInfinite}
                  onCheckedChange={(checked) => {
                    setEditForm((prev) => ({
                      ...prev,
                      isInfinite: checked as boolean,
                      customEndDate: checked ? "" : prev.customEndDate,
                    }));
                  }}
                />
                <Label htmlFor="isInfinite" className="cursor-pointer">
                  {t(
                    "admin.superadmin.subscriptionsManagement.fields.infiniteSubscription",
                  )}
                </Label>
              </div>

              {!editForm.isInfinite && (
                <>
                  <div>
                    <Label>
                      {t(
                        "admin.superadmin.subscriptionsManagement.fields.durationMonths",
                      )}
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      min="1"
                      value={editForm.durationMonths}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          durationMonths: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        "admin.superadmin.subscriptionsManagement.hints.endDateAuto",
                      )}
                    </p>
                  </div>

                  <div>
                    <Label>
                      {t(
                        "admin.superadmin.subscriptionsManagement.fields.customEndDate",
                      )}
                    </Label>
                    <Input
                      type="date"
                      lang={language}
                      value={editForm.customEndDate}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customEndDate: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        "admin.superadmin.subscriptionsManagement.hints.customDateOverrides",
                      )}
                    </p>
                  </div>
                </>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t(
                    "admin.superadmin.subscriptionsManagement.hints.applyWarning",
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedSubscription(null);
                  }}
                  disabled={isProcessing}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSaveSubscription}
                  disabled={isProcessing || !editForm.planId}
                >
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t(
                    "admin.superadmin.subscriptionsManagement.actions.saveChanges",
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Requests */}
      {pendingSubscriptions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-950">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            {t(
              "admin.superadmin.subscriptionsManagement.pendingRequests.title",
            )}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.user",
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.project",
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.plan",
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.amount",
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.requestedAt",
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "admin.superadmin.subscriptionsManagement.pendingRequests.table.actions",
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubscriptions.map((sub) => {
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {sub.user_profiles?.full_name || "—"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sub.user_profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sub.projects?.name || "—"}</TableCell>
                    <TableCell>{sub.subscription_plans?.name}</TableCell>
                    <TableCell>${sub.final_price?.toFixed(2) || "—"}</TableCell>
                    <TableCell>
                      {sub.invoice_requested_at
                        ? new Date(
                            sub.invoice_requested_at,
                          ).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!sub.invoice_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInvoice(sub.id)}
                            disabled={isProcessing}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            {t(
                              "admin.superadmin.subscriptionsManagement.pendingRequests.actions.generatePdf",
                            )}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(sub.invoice_url!, "_blank")
                              }
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              {t(
                                "admin.superadmin.subscriptionsManagement.pendingRequests.actions.view",
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(sub.invoice_url!, "_blank")
                              }
                            >
                              <Download className="mr-1 h-4 w-4" />
                              {t(
                                "admin.superadmin.subscriptionsManagement.pendingRequests.actions.download",
                              )}
                            </Button>
                          </>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={!sub.invoice_url || isProcessing}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              {t(
                                "admin.superadmin.subscriptionsManagement.pendingRequests.actions.confirmPayment",
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t(
                                  "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.title",
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="rounded-lg bg-muted p-4">
                                <p>
                                  <strong>
                                    {t(
                                      "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.labels.project",
                                    )}
                                    :
                                  </strong>{" "}
                                  {sub.projects?.name}
                                </p>
                                <p>
                                  <strong>
                                    {t(
                                      "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.labels.user",
                                    )}
                                    :
                                  </strong>{" "}
                                  {sub.user_profiles?.full_name}
                                </p>
                                <p>
                                  <strong>
                                    {t(
                                      "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.labels.plan",
                                    )}
                                    :
                                  </strong>{" "}
                                  {sub.subscription_plans?.name}
                                </p>
                                <p>
                                  <strong>
                                    {t(
                                      "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.labels.amount",
                                    )}
                                    :
                                  </strong>{" "}
                                  {sub.final_price?.toFixed(2)} GEL
                                </p>
                                {sub.invoice_number && (
                                  <p>
                                    <strong>
                                      {t(
                                        "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.labels.invoiceNumber",
                                      )}
                                      :
                                    </strong>{" "}
                                    {sub.invoice_number}
                                  </p>
                                )}
                              </div>

                              {sub.invoice_url && (
                                <div className="rounded-lg border p-4">
                                  <p className="mb-2 font-medium">
                                    {t(
                                      "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.invoiceLabel",
                                    )}
                                    :
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(sub.invoice_url!, "_blank")
                                      }
                                    >
                                      <Eye className="mr-1 h-4 w-4" />
                                      {t(
                                        "admin.superadmin.subscriptionsManagement.pendingRequests.actions.viewPdf",
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(sub.invoice_url!, "_blank")
                                      }
                                    >
                                      <Download className="mr-1 h-4 w-4" />
                                      {t(
                                        "admin.superadmin.subscriptionsManagement.pendingRequests.actions.download",
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  {t(
                                    "admin.superadmin.subscriptionsManagement.pendingRequests.dialog.warning",
                                  )}
                                </AlertDescription>
                              </Alert>

                              <Button
                                onClick={() =>
                                  handleActivateSubscription(sub.id)
                                }
                                disabled={isProcessing}
                                className="w-full"
                              >
                                {isProcessing && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t(
                                  "admin.superadmin.subscriptionsManagement.pendingRequests.actions.confirmAndActivate",
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* All Subscriptions */}
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold">
          {t("admin.superadmin.subscriptionsManagement.allSubscriptions.title")}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.user",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.project",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.plan",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.status",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.endDate",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.invoice",
                )}
              </TableHead>
              <TableHead>
                {t(
                  "admin.superadmin.subscriptionsManagement.allSubscriptions.table.actions",
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {sub.user_profiles?.full_name || "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sub.user_profiles?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{sub.projects?.name || "—"}</TableCell>
                <TableCell>{sub.subscription_plans?.name}</TableCell>
                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                <TableCell>
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {sub.invoice_number ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{sub.invoice_number}</span>
                      {sub.invoice_url && (
                        <a
                          href={sub.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSubscription(sub)}
                      disabled={isProcessing}
                      title={t(
                        "admin.superadmin.subscriptionsManagement.actions.editTitle",
                      )}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      {t(
                        "admin.superadmin.subscriptionsManagement.actions.edit",
                      )}
                    </Button>
                    {sub.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelSubscription(sub.id)}
                        disabled={isProcessing}
                      >
                        <X className="mr-1 h-4 w-4" />
                        {t(
                          "admin.superadmin.subscriptionsManagement.actions.cancel",
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
