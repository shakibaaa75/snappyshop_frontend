import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Store not found</h1>
      <p className="text-sm text-muted-foreground">
        This store address doesn&apos;t exist or is no longer available.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Go to the marketplace
      </Link>
    </div>
  );
}
