import { updateMyUserProfile } from "../api/settings-api";
import type { UserProfileRow } from "./types";

export async function saveUserProfile(
  userId: string,
  profileForm: Partial<UserProfileRow>,
): Promise<void> {
  await updateMyUserProfile(userId, profileForm);
}
