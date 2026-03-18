import { useLocation, useNavigate } from "react-router-dom";

export type AgentCabinetPage =
  | "dashboard"
  | "analytics"
  | "contacts"
  | "catalog"
  | "partnerProgram"
  | "settings"
  | "changelog";

/**
 * Checks whether a query value matches one of the supported cabinet pages.
 */
const isAgentCabinetPage = (page: string | null): page is AgentCabinetPage => {
  return (
    page === "dashboard" ||
    page === "analytics" ||
    page === "contacts" ||
    page === "catalog" ||
    page === "partnerProgram" ||
    page === "settings" ||
    page === "changelog"
  );
};

/**
 * Extracts and validates `page` from the current location search string.
 */
const getQueryPage = (search: string): AgentCabinetPage | null => {
  const page = new URLSearchParams(search).get("page");
  return isAgentCabinetPage(page) ? page : null;
};

/**
 * Updates the `page` query parameter while keeping the current path.
 * Uses replace navigation to avoid polluting browser history on tab switches.
 */
const setQueryPage = (
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  page: AgentCabinetPage,
) => {
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get("page") === page) return;

  searchParams.set("page", page);
  navigate(`${location.pathname}?${searchParams.toString()}`, {
    replace: true,
  });
};

/**
 * Provides cabinet page state synchronized with the `?page=` query parameter.
 */
export function useAgentCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePage = getQueryPage(location.search) ?? "dashboard";
  const setActivePage = (page: AgentCabinetPage) =>
    setQueryPage(navigate, location, page);

  return { activePage, setActivePage };
}
