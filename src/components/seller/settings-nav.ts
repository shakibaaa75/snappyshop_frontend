import {
  Globe,
  History,
  Link2,
  MonitorSmartphone,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * live      works today
 * view-only shows real account details but cannot change them yet
 * soon      not built yet: the page says so and shows no controls
 */
export type SettingsStatus = "live" | "view-only" | "soon";

export interface SettingsSection {
  id: string;
  /** Last part of the URL: /seller/[slug]/settings/<slug> */
  slug: string;
  label: string;
  /** One line shown under the name in the mobile list and the page header. */
  description: string;
  icon: LucideIcon;
  status: SettingsStatus;
  /** For "soon" pages: what the section is meant to cover (plain text only). */
  planned?: string[];
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "personal-information",
    slug: "personal-information",
    label: "Personal information",
    description: "Your name, email, phone and profile picture.",
    icon: User,
    status: "live",
  },
  {
    id: "security",
    slug: "security",
    label: "Security",
    description: "Password and sign-in protection.",
    icon: ShieldCheck,
    status: "soon",
    planned: ["Change your password", "Extra sign-in protection"],
  },
  {
    id: "devices-sessions",
    slug: "devices-sessions",
    label: "Devices & sessions",
    description: "Where your account is signed in.",
    icon: MonitorSmartphone,
    status: "soon",
    planned: ["See devices that are signed in", "Sign out of other devices"],
  },
  {
    id: "team-permissions",
    slug: "team-permissions",
    label: "Team & permissions",
    description: "People who can work in your store.",
    icon: Users,
    status: "soon",
    planned: ["Add teammates", "Choose what each person can access"],
  },
  {
    id: "connected-accounts",
    slug: "connected-accounts",
    label: "Connected accounts",
    description: "Sign-in providers linked to your account.",
    icon: Link2,
    status: "soon",
    planned: ["See linked sign-in providers", "Link or unlink a provider"],
  },
  {
    id: "activity-log",
    slug: "activity-log",
    label: "Activity log",
    description: "Recent sign-ins and account changes.",
    icon: History,
    status: "soon",
    planned: ["Recent sign-ins", "Important account changes"],
  },
  {
    id: "domains",
    slug: "domains",
    label: "Domains",
    description: "Use your own web address for your store.",
    icon: Globe,
    status: "live",
  },
  {
    id: "account-preferences",
    slug: "account-preferences",
    label: "Account preferences",
    description: "Language, region and notification choices.",
    icon: SlidersHorizontal,
    status: "soon",
    planned: ["Language and region", "Email notification choices"],
  },
];

export const settingsBase = (storeSlug: string) =>
  `/seller/${storeSlug}/settings`;

export const sectionHref = (storeSlug: string, section: { slug: string }) =>
  `${settingsBase(storeSlug)}/${section.slug}`;

export const getSection = (id: string) =>
  SETTINGS_SECTIONS.find((s) => s.id === id);
