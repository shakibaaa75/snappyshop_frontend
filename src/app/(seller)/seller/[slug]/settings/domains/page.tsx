import { CustomDomainPanel } from "@/components/seller/custom-domain-panel";
import { SettingsPageHeader } from "@/components/seller/settings/settings-ui";
import { getSection } from "@/components/seller/settings/settings-nav";

// The custom domain panel is unchanged. It only moved here from /settings.
export default function DomainsPage() {
  const section = getSection("domains")!;
  return (
    <>
      <SettingsPageHeader
        title={section.label}
        description={section.description}
      />
      {/* The panel is a shadow card; on the white settings page it gets the
          same border the other settings cards use. */}
      <div className="[&>section]:border [&>section]:border-border [&>section]:shadow-none">
        <CustomDomainPanel />
      </div>
    </>
  );
}
