import { ExitDemoButton } from "@/features/demo-cabinet";
import { useAdminShell } from "@/app/layouts/admin-shell-context";

export function DemoExitCollapsedBridge() {
  const { isCollapsed } = useAdminShell();
  return <ExitDemoButton isCollapsed={isCollapsed} />;
}
