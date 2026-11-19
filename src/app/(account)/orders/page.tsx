import { redirect } from "next/navigation";

// Buyer orders now live at /account/orders.
export default function OrdersRedirect() {
  redirect("/account/orders");
}
