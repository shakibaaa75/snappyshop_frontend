// Add these OPTIONAL fields to your existing types in "@/types"
// (optional so the rest of your app keeps compiling)

export interface Category {
  // ...existing fields (id, slug, name, icon)
  image?: string; // NEW
}

export interface Product {
  // ...existing fields
  reviewCount?: number; // NEW
  sold?: number;        // NEW
  badge?: string;       // NEW e.g. "Bestseller"
}

export interface Store {
  // ...existing fields
  category?: string;   // NEW e.g. "Fashion & Apparel"
  rating?: number;     // NEW
  followers?: string;  // NEW e.g. "1.2k"
}
