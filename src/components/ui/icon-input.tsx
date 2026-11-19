import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IconInputProps extends React.ComponentProps<"input"> {
  icon: LucideIcon;
}

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input ref={ref} className={cn("h-11 pl-10", className)} {...props} />
    </div>
  ),
);
IconInput.displayName = "IconInput";
