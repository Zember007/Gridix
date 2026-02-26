import { useLocation, useNavigate } from "react-router-dom";

export type AgentCabinetPage =
  | "dashboard"
  | "analytics"
  | "contacts"
  | "catalog"
  | "partnerProgram"
  | "settings";

const isAgentCabinetPage = (page: string | null): page is AgentCabinetPage => {
  return (
    page === "dashboard" ||
    page === "analytics" ||
    page === "contacts" ||
    page === "catalog" ||
    page === "partnerProgram" ||
    page === "settings"
  );
};

const getQueryPage = (search: string): AgentCabinetPage | null => {
  const page = new URLSearchParams(search).get("page");
  return isAgentCabinetPage(page) ? page : null;
};

const setQueryPage = (
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  page: AgentCabinetPage,
) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  navigate(`${location.pathname}${url.search}`, { replace: true });
};

export function useAgentCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePage = getQueryPage(location.search) ?? "dashboard";
  const setActivePage = (page: AgentCabinetPage) =>
    setQueryPage(navigate, location, page);

  return { activePage, setActivePage };
}
