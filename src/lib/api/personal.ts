import { apiFetch } from "./http";

/**
 * Seller Settings > Personal information.
 *
 * These are the owner's PRIVATE details. The public store phone / WhatsApp
 * number belong to the store design and are never read or written here.
 */
export interface PersonalInfo {
  name: string;
  email: string;
  emailVerified: boolean;
  /** 01XXXXXXXXX, or "" when none is set. */
  phone: string;
  phoneVerified: boolean;
  /** Public URL of the profile picture, or "". */
  avatarUrl: string;
  /** false = the account only signs in with Google / Apple. */
  hasPassword: boolean;
  /** Which verified changes this server can do right now. */
  availability: { email: boolean; phone: boolean };
}

interface PersonalResponse {
  personal: PersonalInfo;
}

interface ResendResponse {
  resendAfter?: number;
}

const BASE = "/seller/personal";

async function sent(path: string, body?: unknown): Promise<{ resendAfter: number }> {
  const res = await apiFetch<ResendResponse>(`${BASE}${path}`, {
    method: "POST",
    body,
  });
  return { resendAfter: res?.resendAfter ?? 60 };
}

async function personal(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<PersonalInfo> {
  const res = await apiFetch<PersonalResponse>(`${BASE}${path}`, { method, body });
  return res.personal;
}

export const personalApi = {
  /** GET /seller/personal */
  get: async (): Promise<PersonalInfo> => {
    const res = await apiFetch<PersonalResponse>(BASE);
    return res.personal;
  },

  /** Re-checks the password and emails a code to the NEW address. */
  requestEmailChange: (v: { newEmail: string; currentPassword: string }) =>
    sent("/email/change", v),

  /** Checks the code. On success the account email is replaced. */
  confirmEmailChange: (v: { newEmail: string; code: string }) =>
    personal("/email/change/confirm", "POST", v),

  /** Emails a code to the current, unverified address. */
  requestEmailVerify: () => sent("/email/verify"),

  confirmEmailVerify: (code: string) =>
    personal("/email/verify/confirm", "POST", { code }),

  /** Re-checks the password and texts a code to the NEW number. */
  requestPhoneChange: (v: { phone: string; currentPassword: string }) =>
    sent("/phone/change", v),

  confirmPhoneChange: (v: { phone: string; code: string }) =>
    personal("/phone/change/confirm", "POST", v),

  /** Attaches an image already uploaded with kind "avatar". */
  setAvatar: (uploadId: string) => personal("/avatar", "PUT", { uploadId }),

  removeAvatar: () => personal("/avatar", "DELETE"),
};
