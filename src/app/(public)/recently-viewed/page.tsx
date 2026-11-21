import type { Metadata } from "next";
import { RecentlyViewedList } from "./recently-viewed-list";

export const metadata: Metadata = {
  title: "Recently viewed · ShopBD",
  // The list is private to each browser, so there is nothing for search engines to index.
  robots: { index: false, follow: true },
};

export default function RecentlyViewedPage() {
  return <RecentlyViewedList />;
}
