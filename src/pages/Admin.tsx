import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Loader2, Truck, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdminOrder {
  id: string;
  status: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time: string | null;
  created_at: string;
  patient_id: string;
  driver_id: string | null;
  prescriptions?: { medication_name: string; dosage: string | null; duration_days: number } | null;
  profiles?: { full_name: string | null; phone: string | null } | null;
}

const statusOptions = [
  { value: "pending_verification", label: "Pending verification" },
  { value: "verified", label: "Verified" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const Admin = () => {
  const { user, isAdmin, loading: authLoading, session } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, prescriptions(medication_name, dosage, duration_days), profiles!orders_patient_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false });
    setOrders((data as any) ?? []);

    const { data: driverRoles } = await supabase
      .from("user_roles")
      .select("user_id, profiles!inner(full_name)")
      .eq("role", "driver");
    setDrivers(
      (driverRoles as any)?.map((r: any) => ({ id: r.user_id, name: r.profiles?.full_name || "Driver" })) ?? []
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "verified") patch.verified_at = new Date().toISOString();
    if (status === "out_for_delivery") patch.out_for_delivery_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); load(); }
  };

  const assignDriver = async (id: string, driver_id: string) => {
    const { error } = await supabase.from("orders").update({ driver_id: driver_id === "unassigned" ? null : driver_id }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Driver assigned"); load(); }
  };

  const copyApiUrl = () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`;
    navigator.clipboard.writeText(url);
    toast.success("API endpoint copied — auth with Bearer <admin JWT>");
  };

  if (authLoading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-md py-20">
          <div className="rounded-2xl border border-border bg-gradient-card p-8 text-center shadow-card">
            <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
            <h1 className="mt-3 font-display text-xl font-semibold">Admin access required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account doesn't have the admin role yet. An existing admin can grant this from the user_roles table.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-5">Back to dashboard</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Dispatch console</h1>
            <p className="text-muted-foreground">{orders.length} orders · {drivers.length} drivers available</p>
          </div>
          <Button variant="outline" onClick={copyApiUrl}><Copy className="mr-2 h-4 w-4" />Copy REST API URL</Button>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Medication</th>
                  <th className="p-4">Delivery</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Driver</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border align-top hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium">{o.profiles?.full_name || "Patient"}</div>
                      <div className="text-xs text-muted-foreground">{o.profiles?.phone || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-1">#{o.id.slice(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{o.prescriptions?.medication_name}</div>
                      <div className="text-xs text-muted-foreground">{o.prescriptions?.dosage || "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.prescriptions?.duration_days}d supply</div>
                    </td>
                    <td className="p-4">
                      <div>{format(new Date(o.delivery_date), "MMM d")}</div>
                      <div className="text-xs text-muted-foreground">{o.delivery_time || "—"}</div>
                      <div className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">{o.delivery_address}</div>
                    </td>
                    <td className="p-4 min-w-[180px]">
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 min-w-[180px]">
                      <Select value={o.driver_id ?? "unassigned"} onValueChange={(v) => assignDriver(o.id, v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Assign…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          <Truck className="mr-1 inline h-3 w-3" /> Driver app and proof-of-delivery flow ship next. Drivers you assign here will see their queue once the driver dashboard is built.
        </p>
      </main>
    </div>
  );
};

export default Admin;
