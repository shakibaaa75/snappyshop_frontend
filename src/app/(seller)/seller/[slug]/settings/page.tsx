import { CustomDomainPanel } from "@/components/seller/custom-domain-panel";

export default function SellerSettingsPage() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <header>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          Manage how customers find your store.
        </p>
      </header>

      <CustomDomainPanel />
    </div>
  );
}
