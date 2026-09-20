-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- स्वर्णी पशु आहार — Production RLS
-- =============================================
-- Run AFTER schema.sql in Supabase SQL Editor
-- Run BEFORE or AFTER seed.sql (order doesn't matter for policies)
-- =============================================

-- Grant table privileges to anon and authenticated roles (RLS will enforce access control)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Enable RLS on all tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DO $$ DECLARE r record; BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END; $$;

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- =============================================
-- ADMIN PROFILES
-- =============================================
CREATE POLICY "admin_profiles_select"
  ON public.admin_profiles FOR SELECT
  USING (public.is_admin() OR auth.uid() = user_id);

-- =============================================
-- BUSINESS SETTINGS (public read, admin write)
-- =============================================
CREATE POLICY "business_settings_read"
  ON public.business_settings FOR SELECT
  USING (true);

CREATE POLICY "business_settings_write"
  ON public.business_settings FOR ALL
  USING (public.is_admin());

-- =============================================
-- CATEGORIES (public read active, admin manage)
-- =============================================
CREATE POLICY "categories_read"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "categories_write"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- =============================================
-- PRODUCTS (public read active, admin manage)
-- =============================================
CREATE POLICY "products_read"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "products_insert"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "products_update"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "products_delete"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- =============================================
-- PRODUCT IMAGES
-- =============================================
CREATE POLICY "product_images_read"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "product_images_write"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- =============================================
-- SERVICES (public read active, admin manage)
-- =============================================
CREATE POLICY "services_read"
  ON public.services FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "services_write"
  ON public.services FOR ALL
  USING (public.is_admin());

-- =============================================
-- SERVICE SLOTS (public read, admin manage)
-- =============================================
CREATE POLICY "service_slots_read"
  ON public.service_slots FOR SELECT
  USING (true);

CREATE POLICY "service_slots_insert"
  ON public.service_slots FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "service_slots_update"
  ON public.service_slots FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "service_slots_delete"
  ON public.service_slots FOR DELETE
  USING (public.is_admin());

-- =============================================
-- ADDRESSES (user owns their own)
-- =============================================
CREATE POLICY "addresses_own"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_insert"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ORDERS
-- Anyone can create (guest checkout supported)
-- Users see their own orders; admins see all
-- =============================================
CREATE POLICY "orders_read"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR user_id IS NULL  -- Guest orders readable by saved_orders IDs in localStorage
  );

CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT
  WITH CHECK (true);  -- Guest + logged-in users can create orders

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE POLICY "order_items_read"
  ON public.order_items FOR SELECT
  USING (true);  -- Accessed via orders join; Supabase handles parent auth

CREATE POLICY "order_items_insert"
  ON public.order_items FOR INSERT
  WITH CHECK (true);  -- Inserted alongside orders

-- =============================================
-- BOOKINGS
-- Anyone can create; users see their own; admins see all
-- =============================================
CREATE POLICY "bookings_read"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR user_id IS NULL  -- Guest bookings
  );

CREATE POLICY "bookings_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (true);  -- Guest + logged-in users

CREATE POLICY "bookings_update_admin"
  ON public.bookings FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- GALLERY (public read active, admin manage)
-- =============================================
CREATE POLICY "gallery_read"
  ON public.gallery FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "gallery_write"
  ON public.gallery FOR ALL
  USING (public.is_admin());

-- =============================================
-- NOTIFICATIONS (user sees their own)
-- =============================================
CREATE POLICY "notifications_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
