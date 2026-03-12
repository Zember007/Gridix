import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
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
  Ban,
  UserPlus,
  LogIn,
  Search,
  ShieldCheck,
  Shield,
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
import { Textarea } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
}

interface BannedUser {
  user_id: string;
  banned_at: string;
  reason: string | null;
  unbanned_at: string | null;
}

export function UsersManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [banReason, setBanReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openBanDialog, setOpenBanDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // Form states for creating user
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserCompany, setNewUserCompany] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBannedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: t("admin.superadmin.usersManagement.toast.loadUsersError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("banned_users")
        .select("*")
        .is("unbanned_at", null);

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error("Error fetching banned users:", error);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId) return;

    try {
      const bannedBy = (await fetchCurrentSession()).user?.id;
      if (!bannedBy) {
        throw new Error("No authenticated user");
      }
      const { error } = await supabase.from("banned_users").insert({
        user_id: selectedUserId,
        banned_by: bannedBy,
        reason: banReason || null,
      });

      if (error) throw error;

      toast({
        title: t("admin.superadmin.usersManagement.toast.successTitle"),
        description: t("admin.superadmin.usersManagement.toast.userBanned"),
      });

      setBanReason("");
      setSelectedUserId(null);
      setOpenBanDialog(false);
      fetchBannedUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: t("admin.superadmin.usersManagement.toast.banUserError"),
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const sessionData = await fetchCurrentSession();

      if (!sessionData.session) {
        throw new Error("No session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            action: "unban_user",
            user_id: userId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to unban user");
      }

      toast({
        title: t("admin.superadmin.usersManagement.toast.successTitle"),
        description: t("admin.superadmin.usersManagement.toast.userUnbanned"),
      });

      fetchBannedUsers();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: t("admin.superadmin.usersManagement.toast.unbanUserError"),
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.usersManagement.toast.emailPasswordRequired",
        ),
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const sessionData = await fetchCurrentSession();

      if (!sessionData.session) {
        throw new Error("No session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            action: "create_user",
            email: newUserEmail,
            password: newUserPassword,
            full_name: newUserFullName,
            company_name: newUserCompany,
            phone: newUserPhone,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create user");
      }

      toast({
        title: t("admin.superadmin.usersManagement.toast.successTitle"),
        description: t("admin.superadmin.usersManagement.toast.userCreated"),
      });

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserCompany("");
      setNewUserPhone("");
      setOpenCreateDialog(false);

      fetchUsers();
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("admin.superadmin.usersManagement.toast.createUserError");
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImpersonateUser = async (userId: string) => {
    try {
      const sessionData = await fetchCurrentSession();

      if (!sessionData.session) {
        throw new Error("No session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-user-management`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            action: "impersonate_user",
            user_id: userId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to impersonate user");
      }

      // Redirect to the magic link
      if (result.redirect_url) {
        window.open(result.redirect_url, "_blank");
      }
    } catch (error: unknown) {
      console.error("Error impersonating user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("admin.superadmin.usersManagement.toast.impersonateUserError");
      toast({
        title: t("admin.superadmin.usersManagement.toast.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isUserBanned = (userId: string) => {
    return bannedUsers.some((banned) => banned.user_id === userId);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="p-6">{t("admin.superadmin.usersManagement.loading")}</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">
          {t("admin.superadmin.usersManagement.title")}
        </h2>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("admin.superadmin.usersManagement.actions.addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("admin.superadmin.usersManagement.dialogs.createTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.usersManagement.fields.password")} *
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.usersManagement.fields.fullName")}
                </Label>
                <Input
                  placeholder={t(
                    "admin.superadmin.usersManagement.placeholders.fullName",
                  )}
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.usersManagement.fields.company")}
                </Label>
                <Input
                  placeholder={t(
                    "admin.superadmin.usersManagement.placeholders.company",
                  )}
                  value={newUserCompany}
                  onChange={(e) => setNewUserCompany(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  {t("admin.superadmin.usersManagement.fields.phone")}
                </Label>
                <Input
                  placeholder="+7 (999) 123-45-67"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating
                  ? t("admin.superadmin.usersManagement.creating")
                  : t("admin.superadmin.usersManagement.actions.createUser")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(
              "admin.superadmin.usersManagement.searchPlaceholder",
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>
                {t("admin.superadmin.usersManagement.table.name")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.usersManagement.table.company")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.usersManagement.table.status")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.usersManagement.table.registeredAt")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.usersManagement.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isBanned = isUserBanned(user.id);
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || "—"}</TableCell>
                  <TableCell>{user.company_name || "—"}</TableCell>
                  <TableCell>
                    {isBanned ? (
                      <Badge
                        variant="destructive"
                        className="flex w-fit items-center gap-1"
                      >
                        <Ban className="h-3 w-3" />
                        {t("admin.superadmin.usersManagement.status.banned")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex w-fit items-center gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {t("admin.superadmin.usersManagement.status.active")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <Shield className="mr-1 h-4 w-4" />
                          {t("admin.superadmin.usersManagement.actions.unban")}
                        </Button>
                      ) : (
                        <Dialog
                          open={openBanDialog && selectedUserId === user.id}
                          onOpenChange={(open) => {
                            setOpenBanDialog(open);
                            if (!open) {
                              setSelectedUserId(null);
                              setBanReason("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setOpenBanDialog(true);
                              }}
                            >
                              <Ban className="mr-1 h-4 w-4" />
                              {t(
                                "admin.superadmin.usersManagement.actions.ban",
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t(
                                  "admin.superadmin.usersManagement.dialogs.banTitle",
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                  {t(
                                    "admin.superadmin.usersManagement.dialogs.banTarget",
                                  )}{" "}
                                  <strong>{user.email}</strong>
                                </p>
                                <Label>
                                  {t(
                                    "admin.superadmin.usersManagement.fields.banReason",
                                  )}
                                </Label>
                                <Textarea
                                  placeholder={t(
                                    "admin.superadmin.usersManagement.placeholders.banReason",
                                  )}
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                              </div>
                              <Button
                                onClick={handleBanUser}
                                className="w-full"
                              >
                                {t(
                                  "admin.superadmin.usersManagement.actions.ban",
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonateUser(user.id)}
                      >
                        <LogIn className="mr-1 h-4 w-4" />
                        {t("admin.superadmin.usersManagement.actions.loginAs")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
