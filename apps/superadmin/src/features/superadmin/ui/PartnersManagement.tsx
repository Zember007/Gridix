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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import {
  Handshake,
  Search,
  Filter,
  UserCheck,
  UserX,
  DollarSign,
} from "lucide-react";
import { useToast } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";

interface PartnerWithUser {
  id: string;
  user_id: string;
  partner_code: string;
  total_earned: number;
  total_withdrawn: number;
  status: "active" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function PartnersManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended" | "inactive"
  >("all");
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerWithUser | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "activate" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);

      const { data, error: functionError } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "admin_manage",
            admin_action: "list",
          },
        },
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPartners(data.partners || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast({
        title: t("admin.superadmin.partnersManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.partnersManagement.toast.loadPartnersError",
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePartnerAction = async (
    partnerId: string,
    action: "suspend" | "activate",
  ) => {
    try {
      setIsProcessing(true);

      const { data, error: functionError } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "admin_manage",
            admin_action: action,
            partner_id: partnerId,
          },
        },
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: t("admin.superadmin.partnersManagement.toast.successTitle"),
        description:
          action === "suspend"
            ? t("admin.superadmin.partnersManagement.toast.partnerSuspended")
            : t("admin.superadmin.partnersManagement.toast.partnerActivated"),
      });

      // Обновляем список
      await fetchPartners();
      setIsActionDialogOpen(false);
      setSelectedPartner(null);
    } catch (error) {
      console.error("Error updating partner:", error);
      toast({
        title: t("admin.superadmin.partnersManagement.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "admin.superadmin.partnersManagement.toast.updatePartnerStatusError",
              ),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (
    partner: PartnerWithUser,
    action: "suspend" | "activate",
  ) => {
    setSelectedPartner(partner);
    setAction(action);
    setIsActionDialogOpen(true);
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.user_profiles.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      partner.user_profiles.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      partner.partner_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === "all" || partner.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

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
            {t("admin.superadmin.partnersManagement.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.superadmin.partnersManagement.description")}
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnersManagement.stats.totalPartners")}
            </CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnersManagement.stats.activeCount", {
                count: partners.filter((p) => p.status === "active").length,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnersManagement.stats.totalEarnings")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${partners.reduce((sum, p) => sum + p.total_earned, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnersManagement.stats.earnedByPartners")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnersManagement.stats.paidOut")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {partners
                .reduce((sum, p) => sum + p.total_withdrawn, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "admin.superadmin.partnersManagement.stats.withdrawnByPartners",
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.superadmin.partnersManagement.stats.suspended")}
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter((p) => p.status === "suspended").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.superadmin.partnersManagement.stats.inactivePartners")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("admin.superadmin.partnersManagement.filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">
                {t("admin.superadmin.partnersManagement.filters.search")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t(
                    "admin.superadmin.partnersManagement.filters.searchPlaceholder",
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                {t("admin.superadmin.partnersManagement.filters.status")}
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(
                  value: "all" | "active" | "suspended" | "inactive",
                ) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t(
                      "admin.superadmin.partnersManagement.filters.allStatuses",
                    )}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("admin.superadmin.partnersManagement.status.active")}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {t("admin.superadmin.partnersManagement.status.suspended")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("admin.superadmin.partnersManagement.status.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица партнёров */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.superadmin.partnersManagement.table.title")}
          </CardTitle>
          <CardDescription>
            {t("admin.superadmin.partnersManagement.table.count", {
              filtered: filteredPartners.length,
              total: partners.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.partner")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.code")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.status")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.earned")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.withdrawn")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.registeredAt")}
                </TableHead>
                <TableHead>
                  {t("admin.superadmin.partnersManagement.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {partner.user_profiles.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {partner.user_profiles.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {partner.partner_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        partner.status === "active"
                          ? "default"
                          : partner.status === "suspended"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {partner.status === "active"
                        ? t("admin.superadmin.partnersManagement.status.active")
                        : partner.status === "suspended"
                          ? t(
                              "admin.superadmin.partnersManagement.status.suspended",
                            )
                          : t(
                              "admin.superadmin.partnersManagement.status.inactive",
                            )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      ${partner.total_earned.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${partner.total_withdrawn.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(partner.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {partner.status === "active" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(partner, "suspend")}
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          {t(
                            "admin.superadmin.partnersManagement.actions.suspend",
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(partner, "activate")}
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          {t(
                            "admin.superadmin.partnersManagement.actions.activate",
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
              {action === "suspend"
                ? t("admin.superadmin.partnersManagement.dialog.suspendTitle")
                : t("admin.superadmin.partnersManagement.dialog.activateTitle")}
            </DialogTitle>
            <DialogDescription>
              {action === "suspend"
                ? t(
                    "admin.superadmin.partnersManagement.dialog.suspendDescription",
                  )
                : t(
                    "admin.superadmin.partnersManagement.dialog.activateDescription",
                  )}
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">
                  {selectedPartner.user_profiles.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPartner.user_profiles.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("admin.superadmin.partnersManagement.dialog.codeLabel")}:{" "}
                  {selectedPartner.partner_code}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsActionDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant={action === "suspend" ? "destructive" : "default"}
                  onClick={() =>
                    selectedPartner &&
                    handlePartnerAction(selectedPartner.id, action!)
                  }
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? t("admin.superadmin.partnersManagement.dialog.processing")
                    : action === "suspend"
                      ? t("admin.superadmin.partnersManagement.actions.suspend")
                      : t(
                          "admin.superadmin.partnersManagement.actions.activate",
                        )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
