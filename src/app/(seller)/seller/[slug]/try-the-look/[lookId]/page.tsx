import { Suspense } from "react";
import LookEditor from "@/components/seller/looks/LookEditor";

export default function SellerLookEditorPage() {
  return (
    <Suspense fallback={null}>
      <LookEditor />
    </Suspense>
  );
}
