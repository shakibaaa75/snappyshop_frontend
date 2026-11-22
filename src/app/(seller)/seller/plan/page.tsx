import { redirect } from "next/navigation";

// The plan step is now part of the sign-up pages (/register/plan).
export default function SellerPlanPage() {
  redirect("/register/plan");
}
