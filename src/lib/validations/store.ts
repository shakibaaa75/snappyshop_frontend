import { z } from "zod";

// Validates a hex color to prevent CSS injection / XSS
const hexColorSchema = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color");

export const storeCustomizationSchema = z.object({
  primaryColor: hexColorSchema.optional(),
  bannerUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
});

// Safe parsing function
export function validateStoreCustomization(data: unknown) {
  const result = storeCustomizationSchema.safeParse(data);
  return result.success ? result.data : null;
}