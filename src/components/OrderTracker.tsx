import { Truck, CheckCircle2, Package, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending_verification" | "verified" | "out_for_delivery" | "delivered" | "cancelled";

const steps: { key: Status; label: string; icon: typeof Truck }[] = [
  { key: "pending_verification", label: "Submitted", icon: ClipboardCheck },
  { key: "verified", label: "Verified", icon: Package },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export const OrderTracker = ({ status }: { status: Status }) => {
  const activeIdx = steps.findIndex((s) => s.key === status);
  const idx = activeIdx === -1 ? 0 : activeIdx;
  const pct = (idx / (steps.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
      <div className="relative mt-2 mb-8 h-1.5 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-mint transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {idx < steps.length - 1 && idx >= 0 && (
          <div
            className="absolute -top-2.5 animate-float-truck transition-all duration-700"
            style={{ left: `calc(${pct}% - 12px)` }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-glow">
              <Truck className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const reached = i <= idx;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-smooth",
                reached
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-background text-muted-foreground",
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className={cn(
                "mt-2 text-xs font-medium",
                reached ? "text-foreground" : "text-muted-foreground"
              )}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
