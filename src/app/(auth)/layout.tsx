export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-accent/10 p-4 sm:p-8">
      {children}
    </div>
  );
}
