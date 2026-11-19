/**
 * The official districts of Bangladesh, grouped by division. Shared by both
 * checkouts so the delivery zone (Dhaka district vs everywhere else) is
 * always decided from a real district name, never from free text.
 */
export const DISTRICT_GROUPS: { division: string; districts: string[] }[] = [
  {
    division: "Barisal",
    districts: [
      "Barguna",
      "Barisal",
      "Bhola",
      "Jhalokati",
      "Patuakhali",
      "Pirojpur",
    ],
  },
  {
    division: "Chittagong",
    districts: [
      "Bandarban",
      "Brahmanbaria",
      "Chandpur",
      "Chattogram",
      "Comilla",
      "Cox's Bazar",
      "Feni",
      "Khagrachhari",
      "Lakshmipur",
      "Noakhali",
      "Rangamati",
    ],
  },
  {
    division: "Dhaka",
    districts: [
      "Dhaka",
      "Faridpur",
      "Gazipur",
      "Gopalganj",
      "Kishoreganj",
      "Madaripur",
      "Manikganj",
      "Munshiganj",
      "Narayanganj",
      "Narsingdi",
      "Rajbari",
      "Shariatpur",
      "Tangail",
    ],
  },
  {
    division: "Khulna",
    districts: [
      "Bagerhat",
      "Chuadanga",
      "Jashore",
      "Jhenaidah",
      "Khulna",
      "Kushtia",
      "Magura",
      "Meherpur",
      "Narail",
      "Satkhira",
    ],
  },
  {
    division: "Mymensingh",
    districts: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  },
  {
    division: "Rajshahi",
    districts: [
      "Bogura",
      "Chapainawabganj",
      "Joypurhat",
      "Naogaon",
      "Natore",
      "Pabna",
      "Rajshahi",
      "Sirajganj",
    ],
  },
  {
    division: "Rangpur",
    districts: [
      "Dinajpur",
      "Gaibandha",
      "Kurigram",
      "Lalmonirhat",
      "Nilphamari",
      "Panchagarh",
      "Rangpur",
      "Thakurgaon",
    ],
  },
  {
    division: "Sylhet",
    districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
  },
];

/** Every official district name. */
export const ALL_DISTRICTS: string[] = DISTRICT_GROUPS.flatMap(
  (g) => g.districts,
).sort((a, b) => a.localeCompare(b));

/**
 * Returns the official spelling of a district typed or saved in any case,
 * or "" when it is not one of the 64 (for example "Dhaka City").
 */
export function canonicalDistrict(input: string): string {
  const k = input.trim().toLowerCase();
  return ALL_DISTRICTS.find((d) => d.toLowerCase() === k) ?? "";
}
