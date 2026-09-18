-- =============================================
-- स्वर्णी पशु आहार — Complete Database Schema
-- Version 2 — Production Ready
-- =============================================
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
-- Run this FIRST, before policies.sql and seed.sql
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (Farmer accounts)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name    TEXT,
  phone        TEXT,           -- Mobile number (10 digits)
  email        TEXT,
  avatar_url   TEXT,
  village      TEXT,
  address      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADMIN PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role       TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUSINESS SETTINGS (Single row)
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_settings (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name     TEXT DEFAULT 'Swarni Pashu Aahar',
  business_name_hi  TEXT DEFAULT 'स्वर्णी पशु आहार',
  tagline_hi        TEXT DEFAULT 'पशुओं के स्वास्थ्य एवं बेहतर उत्पादन के लिए उत्तम गुणवत्ता वाला आहार',
  tagline2_hi       TEXT DEFAULT 'स्वस्थ पशु - समृद्ध किसान',
  owner_name        TEXT DEFAULT 'सतीश पाटीदार',
  phone             TEXT DEFAULT '8120860801',
  whatsapp          TEXT DEFAULT '8120860801',
  email             TEXT,
  address           TEXT DEFAULT 'कुरावर रोड, खरदोन कलां, अजय ऑनलाइन के पास',
  village           TEXT DEFAULT 'खरदोन कलां',
  maps_url          TEXT DEFAULT 'https://maps.google.com/maps?q=खरदोन+कलां+कुरावर+रोड',
  delivery_available  BOOLEAN DEFAULT TRUE,
  delivery_charge   NUMERIC(10,2) DEFAULT 50.00,
  minimum_order     NUMERIC(10,2) DEFAULT 200.00,
  service_area      TEXT DEFAULT 'खरदोन कलां और आसपास के क्षेत्र',
  opening_time      TEXT DEFAULT '08:00',
  closing_time      TEXT DEFAULT '20:00',
  about_text        TEXT DEFAULT 'स्वर्णी पशु आहार एक विश्वसनीय स्थानीय व्यवसाय है।',
  logo_url          TEXT,
  hero_image_url    TEXT DEFAULT 'assets/images/hero.jpg',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL,
  name_hi    TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  icon       TEXT DEFAULT '🌾',
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id    UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  name_hi        TEXT NOT NULL,
  description    TEXT,
  description_hi TEXT,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit           TEXT DEFAULT 'bag',
  weight         TEXT,
  stock_quantity INT DEFAULT 0,
  image_url      TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  featured       BOOLEAN DEFAULT FALSE,
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT IMAGES (multiple images per product)
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url  TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name           TEXT NOT NULL,
  name_hi        TEXT NOT NULL,
  description    TEXT,
  description_hi TEXT,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit           TEXT DEFAULT 'quintal',
  price_unit     TEXT DEFAULT 'per quintal',
  price_unit_hi  TEXT DEFAULT 'प्रति क्विंटल',
  image_url      TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  featured       BOOLEAN DEFAULT FALSE,
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE SLOTS (Time slot availability)
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_slots (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_id   UUID REFERENCES public.services(id) ON DELETE CASCADE,
  slot_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  capacity     INT DEFAULT 5,
  booked_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_blocked   BOOLEAN DEFAULT FALSE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, slot_date, start_time)
);

