import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Handshake,
  Layers,
  Settings,
  UserCircle,
} from "lucide-react";

import type { SimplifiedSidebarNavItem } from "@gridix/ui";
import type { AgentCabinetPage } from "../model/page-routing";

export function getAgentSidebarNavItems(
  t: (key: string) => string,
): SimplifiedSidebarNavItem[] {
  const item = (id: AgentCabinetPage, icon: ReactNode, label: string) => ({
    id,
    icon,
    label,
  });

  const ic = "h-5 w-5";

  return [
    item("dashboard", <Building2 className={ic} />, t("common.nav.dashboard")),
    item("contacts", <UserCircle className={ic} />, t("common.nav.contacts")),
    item("catalog", <Layers className={ic} />, t("common.nav.projects")),
    item("analytics", <BarChart3 className={ic} />, t("common.nav.analytics")),
    item(
      "partnerProgram",
      <Handshake className={ic} />,
      t("common.nav.partnerProgram"),
    ),
    item("settings", <Settings className={ic} />, t("common.nav.settings")),
  ];
}
