type UserMetadata = Record<string, unknown> | null | undefined;

type UserLike = {
  id?: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: UserMetadata;
} | null;

type UserProfileLike = {
  email?: string | null;
  full_name?: string | null;
  created_at?: string | null;
  company_name?: string | null;
  phone?: string | null;
} | null;

type TourUserPayload = {
  userId: string;
  email: string | null;
  name: string | null;
  signedUpAt: string | null;
  companyName: string | null;
  phone: string | null;
  accountType: string | null;
};

const getMetadataString = (
  metadata: UserMetadata,
  key: string,
): string | null => {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" ? value : null;
};

export const buildTourUserPayload = (
  user: UserLike,
  userProfile: UserProfileLike,
): TourUserPayload => {
  return {
    userId: user?.id ?? "",
    email: userProfile?.email ?? user?.email ?? null,
    name:
      userProfile?.full_name ??
      getMetadataString(user?.user_metadata, "full_name"),
    signedUpAt: user?.created_at ?? userProfile?.created_at ?? null,
    companyName:
      userProfile?.company_name ??
      getMetadataString(user?.user_metadata, "company_name"),
    phone:
      userProfile?.phone ?? getMetadataString(user?.user_metadata, "phone"),
    accountType: getMetadataString(user?.user_metadata, "account_type"),
  };
};
