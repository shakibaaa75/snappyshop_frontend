"use client";

import * as React from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FloatingFieldProps<T extends FieldValues> = Omit<
  React.ComponentProps<"input">,
  "name" | "defaultValue"
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
};

export function FloatingField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  multiline,
  rows = 3,
  type,
  className,
  ...props
}: FloatingFieldProps<T>) {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const Comp: React.ElementType = multiline ? Textarea : Input;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-1.5", className)}>
          <div className="relative">
            <FormControl>
              <Comp
                {...props}
                {...field}
                type={isPassword ? (show ? "text" : "password") : type}
                rows={multiline ? rows : undefined}
                placeholder=" "
                className={cn(
                  "peer w-full rounded-md border border-border bg-background px-4 text-sm shadow-none transition-colors placeholder:text-transparent focus-visible:border-accent focus-visible:ring-0 focus-visible:ring-offset-0 aria-[invalid=true]:border-destructive",
                  multiline ? "min-h-[104px] pt-4" : "h-12",
                  isPassword && "pr-11",
                )}
              />
            </FormControl>
            <FormLabel
              className={cn(
                "pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-background px-1 text-xs font-medium text-muted-foreground transition-all duration-150",
                "peer-placeholder-shown:left-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
                multiline
                  ? "peer-placeholder-shown:top-6"
                  : "peer-placeholder-shown:top-1/2",
                "peer-focus:left-3 peer-focus:top-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-accent",
              )}
            >
              {label}
            </FormLabel>
            {isPassword && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {hint && <p className="px-1 text-xs text-muted-foreground">{hint}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