-- =============================================
-- ADDRESSES (Saved delivery addresses)
-- =============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  village_city  TEXT NOT NULL,
  area          TEXT,
  landmark      TEXT,
  full_address  TEXT NOT NULL,
  pincode       TEXT,
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number          TEXT UNIQUE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name         TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_email        TEXT,
  delivery_village_city TEXT NOT NULL,
  delivery_area         TEXT,
  delivery_landmark     TEXT,
  delivery_full_address TEXT NOT NULL,
  delivery_pincode      TEXT,
  subtotal              NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charge       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method        TEXT DEFAULT 'cod',
  order_status          TEXT DEFAULT 'pending'
                        CHECK (order_status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS (Historical snapshot)
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id                       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id                 UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id               UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot    TEXT NOT NULL,    -- Never changes even if product deleted
  product_name_hi_snapshot TEXT,
  quantity                 INT NOT NULL DEFAULT 1,
  unit_price               NUMERIC(10,2) NOT NULL,
  subtotal                 NUMERIC(10,2) NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_number        TEXT UNIQUE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id            UUID REFERENCES public.services(id) ON DELETE SET NULL,
  slot_id               UUID REFERENCES public.service_slots(id) ON DELETE SET NULL,
  service_name_snapshot TEXT NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  phone                 TEXT,
  customer_email        TEXT,
  quantity              NUMERIC(10,2) NOT NULL,
  quantity_unit         TEXT DEFAULT 'kg',
  unit                  TEXT DEFAULT 'kg',
  booking_date          DATE NOT NULL,
  start_time            TIME NOT NULL,
  end_time              TIME NOT NULL,
  location              TEXT,
  village               TEXT NOT NULL,
  landmark              TEXT,
  notes                 TEXT,
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','completed','cancelled')),
  rate_snapshot         NUMERIC(10,2) DEFAULT 0,
  total_amount          NUMERIC(10,2) DEFAULT 0,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GALLERY
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title      TEXT,
  title_hi   TEXT,
  category   TEXT DEFAULT 'general',
  image_url  TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  type           TEXT DEFAULT 'info',
  is_read        BOOLEAN DEFAULT FALSE,
  reference_type TEXT,
  reference_id   UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category   ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active     ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured   ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_service_slots_date  ON public.service_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_service_slots_svc   ON public.service_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_user         ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_number       ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_bookings_user       ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date       ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_service    ON public.bookings(service_id);

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER update_service_slots_updated_at
    BEFORE UPDATE ON public.service_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  -- Extract mobile from email (format: 1234567890@swarni.app)
  IF v_email LIKE '%@swarni.app' THEN
    v_phone := REPLACE(v_email, '@swarni.app', '');
  ELSE
    v_phone := COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.raw_user_meta_data->>'phone', NULL);
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    v_phone,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ADMIN CHECK FUNCTION (used by RLS policies)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ATOMIC BOOKING (prevents double-booking race condition)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_service_id    UUID,
  p_slot_id       UUID,
  p_booking_number TEXT,
  p_user_id       UUID,
  p_service_name  TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_quantity      NUMERIC,
  p_quantity_unit TEXT,
  p_booking_date  DATE,
  p_start_time    TIME,
  p_end_time      TIME,
  p_location      TEXT,
  p_village       TEXT,
  p_landmark      TEXT,
  p_notes         TEXT
)
RETURNS JSON AS $$
DECLARE
  v_slot    service_slots%ROWTYPE;
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_slot FROM public.service_slots WHERE id = p_slot_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Slot not found');
  END IF;
  IF v_slot.is_blocked THEN
    RETURN json_build_object('success', false, 'error', 'SLOT_BLOCKED');
  END IF;
  IF NOT v_slot.is_available THEN
    RETURN json_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;
  IF v_slot.booked_count >= v_slot.capacity THEN
    RETURN json_build_object('success', false, 'error', 'SLOT_FULL');
  END IF;

  UPDATE public.service_slots
  SET booked_count = booked_count + 1,
      is_available = CASE WHEN (booked_count + 1) >= capacity THEN FALSE ELSE TRUE END
  WHERE id = p_slot_id;

  INSERT INTO public.bookings (
    booking_number, user_id, service_id, slot_id, service_name_snapshot,
    customer_name, customer_phone, customer_email, quantity, quantity_unit,
    booking_date, start_time, end_time, location, village, landmark, notes, status
  ) VALUES (
    p_booking_number, p_user_id, p_service_id, p_slot_id, p_service_name,
    p_customer_name, p_customer_phone, p_customer_email, p_quantity, p_quantity_unit,
    p_booking_date, p_start_time, p_end_time, p_location, p_village, p_landmark, p_notes, 'pending'
  )
  RETURNING * INTO v_booking;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking.id,
    'booking_number', v_booking.booking_number
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
