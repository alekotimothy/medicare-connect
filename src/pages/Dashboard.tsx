import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/OrderTracker";
import { Plus, Pill, Calendar, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  status: "pending_verification" | "verified" | "out_for_delivery" | "delivered" | "cancelled";
  delivery_address: string;
  delivery_date: string;
  delivery_time: string | null;
  created_at: string;
  prescriptions?: { medication_name: string; dosage: string | null; duration_days: number } | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, prescriptions(medication_name, dosage, duration_days)")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as any) ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("orders-patient")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `patient_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My orders</h1>
            <p className="text-muted-foreground">Track every prescription, every step.</p>
          </div>
          <Button asChild className="bg-gradient-mint text-primary hover:opacity-90 shadow-glow">
            <Link to="/new-order"><Plus className="mr-2 h-4 w-4" />New prescription</Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-gradient-card p-12 text-center">
            <Pill className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">No orders yet</h2>
            <p className="mt-1 text-muted-foreground">Submit your first prescription to get started.</p>
            <Button asChild className="mt-5 bg-gradient-mint text-primary hover:opacity-90">
              <Link to="/new-order"><Plus className="mr-2 h-4 w-4" />New prescription</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((o) => (
              <article key={o.id} className="rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:shadow-elegant">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">
                        {o.prescriptions?.medication_name ?? "Prescription"}
                      </h3>
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                        {o.prescriptions?.duration_days ?? 30} days
                      </span>
                    </div>
                    {o.prescriptions?.dosage && <p className="text-sm text-muted-foreground">{o.prescriptions.dosage}</p>}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Order #{o.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />
                    {format(new Date(o.delivery_date), "MMM d, yyyy")}{o.delivery_time && ` · ${o.delivery_time}`}
                  </div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{o.delivery_address}</div>
                </div>

                <div className="mt-6">
                  <OrderTracker status={o.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
