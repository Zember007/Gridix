import { Building, Building2, Handshake, UserCheck } from "lucide-react";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { useWorkspace } from "@gridix/utils/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface WorkspaceSwitcherProps {
  className?: string;
  /**
   * When true, the switcher is rendered. Parent decides when to show.
   * (We keep it explicit to avoid surprising UI changes.)
   */
  show?: boolean;
  /**
   * When true, switcher is hidden in collapsed sidebar state.
   */
  isCollapsed?: boolean;
  /**
   * Optional label for the "own" workspace (id=null). Defaults to "Мой workspace".
   */
  ownLabel?: string;
}

const toValue = (id: string | null) => id ?? "own";

export function WorkspaceSwitcher({
  className,
  show = true,
  isCollapsed = false,
  ownLabel,
}: WorkspaceSwitcherProps) {
  const { activeWorkspaceId, setActiveWorkspaceId, availableWorkspaces } =
    useWorkspace();

  if (!show || isCollapsed) return null;
  if (!availableWorkspaces.length) return null;

  const hasOwn = availableWorkspaces.some((w) => w.id === null);
  const currentValue = hasOwn
    ? toValue(activeWorkspaceId)
    : toValue(activeWorkspaceId ?? availableWorkspaces[0]?.id ?? null);

  return (
    <div
      className={["px-2 py-2", className].filter(Boolean).join(" ")}
      style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
    >
      <Select
        value={currentValue}
        onValueChange={(value) =>
          setActiveWorkspaceId(value === "own" ? null : value)
        }
      >
        <SelectTrigger
          className="w-full"
          style={{
            borderColor: ADMIN_THEME.sidebarBorder,
            backgroundColor: ADMIN_THEME.sidebarBackground,
            color: ADMIN_THEME.sidebarText,
          }}
        >
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <Building className="h-4 w-4 flex-shrink-0" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableWorkspaces.map((workspace) => {
            const id = workspace.id;
            const value = toValue(id);
            const label =
              id === null
                ? (ownLabel ?? workspace.label ?? "Мой workspace")
                : workspace.label;

            return (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {workspace.type === "owner" ? (
                    <Building2 className="h-4 w-4 text-black" />
                  ) : workspace.type === "manager" ? (
                    <UserCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <Handshake className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="truncate">{label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
