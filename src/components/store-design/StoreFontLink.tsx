import { fontOptions } from "@/lib/store-design/types";

/**
 * Server-rendered stylesheet link for the seller's chosen Google font.
 *
 * Before, the font was injected from a useEffect after hydration, so every
 * page load painted in the fallback font and then re-flowed when the real one
 * arrived. Rendering the link on the server (React hoists it into <head>)
 * lets the browser fetch it during the first load.
 */
export function StoreFontLink({ fontId }: { fontId: string }) {
  const font = fontOptions.find((f) => f.id === fontId);
  if (!font?.google) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${font.google}&display=swap`}
        precedence="default"
      />
    </>
  );
}
