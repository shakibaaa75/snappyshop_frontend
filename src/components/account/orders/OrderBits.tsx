import Image from "next/image";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import type {
  BuyerOrderLine,
  BuyerOrderStatus,
  IssueStatus,
  IssueType,
} from "@/lib/api/buyerOrders";

export const STATUS_LABEL: Record<BuyerOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<BuyerOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: { status: BuyerOrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  not_received: "I haven't received my order",
  wrong_item: "I received the wrong item",
  damaged: "An item arrived damaged",
  missing_item: "An item is missing",
  refund_request: "I want a refund",
  other: "Something else",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Waiting for seller",
  resolved: "Resolved",
  rejected: "Closed without a fix",
  withdrawn: "Withdrawn",
};

export const ISSUE_STATUS_STYLE: Record<IssueStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-neutral-200 text-neutral-600",
};

/** Product thumbnail: the photo, or the seller's emoji on a tinted tile. */
export function OrderThumb({
  line,
  className,
}: {
  line: BuyerOrderLine;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 text-2xl",
        className,
      )}
      style={
        line.imageUrl
          ? undefined
          : { backgroundColor: `hsl(${line.hue || 0} 70% 92%)` }
      }
    >
      {line.imageUrl ? (
        <Image
          src={img(line.imageUrl, { width: 160, height: 160 })}
          alt={line.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden>{line.emoji || "🛍️"}</span>
      )}
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
