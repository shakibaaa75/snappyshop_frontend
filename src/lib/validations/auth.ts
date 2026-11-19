import { z } from "zod";

// 1. Login Schema (Shared)
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// 2. Buyer Register Schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["BUYER", "SELLER"], {
    required_error: "Please select an account type",
  }),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

// 3. Seller Onboarding Schema (Multi-step)
export const sellerOnboardingSchema = z.object({
  // Step 1: Account
  legalName: z.string().min(2, "Legal name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(11, "Valid BD phone number is required").regex(/^01[3-9]\d{8}$/, "Invalid BD format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  sellerType: z.enum(["INDIVIDUAL", "BUSINESS"], { required_error: "Select seller type" }),

  // Step 2: Store Info
  storeName: z.string().min(3, "Store name is required"),
  storeSlug: z.string().min(3, "URL slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Only lowercase letters, numbers, and hyphens"),
  storeCategory: z.string().min(1, "Select a category"),
  storeDescription: z.string().optional(),

  // Step 3: Verification (NID is intentionally not collected)
  tradeLicenseNumber: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  
  // Step 4: Customization
  brandColor: z.string().optional(),
  productLayout: z.enum(["grid", "compact", "large"]).optional(),
}).refine((data) => {
  if (data.sellerType === "BUSINESS") return !!data.tradeLicenseNumber && data.tradeLicenseNumber.length > 3;
  return true;
}, { message: "Trade License is required for businesses", path: ["tradeLicenseNumber"] });

export type SellerOnboardingValues = z.infer<typeof sellerOnboardingSchema>;