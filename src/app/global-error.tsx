"use client";

import PageError from "./error";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <head><title>Page unavailable · SnappyShops</title></head>
      <body style={{ margin: 0 }}><PageError reset={reset} /></body>
    </html>
  );
}
