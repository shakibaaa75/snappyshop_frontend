/** Display helpers for the admin store-slug history. */

export function slugSourceLabel(source: string): string {
  switch (source) {
    case "rename":
      return "Shop renamed";
    case "address":
      return "Address changed";
    default:
      return "Before tracking";
  }
}

/** Old changes made before history was recorded have no date. */
export function formatSlugDate(iso?: string): string {
  return iso ? new Date(iso).toLocaleString() : "Date not recorded";
}
