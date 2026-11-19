import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { SellerOnboardingWizard } from "@/components/features/auth/SellerOnboardingWizard";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  // Wizard for sellers, standard form for buyers
  return role === "seller" ? <SellerOnboardingWizard /> : <RegisterForm />;
}
