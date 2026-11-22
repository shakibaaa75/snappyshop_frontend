import type { Metadata } from "next";
import { PlanClient } from "./plan-client";

export const metadata: Metadata = {
  title: "Choose your plan | ShopBD",
  robots: { index: false },
};

export default function RegisterPlanPage() {
  return <PlanClient />;
}
