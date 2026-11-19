import Image from "next/image";
import Link from "next/link";
import { Category } from "@/types";
import { homeHref } from "@/lib/query/category-nav";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={homeHref({ category: category.slug })}
      className="group flex flex-col items-center gap-2 rounded-xl bg-muted/60 p-3 border border-transparent hover:border-accent/50 hover:bg-card transition-all"
    >
      <div className="relative h-16 w-16 md:h-20 md:w-20">
        <Image
          src={category.image || "/placeholder-product.jpg"}
          alt=""
          fill
          className="object-contain group-hover:scale-105 transition-transform"
          sizes="80px"
        />
      </div>
      <span className="text-[11px] md:text-xs font-medium text-center leading-tight">
        {category.name}
      </span>
    </Link>
  );
}
