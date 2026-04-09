/* eslint-disable react-refresh/only-export-components -- context + hook pair */
import { createContext, useContext } from "react";

/**
 * When set (e.g. `viewer.effective_developer_id` from admin-bootstrap), partner UI
 * loads data for this workspace owner instead of the authenticated user — needed
 * for demo viewers and managers viewing a developer workspace.
 */
const PartnerScopeContext = createContext<string | undefined>(undefined);

export const PartnerScopeProvider = PartnerScopeContext.Provider;

export function usePartnerScopeUserId(): string | undefined {
  return useContext(PartnerScopeContext);
}
