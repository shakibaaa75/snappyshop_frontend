import type { Category, Product } from "./types";

export const mockCategories: Category[] = [
  { id: "fashion", name: "Fashion", emoji: "👗" },
  { id: "bags", name: "Bags", emoji: "👜" },
  { id: "accessories", name: "Accessories", emoji: "⌚" },
  { id: "beauty", name: "Beauty", emoji: "🧴" },
  { id: "home", name: "Home & Living", emoji: "🏠" },
];

type Row = [
  id: string,
  name: string,
  categoryId: string,
  price: number,
  comparePrice: number | undefined,
  sold: number,
  rating: number,
  reviews: number,
  stock: number,
  createdAt: string,
  emoji: string,
  hue: number,
];

const rows: Row[] = [
  ["p1", "Cotton Kurti, Sky Blue", "fashion", 1290, 1590, 342, 4.8, 128, 24, "2026-09-02", "👗", 200],
  ["p2", "Handloom Saree, Maroon", "fashion", 3490, undefined, 188, 4.9, 76, 9, "2026-09-18", "🥻", 350],
  ["p3", "Everyday Panjabi, Off White", "fashion", 1850, 2200, 261, 4.6, 94, 3, "2026-10-05", "👔", 40],
  ["p4", "Leather Shoulder Bag", "bags", 2790, 3290, 214, 4.7, 88, 12, "2026-09-25", "👜", 25],
  ["p5", "Canvas Tote, Natural", "bags", 690, undefined, 402, 4.5, 211, 60, "2026-08-14", "🛍️", 90],
  ["p6", "Minimal Wrist Watch", "accessories", 2250, 2750, 97, 4.4, 41, 0, "2026-07-30", "⌚", 215],
  ["p7", "Beaded Necklace", "accessories", 520, undefined, 156, 4.3, 52, 33, "2026-10-08", "📿", 300],
  ["p8", "Rose Face Serum, 30ml", "beauty", 980, 1190, 310, 4.8, 173, 41, "2026-09-10", "🧴", 340],
  ["p9", "Herbal Hair Oil, 200ml", "beauty", 450, undefined, 478, 4.7, 256, 80, "2026-06-21", "🌿", 130],
  ["p10", "Ceramic Mug Set (4)", "home", 1190, 1490, 83, 4.6, 37, 15, "2026-10-01", "☕", 20],
  ["p11", "Woven Cushion Cover", "home", 590, undefined, 121, 4.2, 29, 5, "2026-09-28", "🛋️", 170],
  ["p12", "Soy Candle, Jasmine", "home", 750, 890, 66, 4.9, 24, 27, "2026-10-10", "🕯️", 55],
];

export const mockProducts: Product[] = rows.map(
  ([id, name, categoryId, price, comparePrice, sold, rating, reviews, stock, createdAt, emoji, hue]) => ({
    id,
    name,
    categoryId,
    price,
    comparePrice,
    sold,
    rating,
    reviews,
    stock,
    createdAt,
    emoji,
    hue,
  }),
);
