
-- Enums
CREATE TYPE public.app_role AS ENUM ('patient','admin','driver');
CREATE TYPE public.order_status AS ENUM ('pending_verification','verified','out_for_delivery','delivered','cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  instructions TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  image_url TEXT,
  ocr_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending_verification',
  delivery_address TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TEXT,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Drivers view assigned patients" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(),'driver') AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.patient_id = profiles.id AND o.driver_id = auth.uid()
  )
);

-- RLS: user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RLS: prescriptions
CREATE POLICY "Patients view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Admins view all prescriptions" ON public.prescriptions FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- RLS: orders
CREATE POLICY "Patients view own orders" ON public.orders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage all orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Drivers view assigned orders" ON public.orders FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers update assigned orders" ON public.orders FOR UPDATE USING (auth.uid() = driver_id);

-- Storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions','prescriptions', false);

CREATE POLICY "Patients upload own prescriptions" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Patients view own prescription files" ON storage.objects FOR SELECT USING (
  bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins view all prescription files" ON storage.objects FOR SELECT USING (
  bucket_id = 'prescriptions' AND public.has_role(auth.uid(),'admin')
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
