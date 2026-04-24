import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  medication_name: z.string().trim().min(1, "Medication required").max(200),
  dosage: z.string().trim().max(200).optional(),
  instructions: z.string().trim().max(1000).optional(),
  delivery_address: z.string().trim().min(5, "Address required").max(500),
});

const NewOrder = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({
    medication_name: "",
    dosage: "",
    instructions: "",
    duration_days: "30",
    delivery_address: "",
    delivery_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    delivery_time: "morning",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      setProfile(data);
      if (data?.address) setForm((f) => ({ ...f, delivery_address: data.address }));
    });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.errors[0].message);
    }
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("prescriptions").upload(path, file);
        if (upErr) throw upErr;
        image_url = path;
      }

      const { data: rx, error: rxErr } = await supabase
        .from("prescriptions")
        .insert({
          patient_id: user.id,
          medication_name: form.medication_name,
          dosage: form.dosage || null,
          instructions: form.instructions || null,
          duration_days: parseInt(form.duration_days, 10),
          image_url,
          ocr_text: image_url ? "[OCR processing pending]" : null,
        })
        .select()
        .single();
      if (rxErr) throw rxErr;

      const { error: orderErr } = await supabase.from("orders").insert({
        patient_id: user.id,
        prescription_id: rx.id,
        delivery_address: form.delivery_address,
        delivery_date: form.delivery_date,
        delivery_time: form.delivery_time,
        status: "pending_verification",
      });
      if (orderErr) throw orderErr;

      toast.success("Order submitted! Track it on your dashboard.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit order");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="font-display text-3xl font-bold">New prescription</h1>
        <p className="text-muted-foreground">Fill in the details or upload a photo of your script.</p>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          {/* Image upload */}
          <div>
            <Label>Upload prescription image (optional)</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-smooth hover:border-accent hover:bg-accent/5">
              {file ? (
                <><ImageIcon className="h-8 w-8 text-accent" /><p className="mt-2 text-sm font-medium">{file.name}</p></>
              ) : (
                <><Upload className="h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Click to upload (JPG, PNG, PDF)</p></>
              )}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent" /> OCR placeholder — fields below will be reviewed by pharmacist.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Medication name *</Label>
              <Input value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} required maxLength={200} />
            </div>
            <div>
              <Label>Dosage</Label>
              <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 500mg twice daily" maxLength={200} />
            </div>
          </div>

          <div>
            <Label>Instructions</Label>
            <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} maxLength={1000} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Duration</Label>
              <Select value={form.duration_days} onValueChange={(v) => setForm({ ...form, duration_days: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delivery date</Label>
              <Input type="date" value={form.delivery_date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} required />
            </div>
            <div>
              <Label>Time window</Label>
              <Select value={form.delivery_time} onValueChange={(v) => setForm({ ...form, delivery_time: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8AM–12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM–4PM)</SelectItem>
                  <SelectItem value="evening">Evening (4PM–8PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Delivery address *</Label>
            <Textarea value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} rows={2} required maxLength={500} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-gradient-mint text-primary hover:opacity-90" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit order
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewOrder;
