"use client";

import ErrorScreen from "@/components/ErrorScreen";

export default function PageError({ reset }: { reset: () => void }) {
  return <ErrorScreen title="We couldn’t load this page." message="Try again, or head back to the shops." retry={reset} />;
}
