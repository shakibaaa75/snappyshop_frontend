export interface ProductTypeGroup {
  group: string;
  types: string[];
}

export const PRODUCT_TYPE_GROUPS: ProductTypeGroup[] = [
  {
    group: "Fashion",
    types: [
      "Kurti", "Saree", "Salwar Kameez", "Panjabi", "T-Shirt", "Shirt",
      "Polo Shirt", "Jeans", "Trousers", "Jacket", "Hoodie", "Dress",
      "Sneakers", "Sandals", "Formal Shoes", "Handbag", "Backpack",
      "Wallet", "Belt", "Watch", "Sunglasses", "Jewellery", "Scarf & Hijab",
    ],
  },
  {
    group: "Electronics",
    types: [
      "Smartphone", "Phone Case", "Charger & Cable", "Power Bank",
      "Earbuds", "Headphones", "Bluetooth Speaker", "Smart Watch",
      "Laptop", "Tablet", "Keyboard & Mouse", "Monitor", "Camera",
      "Router", "TV", "Home Appliance",
    ],
  },
  {
    group: "Home & Living",
    types: [
      "Bedsheet", "Pillow & Cushion", "Curtain", "Carpet & Rug", "Towel",
      "Furniture", "Lighting", "Kitchenware", "Storage & Organizer",
      "Home Decor", "Wall Art", "Cleaning Supplies",
    ],
  },
  {
    group: "Beauty & Personal Care",
    types: [
      "Skincare", "Makeup", "Perfume", "Hair Care", "Hair Oil",
      "Body Care", "Soap & Body Wash", "Nail Care", "Grooming Kit",
      "Beard Care", "Oral Care",
    ],
  },
  {
    group: "Sports & Outdoors",
    types: [
      "Cricket Gear", "Football", "Badminton", "Gym Equipment",
      "Yoga Mat", "Sportswear", "Cycling", "Camping Gear",
      "Fishing Gear", "Water Bottle",
    ],
  },
  {
    group: "Toys & Games",
    types: [
      "Action Figure", "Doll", "Board Game", "Puzzle", "Building Blocks",
      "Remote Control Toy", "Educational Toy", "Baby Toy", "Video Game",
      "Game Controller",
    ],
  },
  {
    group: "Health & Wellness",
    types: [
      "Vitamin & Supplement", "Medical Device", "First Aid",
      "Fitness Tracker", "Face Mask", "Massage Tool", "Herbal Product",
      "Baby Care",
    ],
  },
  {
    group: "Books & Stationery",
    types: [
      "Book", "Notebook", "Pen & Pencil", "Art Supplies", "School Bag",
      "Office Supplies", "Calendar & Planner", "Gift Wrap",
    ],
  },
  {
    group: "Groceries",
    types: [
      "Rice & Grains", "Spices", "Snacks", "Tea & Coffee", "Oil & Ghee",
      "Dry Fruits", "Beverages", "Frozen Food", "Honey & Spreads",
      "Fresh Produce",
    ],
  },
  {
    group: "Automotive",
    types: [
      "Helmet", "Car Accessories", "Bike Accessories", "Engine Oil",
      "Tyre", "Car Care", "Spare Parts", "Phone Holder",
    ],
  },
];

export const ALL_PRODUCT_TYPES = PRODUCT_TYPE_GROUPS.flatMap((g) => g.types);

export const isValidProductType = (v: string) => ALL_PRODUCT_TYPES.includes(v);