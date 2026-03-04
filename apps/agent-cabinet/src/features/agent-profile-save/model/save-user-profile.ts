import type { UserProfileRow } from "@/entities/agent-profile";
import { updateMyUserProfile } from "../api/profile-save-api";

export async function saveUserProfile(
  userId: string,
  profileForm: Partial<UserProfileRow>,
): Promise<void> {
  await updateMyUserProfile(userId, profileForm);
}
