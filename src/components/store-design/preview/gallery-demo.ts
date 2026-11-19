import { type GalleryItem } from "@/lib/store-design/types";

export const GALLERY_DEMO: GalleryItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `gx-${n}`,
  imageUrl: "",
  caption: "Add your photos",
  price: "",
  url: "",
}));
