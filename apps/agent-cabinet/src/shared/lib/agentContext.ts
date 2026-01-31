const ACTIVE_APPLICATION_KEY = "agent_cabinet:active_application_id";

export function getActiveApplicationId(): string | null {
  try {
    const v = localStorage.getItem(ACTIVE_APPLICATION_KEY);
    return v ? String(v) : null;
  } catch {
    return null;
  }
}

export function setActiveApplicationId(id: string) {
  localStorage.setItem(ACTIVE_APPLICATION_KEY, id);
}

