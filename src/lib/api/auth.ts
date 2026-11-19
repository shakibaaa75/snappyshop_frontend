import type { User } from "@/types";
import type { LoginFormValues, RegisterFormValues } from "@/lib/validations/auth";
import { apiFetch } from "./http";

/** The API returns the frontend `User` type plus the user's name. */
export type AuthUser = User & { name?: string };

interface UserResponse {
  user: AuthUser;
}

/** What the API needs to create an account (terms are only checked in the UI). */
export type RegisterPayload = Omit<RegisterFormValues, "agreeTerms">;

export const authApi = {
  /** POST /auth/email/send-code. Emails a 6-digit code. Fails with EMAIL_TAKEN if the account exists. */
  sendEmailCode: async (email: string): Promise<{ resendAfter: number }> => {
    const res = await apiFetch<{ resendAfter?: number }>("/auth/email/send-code", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    });
    return { resendAfter: res?.resendAfter ?? 60 };
  },

  /** POST /auth/email/verify-code. Returns a short-lived token proving the email is verified. */
  verifyEmailCode: async (email: string, code: string): Promise<string> => {
    const res = await apiFetch<{ verificationToken: string }>(
      "/auth/email/verify-code",
      {
        method: "POST",
        body: { email, code },
        skipRefresh: true,
      },
    );
    return res.verificationToken;
  },

  /** POST /auth/register. Requires the token from verifyEmailCode. Signs the user in (sets the auth cookies). */
  register: async (
    values: RegisterPayload,
    verificationToken: string,
  ): Promise<AuthUser> => {
    const { name, email, password, confirmPassword, role } = values;
    const res = await apiFetch<UserResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password, confirmPassword, role, verificationToken },
      skipRefresh: true,
    });
    return res.user;
  },

  /** POST /auth/login. Sets the auth cookies. */
  login: async (values: LoginFormValues): Promise<AuthUser> => {
    const res = await apiFetch<UserResponse>("/auth/login", {
      method: "POST",
      body: { email: values.email, password: values.password },
      skipRefresh: true,
    });
    return res.user;
  },

  /** POST /auth/logout. Clears the cookies and revokes the session. */
  logout: async (): Promise<void> => {
    await apiFetch<void>("/auth/logout", { method: "POST", skipRefresh: true });
  },

  /** GET /auth/me. Returns the signed-in user (refreshes the session once if needed). */
  me: async (): Promise<AuthUser> => {
    const res = await apiFetch<UserResponse>("/auth/me");
    return res.user;
  },
};