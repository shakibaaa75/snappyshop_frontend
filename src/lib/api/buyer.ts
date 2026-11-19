/**
 * The signed-in buyer's own profile and saved addresses.
 *
 *   /api/v1/buyer/profile     GET, PUT
 *   /api/v1/buyer/preferences PUT  (home page theme only)
 *   /api/v1/buyer/addresses   GET, POST, PUT /{id}, PUT /{id}/default, DELETE /{id}
 *
 * The API reads the buyer from the sign-in cookie, so no user id is sent.
 */
import { apiFetch } from "./http";

export type BuyerLanguage = "en" | "bn";
/** How the buyer wants the home page to look. Saved on their account. */
export type HomeTheme = "light" | "dark";
export type AddressLabel = "Home" | "Office" | "Other";

export interface BuyerProfile {
  name: string;
  email: string;
  /** 01XXXXXXXXX, or "" when not set. */
  phone: string;
  /** https:// image address, or "". */
  avatarUrl: string;
  bio: string;
  language: BuyerLanguage;
  /** Home page only. Missing (older API) means light. */
  homeTheme?: HomeTheme;
  memberSince: string;
  addressCount: number;
}

export interface UpdateBuyerProfileInput {
  name: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  language: BuyerLanguage;
}

export interface BuyerAddress {
  id: string;
  label: AddressLabel;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  area: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
}

export type BuyerAddressInput = Omit<BuyerAddress, "id" | "createdAt">;

export const buyerApi = {
  profile: async (): Promise<BuyerProfile> => {
    const res = await apiFetch<{ profile: BuyerProfile }>("/buyer/profile");
    return res.profile;
  },

  updateProfile: async (input: UpdateBuyerProfileInput): Promise<BuyerProfile> => {
    const res = await apiFetch<{ profile: BuyerProfile }>("/buyer/profile", {
      method: "PUT",
      body: input,
    });
    return res.profile;
  },

  /** Saves only the home page theme; never touches the rest of the profile. */
  setHomeTheme: async (homeTheme: HomeTheme): Promise<HomeTheme> => {
    const res = await apiFetch<{ homeTheme: HomeTheme }>("/buyer/preferences", {
      method: "PUT",
      body: { homeTheme },
    });
    return res.homeTheme;
  },

  addresses: async (): Promise<{ addresses: BuyerAddress[]; divisions: string[] }> =>
    apiFetch("/buyer/addresses"),

  addAddress: async (input: BuyerAddressInput): Promise<BuyerAddress> => {
    const res = await apiFetch<{ address: BuyerAddress }>("/buyer/addresses", {
      method: "POST",
      body: input,
    });
    return res.address;
  },

  updateAddress: async (id: string, input: BuyerAddressInput): Promise<BuyerAddress> => {
    const res = await apiFetch<{ address: BuyerAddress }>(
      `/buyer/addresses/${encodeURIComponent(id)}`,
      { method: "PUT", body: input },
    );
    return res.address;
  },

  setDefaultAddress: async (id: string): Promise<void> => {
    await apiFetch(`/buyer/addresses/${encodeURIComponent(id)}/default`, {
      method: "PUT",
    });
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiFetch(`/buyer/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};