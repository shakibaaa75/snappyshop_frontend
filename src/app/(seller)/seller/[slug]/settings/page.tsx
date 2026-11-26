import { PersonalInformationSection } from "@/components/seller/settings/personal-information-section";

/**
 * /settings. On mobile the layout shows the category list here and hides this
 * content; on desktop the sidebar is next to it and this shows the first
 * section, so there is no empty pane and no redirect.
 */
export default function SellerSettingsPage() {
  return <PersonalInformationSection />;
}
