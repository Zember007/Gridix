import type { UserProfile } from "@/contexts/AuthContext";

export type OnboardingState = NonNullable<UserProfile["onboarding"]>;

export function getOnboardingState(profile: UserProfile | null | undefined): OnboardingState {
  const raw = profile?.onboarding ?? {};
  console.log('raw', raw);
  return {
    admin_main_done: raw.admin_main_done ?? false,
    project_creation_done: raw.project_creation_done ?? false,
    partners_done: raw.partners_done ?? false,
    project_editor_done_ids: Array.isArray(raw.project_editor_done_ids) ? raw.project_editor_done_ids : [],
    pending_next: raw.pending_next ?? null,
    pending_project_id: raw.pending_project_id ?? null,
  };
}

export function setPendingNext(
  profile: UserProfile | null | undefined,
  next: OnboardingState["pending_next"],
  projectId: string | null = null
): OnboardingState {
  const cur = getOnboardingState(profile);
  return {
    ...cur,
    pending_next: next,
    pending_project_id: projectId,
  };
}

