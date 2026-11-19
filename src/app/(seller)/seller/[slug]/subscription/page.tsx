import { Suspense } from "react";
import SubscriptionClient from "./subscription-client";

export default function SellerSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionClient />
    </Suspense>
  );
}
