/* Small inline SVG logos. Simplified marks so there are no image files to host;
   swap in the official brand assets if you prefer exact artwork. */
import Image from "next/image";

type LogoProps = { className?: string };

export function MetaLogo({ className }: LogoProps) {
  return (
    <Image
      src="/meta.jpg"
      alt="Meta"
      width={64}
      height={40}
      className={className}
    />
  );
}

export function FacebookLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Facebook"
    >
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        d="M13.4 20v-6.6h2.2l.4-2.6h-2.6V9.2c0-.8.3-1.3 1.4-1.3H16V5.6c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.4v1.9H8.4v2.6h2.2V20h2.8Z"
        fill="#fff"
      />
    </svg>
  );
}

export function InstagramLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Instagram"
    >
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="40%" stopColor="#FA7E1E" />
          <stop offset="65%" stopColor="#D62976" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle
        cx="12"
        cy="12"
        r="4.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  );
}

export function TikTokLogo({ className }: LogoProps) {
  const note =
    "M13.2 5.5h2c.2 1.5 1.1 2.5 2.6 2.7v2c-1 0-1.9-.3-2.6-.8v4.5a3.8 3.8 0 1 1-3.8-3.8c.2 0 .4 0 .6.1v2.1a1.8 1.8 0 1 0 1.2 1.7V5.5Z";
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="TikTok"
    >
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#000" />
      <path d={note} fill="#25F4EE" transform="translate(-.5 -.5)" />
      <path d={note} fill="#FE2C55" transform="translate(.5 .5)" />
      <path d={note} fill="#fff" />
    </svg>
  );
}
