import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabsList,
  TabsTrigger,
} from "@gridix/ui";
import { Bell, Building2, Database, User } from "lucide-react";
import type { AgentSettingsSectionsSwitcherProps } from "../types";

export function AgentSettingsSectionsSwitcher({
  activeSection,
  onSectionChange,
  t,
}: AgentSettingsSectionsSwitcherProps) {
  return (
    <TabsList className="h-auto w-full justify-start rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-2">
      <div className="w-full sm:hidden">
        <Select
          value={activeSection}
          onValueChange={(v) => onSectionChange(v as typeof activeSection)}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-[var(--admin-border)] bg-[var(--admin-card-background)]">
            <SelectValue placeholder={t("adminSettings.company")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="company">
              <div className="flex items-center gap-2">
                <Building2 size={16} />
                {t("adminSettings.company")}
              </div>
            </SelectItem>
            <SelectItem value="account">
              <div className="flex items-center gap-2">
                <User size={16} />
                {t("adminSettings.account")}
              </div>
            </SelectItem>
            <SelectItem value="notifications">
              <div className="flex items-center gap-2">
                <Bell size={16} />
                {t("adminSettings.notifications")}
              </div>
            </SelectItem>
            <SelectItem value="data">
              <div className="flex items-center gap-2">
                <Database size={16} />
                {t("adminSettings.data")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden w-full flex-wrap gap-2 sm:flex">
        <TabsTrigger value="company" className="flex items-center gap-2">
          <Building2 size={16} />
          {t("adminSettings.company")}
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <User size={16} />
          {t("adminSettings.account")}
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell size={16} />
          {t("adminSettings.notifications")}
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database size={16} />
          {t("adminSettings.data")}
        </TabsTrigger>
      </div>
    </TabsList>
  );
}
