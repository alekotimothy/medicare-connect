import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";
import { ArrowRight, Upload, Calendar, Truck, ShieldCheck, Bot, Clock } from "lucide-react";
import heroImg from "@/assets/hero-medi.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="container relative z-10 grid gap-12 py-20 md:grid-cols-2 md:py-28 lg:py-32">
          <div className="flex flex-col justify-center animate-fade-up">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Now delivering nationwide
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-balance md:text-5xl lg:text-6xl">
              Your prescriptions, <span className="text-accent">delivered</span> on your schedule.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-foreground/80">
              Upload a prescription, pick a delivery window, and track every step in real time. MediTrack handles the rest — securely and on time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-mint text-primary hover:opacity-90 shadow-glow">
                <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <a href="#how">How it works</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> HIPAA-grade security</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Same-day delivery</div>
              <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> AI assistant 24/7</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] bg-accent/20 blur-3xl" />
            <img
              src={heroImg}
              alt="MediTrack delivery illustration"
              width={1536}
              height={1024}
              className="relative w-full rounded-2xl shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Three steps. Zero pharmacy lines.</h2>
          <p className="mt-3 text-muted-foreground">Built for patients who deserve their time back.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Upload, title: "1. Upload", desc: "Snap a photo of your prescription or type the details. Our system reads and verifies it." },
            { icon: Calendar, title: "2. Schedule", desc: "Pick the date, time window, and refill duration — 30, 60, or 90 days." },
            { icon: Truck, title: "3. Track", desc: "Watch your order move from verified to delivered, in real time." },
          ].map((s) => (
            <div key={s.title} className="group rounded-2xl border border-border bg-gradient-card p-7 shadow-card transition-smooth hover:shadow-elegant hover:-translate-y-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-mint shadow-glow">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKING TEASER */}
      <section className="border-y border-border bg-gradient-card py-20">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Watch the truck. <span className="text-accent">Literally.</span></h2>
            <p className="mt-3 text-muted-foreground max-w-md">
              Every order updates live as it moves through verification, dispatch, and delivery. No more wondering "where's my refill?".
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Verified</span><span>Out for delivery</span><span>Delivered</span>
            </div>
            <div className="mt-3 relative h-2 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-gradient-mint" />
              <div className="absolute -top-1 left-[64%] animate-float-truck">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-glow">
                  <Truck className="h-2.5 w-2.5 text-accent" />
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Order #MT-1042 · Arriving today between 2–4 PM</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28">
        <div className="rounded-3xl bg-gradient-hero p-12 text-center text-primary-foreground shadow-elegant md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to stop chasing refills?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Create an account in 60 seconds and place your first order today.</p>
          <Button asChild size="lg" className="mt-8 bg-gradient-mint text-primary hover:opacity-90 shadow-glow">
            <Link to="/auth">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} MediTrack. Care delivered.</p>
          <p>Built for patients, prescribers, and pharmacies.</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
};

export default Landing;
