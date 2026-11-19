import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  variant: "green" | "cream";
  badge?: React.ReactNode;
}

export function PromoBanner({
  title,
  description,
  cta,
  href,
  image,
  variant,
  badge,
}: PromoBannerProps) {
  const green = variant === "green";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl min-h-[210px] p-6 md:p-8 flex",
        green
          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
          : "bg-[#fbeee3] text-foreground",
      )}
    >
      <div className="relative z-10 max-w-[55%] flex flex-col gap-3 justify-center">
        <h3 className="text-2xl font-bold leading-tight whitespace-pre-line">
          {title}
        </h3>
        <p
          className={cn(
            "text-sm",
            green ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
        <Link href={href}>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-md bg-white text-foreground hover:bg-white/90"
          >
            {cta} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-left"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      {badge}
    </div>
  );
}
