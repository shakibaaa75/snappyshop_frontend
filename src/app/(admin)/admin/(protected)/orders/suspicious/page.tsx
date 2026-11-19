import { AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock Suspicious Orders - High value COD or multiple failures
const suspiciousOrders = [
  {
    id: "ORD-9901",
    customer: "Unknown User",
    total: 45000,
    method: "COD",
    reason: "High Value COD",
    risk: "High",
  },
  {
    id: "ORD-9905",
    customer: "Rahim Hasan",
    total: 1200,
    method: "COD",
    reason: "3 previous failed deliveries",
    risk: "Medium",
  },
  {
    id: "ORD-9912",
    customer: "Fake Store Test",
    total: 8500,
    method: "COD",
    reason: "Shipping mismatch",
    risk: "High",
  },
];

export default function SuspiciousOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Critical Business Rule Enforcement</p>
          <p className="mt-1 opacity-90">
            Cash on Delivery (COD) orders are not treated as genuine sales until
            successfully delivered and verified by the Go backend. Suspicious
            patterns are flagged automatically.
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-primary">
        Flagged / Suspicious Orders
      </h1>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3">Order ID</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Risk Level</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {suspiciousOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-6 py-4 font-medium whitespace-nowrap">
                  {order.id}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {order.reason}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline">{order.method}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      order.risk === "High" ? "destructive" : "secondary"
                    }
                  >
                    {order.risk}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                  ৳{order.total.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
