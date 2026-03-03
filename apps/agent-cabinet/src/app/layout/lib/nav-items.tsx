import type { ReactNode } from "react";
import {
  ChartBar,
  Buildings as Building2,
  UserCircle as UserIcon,
  Stack as Layers3,
  Handshake,
  GearSix,
} from "@phosphor-icons/react";
import type { SimplifiedSidebarNavItem } from "@gridix/ui";
import type { AgentCabinetPage } from "../model/page-routing";

export function getAgentSidebarNavItems(
  t: (key: string) => string,
): SimplifiedSidebarNavItem[] {
  const iconSize = 20;
  const item = (id: AgentCabinetPage, icon: ReactNode, label: string) => ({
    id,
    icon,
    label,
  });

  return [
    item("dashboard", <Building2 size={iconSize} />, t("common.nav.dashboard")),
    item("contacts", <UserIcon size={iconSize} />, t("common.nav.contacts")),
    item("catalog", <Layers3 size={iconSize} />, t("common.nav.projects")),
    item("analytics", <ChartBar size={iconSize} />, t("common.nav.analytics")),
    item(
      "partnerProgram",
      <Handshake size={iconSize} />,
      t("common.nav.partnerProgram"),
    ),
    item("settings", <GearSix size={iconSize} />, t("common.nav.settings")),
  ];
}
