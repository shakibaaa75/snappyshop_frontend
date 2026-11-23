import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  message: string;
  retry?: () => void;
  href?: string;
  label?: string;
};

export default function ErrorScreen({
  title,
  message,
  retry,
  href = "/",
  label = "Back to home",
}: Props) {
  return (
    <>
      <link rel="stylesheet" href="/errors/page.css" />
      <main className="sn-error">
        <div className="sn-error__art">
          <Link
            href="/"
            className="sn-error__logo"
            aria-label="SnappyShops home"
          >
            <Image
              src="/Snappy basket mascot logo redesign.png"
              alt="SnappyShops"
              width={200}
              height={85}
              unoptimized
            />
          </Link>
        </div>
        <div className="sn-error__copy">
          <h1>{title}</h1>
          <p>{message}</p>
          <div className="sn-error__actions">
            {retry && (
              <button type="button" onClick={retry}>
                Try again
              </button>
            )}
            <Link href={href}>{label}</Link>
          </div>
        </div>
      </main>
    </>
  );
}
