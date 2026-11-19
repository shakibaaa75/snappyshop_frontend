/**
 * Central registry of React Query keys.
 *
 * All keys are arrays, all are hierarchical, and mutations can invalidate
 * by prefix (e.g. invalidate ["seller", "products"] to refresh any product
 * list regardless of filters).
 */
export const qk = {
  auth: {
    me: ["auth", "me"] as const,
  },

  seller: {
    stats: (since?: string) => ["seller", "stats", since ?? "all"] as const,

    products: {
      all: ["seller", "products"] as const,
      list: () => ["seller", "products", "list"] as const,
      detail: (id: string) => ["seller", "products", "detail", id] as const,
    },

    categories: {
      all: ["seller", "categories"] as const,
      list: () => ["seller", "categories", "list"] as const,
    },

    orders: {
      all: ["seller", "orders"] as const,
      list: (status: string) => ["seller", "orders", "list", status] as const,
      detail: (id: string) => ["seller", "orders", "detail", id] as const,
    },

    couriers: {
      all: ["seller", "couriers"] as const,
      list: () => ["seller", "couriers", "list"] as const,
      providers: () => ["seller", "couriers", "providers"] as const,
    },

    notifications: {
      all: ["seller", "notifications"] as const,
      list: () => ["seller", "notifications", "list"] as const,
    },

    delivery: ["seller", "delivery-settings"] as const,

    customDomain: ["seller", "custom-domain"] as const,

    storeDesign: {
      draft: ["seller", "store-design", "draft"] as const,
      published: ["seller", "store-design", "published"] as const,
    },
  },

  admin: {
    notifications: ["admin", "notifications"] as const,
  },

  buyer: {
    all: ["buyer"] as const,
    profile: ["buyer", "profile"] as const,
    addresses: ["buyer", "addresses"] as const,
    orders: ["buyer", "orders"] as const,
    order: (id: string) => ["buyer", "orders", id] as const,
    issues: ["buyer", "issues"] as const,
  },

  public: {
    store: (slug: string) => ["public-store", slug] as const,
    product: (slug: string, productId: string) =>
      ["public-store", slug, "product", productId] as const,
    deliverySettings: (slug: string) =>
      ["public-store", slug, "delivery-settings"] as const,
  },

  marketplace: {
    products: (params: Record<string, unknown>) =>
      ["marketplace", "products", params] as const,
    sellers: (params: Record<string, unknown>) =>
      ["marketplace", "sellers", params] as const,
    categories: ["marketplace", "categories"] as const,
    mainTypes: ["marketplace", "main-types"] as const,
  },
} as const;