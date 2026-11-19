import { Suspense } from "react";
import TryTheLookClient from "./try-the-look-client";

export default function TryTheLookPage() {
  return (
    <Suspense fallback={null}>
      <TryTheLookClient />
    </Suspense>
  );
}
