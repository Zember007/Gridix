import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import type { PartnerPayout } from "@gridix/partner-program";
import { useLanguage } from "@/contexts/LanguageContext";

interface PayoutWithPartner extends PartnerPayout {
  contact_info?: string;
  partner_profiles: {
    id: string;
    user_id: string;
    partner_code: string;
    user_profiles: {
      full_name: string;
      email: string;
    };
  };
}

export function PartnerPayoutsManagement() {
  const { t, language } = useLanguage();
  const [payouts, setPayouts] = useState<PayoutWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "paid" | "rejected"
  >("all");
  const [selectedPayout, setSelectedPayout] =
    useState<PayoutWithPartner | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [action, setAction] = useState<
    "approve" | "reject" | "mark_paid" | null
  >(null);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("partner_payouts")
        .select(
          `
          *,
          partner_profiles!partner_payouts_partner_id_fkey (
            id,
            user_id,
            partner_code,
            user_profiles!partner_profiles_user_id_fkey (
              full_name,
              email
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setPayouts((data as PayoutWithPartner[]) || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error(t("admin.superadmin.partnerPayouts.toast.loadPayoutsError"));
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async (
    payoutId: string,
    action: "approve" | "reject" | "mark_paid",
  ) => {
    try {
      setIsProcessing(true);

      let newStatus: string;
      switch (action) {
        case "approve":
          newStatus = "approved";
          break;
        case "reject":
          newStatus = "rejected";
          break;
        case "mark_paid":
          newStatus = "paid";
          break;
        default:
          throw new Error("Invalid action");
      }

      // Обновляем статус выплаты
      const { error } = await supabase
        .from("partner_payouts")
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", payoutId);

      if (error) {
        throw new Error(error.message);
      }

      // Если выплата отмечена как оплаченная, увеличиваем total_withdrawn у партнёра
      if (action === "mark_paid" && selectedPayout) {
        // Сначала получаем текущее значение total_withdrawn
        const { data: partnerData, error: fetchError } = await supabase
          .from("partner_profiles")
          .select("total_withdrawn")
          .eq("id", selectedPayout.partner_id)
          .single();

        if (fetchError) {
          console.error("Error fetching partner data:", fetchError);
        } else {
          // Обновляем total_withdrawn, добавляя сумму выплаты
          const newTotalWithdrawn =
            (partnerData.total_withdrawn || 0) + selectedPayout.amount;

          const { error: updateError } = await supabase
            .from("partner_profiles")
            .update({
              total_withdrawn: newTotalWithdrawn,
            })
            .eq("id", selectedPayout.partner_id);

          if (updateError) {
            console.error(
              "Error updating partner total_withdrawn:",
              updateError,
            );
            // Не прерываем выполнение, так как основное действие уже выполнено
          }
        }
      }

      toast.success(
        action === "approve"
          ? t("admin.superadmin.partnerPayouts.toast.payoutApproved")
          : action === "reject"
            ? t("admin.superadmin.partnerPayouts.toast.payoutRejected")
            : t("admin.superadmin.partnerPayouts.toast.payoutMarkedAsPaid"),
      );

      // Обновляем список
      await fetchPayouts();
      setIsActionDialogOpen(false);
      setSelectedPayout(null);
      setNotes("");
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.superadmin.partnerPayouts.toast.updatePayoutStatusError"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (
    payout: PayoutWithPartner,
    action: "approve" | "reject" | "mark_paid",
  ) => {
    setSelectedPayout(payout);
    setAction(action);
    setIsActionDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t("admin.superadmin.partnerPayouts.status.pending");
      case "approved":
        return t("admin.superadmin.partnerPayouts.status.approved");
      case "paid":
        return t("admin.superadmin.partnerPayouts.status.paid");
      case "rejected":
        return t("admin.superadmin.partnerPayouts.status.rejected");
      default:
        return t("admin.superadmin.partnerPayouts.status.unknown");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "paid":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.partner_profiles.user_profiles.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payout.partner_profiles.user_profiles.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payout.partner_profiles.partner_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === "all" || payout.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const totalPending = payouts.filter((p) => p.status === "pending").length;
  const totalPendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-gray-200"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("admin.superadmin.partnerPayouts.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.superadmin.partnerPayouts.description")}
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnerPayouts.stats.pendingReview")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnerPayouts.stats.pendingAmount", {
                amount: totalPendingAmount.toFixed(2),
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnerPayouts.status.approved")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter((p) => p.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnerPayouts.stats.waitingPayment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnerPayouts.status.paid")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter((p) => p.status === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnerPayouts.stats.completedPayouts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnerPayouts.status.rejected")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter((p) => p.status === "rejected").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnerPayouts.stats.rejectedRequests")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("admin.superadmin.partnerPayouts.filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">
                {t("admin.superadmin.partnerPayouts.filters.search")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t(
                    "admin.superadmin.partnerPayouts.filters.searchPlaceholder",
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                {t("admin.superadmin.partnerPayouts.filters.status")}
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(
                  value: "all" | "pending" | "approved" | "paid" | "rejected",
                ) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.superadmin.partnerPayouts.filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {t("admin.superadmin.partnerPayouts.status.pending")}
                  </SelectItem>
                  <SelectItem value="approved">
                    {t("admin.superadmin.partnerPayouts.status.approved")}
                  </SelectItem>
                  <SelectItem value="paid">
                    {t("admin.superadmin.partnerPayouts.status.paid")}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {t("admin.superadmin.partnerPayouts.status.rejected")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица выплат */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.superadmin.partnerPayouts.table.title")}
          </CardTitle>
          <CardDescription>
            {t("admin.superadmin.partnerPayouts.table.count", {
              filtered: filteredPayouts.length,
              total: payouts.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.partner")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.amount")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.status")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.paymentMethod")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.contactInfo")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.requestedAt")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnerPayouts.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {payout.partner_profiles.user_profiles.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.partner_profiles.user_profiles.email}
                      </p>
                      <Badge variant="outline" className="font-mono text-xs">
                        {payout.partner_profiles.partner_code}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold">
                      ${payout.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(payout.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payout.status)}
                        {getStatusText(payout.status)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payout.payment_method ||
                      t("admin.superadmin.partnerPayouts.emptyPaymentMethod")}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {payout.contact_info ? (
                        <div className="text-sm">
                          <p className="break-words">{payout.contact_info}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t(
                            "admin.superadmin.partnerPayouts.emptyContactInfo",
                          )}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(payout.requested_at).toLocaleDateString(
                      language === "ru" ? "ru-RU" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payout.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openActionDialog(payout, "approve")}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            {t(
                              "admin.superadmin.partnerPayouts.actions.approve",
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(payout, "reject")}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            {t(
                              "admin.superadmin.partnerPayouts.actions.reject",
                            )}
                          </Button>
                        </>
                      )}
                      {payout.status === "approved" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(payout, "mark_paid")}
                        >
                          <DollarSign className="mr-1 h-4 w-4" />
                          {t(
                            "admin.superadmin.partnerPayouts.actions.markPaid",
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог подтверждения действия */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve"
                ? t("admin.superadmin.partnerPayouts.dialog.approveTitle")
                : action === "reject"
                  ? t("admin.superadmin.partnerPayouts.dialog.rejectTitle")
                  : t("admin.superadmin.partnerPayouts.dialog.markPaidTitle")}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? t("admin.superadmin.partnerPayouts.dialog.approveDescription")
                : action === "reject"
                  ? t(
                      "admin.superadmin.partnerPayouts.dialog.rejectDescription",
                    )
                  : t(
                      "admin.superadmin.partnerPayouts.dialog.markPaidDescription",
                    )}
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">
                  {selectedPayout.partner_profiles.user_profiles.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayout.partner_profiles.user_profiles.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("admin.superadmin.partnerPayouts.dialog.codeLabel")}:{" "}
                  {selectedPayout.partner_profiles.partner_code}
                </p>
                <p className="text-lg font-bold">
                  {t("admin.superadmin.partnerPayouts.dialog.amountLabel")}: $
                  {selectedPayout.amount.toFixed(2)}
                </p>
                {selectedPayout.payment_method && (
                  <p className="text-sm">
                    {t("admin.superadmin.partnerPayouts.dialog.methodLabel")}:{" "}
                    {selectedPayout.payment_method}
                  </p>
                )}
                {selectedPayout.contact_info && (
                  <div className="mt-2 rounded border-l-4 border-blue-400 bg-blue-50 p-2">
                    <p className="text-sm font-medium text-blue-800">
                      {t(
                        "admin.superadmin.partnerPayouts.dialog.contactInfoLabel",
                      )}
                    </p>
                    <p className="break-words text-sm text-blue-700">
                      {selectedPayout.contact_info}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {t("admin.superadmin.partnerPayouts.dialog.noteLabel")}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={t(
                    "admin.superadmin.partnerPayouts.dialog.notePlaceholder",
                  )}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsActionDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant={action === "reject" ? "destructive" : "default"}
                  onClick={() =>
                    selectedPayout &&
                    handlePayoutAction(selectedPayout.id, action!)
                  }
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? t("admin.superadmin.partnerPayouts.dialog.processing")
                    : action === "approve"
                      ? t("admin.superadmin.partnerPayouts.actions.approve")
                      : action === "reject"
                        ? t("admin.superadmin.partnerPayouts.actions.reject")
                        : t("admin.superadmin.partnerPayouts.actions.markPaid")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
