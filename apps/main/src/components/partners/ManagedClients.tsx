import { useState } from "react";
import { Card, CardContent } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Users, UserPlus, LogIn, Search } from "lucide-react";
import { usePartnerClients } from "../../hooks/usePartnerClients";
import { useToast } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";

export function ManagedClients() {
  const { clients, loading, error } = usePartnerClients();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "referral" | "managed">(
    "all",
  );
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
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
      setIsAdding(true);

      // Используем новую функцию для отправки приглашения
      const { data: result, error } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "send_invitation",
            email: newClientEmail.trim(),
            invitation_type: "managed",
          },
        },
      );

      if (error) {
        throw new Error(error.message || "Ошибка отправки приглашения");
      }

      if (!result.success) {
        throw new Error(result.error || "Не удалось отправить приглашение");
      }

      toast({
        title: t("partners.invitationSent"),
        description: t("partners.invitationSentDesc", {
          email: newClientEmail,
          link: result.invitation_link,
        }),
      });

      setNewClientEmail("");
      setIsAddingClient(false);
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
      setIsAdding(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.user_profiles.full_name ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.user_profiles.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || client.type === filterType;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-gray-200"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Ошибка загрузки клиентов: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("partners.clients")}</h2>
          <p className="text-muted-foreground">{t("partners.manageClients")}</p>
        </div>

        <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("partners.addClient")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("partners.inviteNewClient")}</DialogTitle>
              <DialogDescription>
                {t("partners.inviteNewClientDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-email">
                  {t("partners.clientEmail")}
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder={t("partners.clientEmailPlaceholder")}
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingClient(false)}
                >
                  {t("partners.cancel")}
                </Button>
                <Button onClick={handleAddManagedClient} disabled={isAdding}>
                  {isAdding
                    ? t("partners.sending")
                    : t("partners.sendInvitation")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder={t("partners.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={filterType}
          onValueChange={(value: "all" | "referral" | "managed") =>
            setFilterType(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("partners.allClients")}</SelectItem>
            <SelectItem value="referral">
              {t("partners.referralClientsFilter")}
            </SelectItem>
            <SelectItem value="managed">
              {t("partners.managedClientsFilter")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список клиентов */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="py-8 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">
                  {t("partners.noClients")}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || filterType !== "all"
                    ? t("partners.noClientsFound")
                    : t("partners.startAttracting")}
                </p>
                {!searchTerm && filterType === "all" && (
                  <Button onClick={() => setIsAddingClient(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("partners.addFirstClient")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">
                        {client.user_profiles.full_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {client.user_profiles.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {client.user_profiles.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        client.type === "referral" ? "default" : "secondary"
                      }
                    >
                      {client.type === "referral"
                        ? t("partners.referral")
                        : t("partners.support")}
                    </Badge>

                    <div className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>

                    {client.type === "managed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(client.client_id)}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        {t("partners.loginAs")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
