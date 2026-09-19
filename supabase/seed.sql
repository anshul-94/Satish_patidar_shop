-- =============================================
-- SEED DATA — स्वर्णी पशु आहार
-- =============================================
-- Run AFTER schema.sql
-- Run BEFORE policies.sql (policies may block inserts)
--
-- IMPORTANT: Run as the postgres/service role user
-- in Supabase SQL Editor (not as anon)
-- =============================================

-- =============================================
-- 1. BUSINESS SETTINGS (Default row)
-- =============================================
INSERT INTO public.business_settings (
  id,
  business_name, business_name_hi, tagline_hi, tagline2_hi,
  owner_name, phone, whatsapp, address, village,
  delivery_available, delivery_charge, minimum_order,
  service_area, opening_time, closing_time
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Swarni Pashu Aahar', 'स्वर्णी पशु आहार',
  'पशुओं के स्वास्थ्य एवं बेहतर उत्पादन के लिए उत्तम गुणवत्ता वाला आहार',
  'स्वस्थ पशु - समृद्ध किसान',
  'सतीश पाटीदार', '8120860801', '8120860801',
  'कुरावर रोड, खरदोन कलां, अजय ऑनलाइन के पास', 'खरदोन कलां',
  true, 50.00, 200.00,
  'खरदोन कलां और आसपास के क्षेत्र', '08:00', '20:00'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. CATEGORIES
-- =============================================
INSERT INTO public.categories (id, name, name_hi, slug, icon, sort_order, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Animal Feed',       'पशु आहार',  'feed',       '🐄', 1, true),
  ('a0000001-0000-0000-0000-000000000002', 'Seeds',             'बीज',        'seeds',      '🌾', 2, true),
  ('a0000001-0000-0000-0000-000000000003', 'Grading Packs',     'ग्रेडिंग',   'grading',    '⚙️', 3, true),
  ('a0000001-0000-0000-0000-000000000004', 'Processing Packs',  'प्रोसेसिंग', 'processing', '🏭', 4, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PRODUCTS (15 realistic samples)
-- Admin can edit prices/stock after deployment
-- =============================================
INSERT INTO public.products (
  category_id, name, name_hi, description_hi,
  price, unit, weight, stock_quantity, is_active, featured, sort_order, image_url
) VALUES
(
  'a0000001-0000-0000-0000-000000000001',
  'Swarni Super', 'स्वर्णी सुपर पशु आहार',
  'उच्च दूध उत्पादन के लिए प्रीमियम पशु आहार। पोषण से भरपूर।',
  850, 'बोरी', '25 KG', 100, true, true, 1,
  'assets/images/product-super-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Swarni Silver', 'स्वर्णी सिल्वर पशु आहार',
  'संतुलित पोषण के साथ उच्च गुणवत्ता वाला पशु आहार।',
  950, 'बोरी', '25 KG', 100, true, true, 2,
  'assets/images/product-silver-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Swarni Pashu Aahar', 'स्वर्णी पशु आहार',
  'सभी प्रकार के पशुओं के लिए उत्तम संतुलित आहार।',
  1800, 'बोरी', '50 KG', 50, true, true, 3,
  'assets/images/product-large-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Dairy Special Feed', 'डेयरी स्पेशल पशु आहार',
  'डेयरी गाय और भैंस के लिए विशेष आहार। दूध बढ़ाने में सहायक।',
  980, 'बोरी', '25 KG', 60, true, true, 4,
  'assets/images/product-silver-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Kisan Pashu Aahar', 'किसान पशु आहार',
  'किसानों के लिए किफायती और पौष्टिक पशु आहार।',
  900, 'बोरी', '25 KG', 100, true, false, 5,
  'assets/images/product-large-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Bachha Pashu Aahar', 'बछड़ा पशु आहार',
  'बछड़ों और बछड़ियों के लिए विशेष पौष्टिक आहार।',
  750, 'बोरी', '20 KG', 40, true, false, 6,
  'assets/images/product-super-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Premium Mineral Mix', 'मिनरल मिक्सचर',
  'पशुओं के स्वास्थ्य के लिए आवश्यक खनिज तत्वों का मिश्रण।',
  450, 'पैकेट', '5 KG', 80, true, false, 7,
  'assets/images/product-silver-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Sarson Khali', 'सरसों खली',
  'उच्च प्रोटीन युक्त सरसों की खली। दूध उत्पादन बढ़ाने में सहायक।',
  650, 'बोरी', '25 KG', 70, true, false, 8,
  'assets/images/product-large-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Soybean Khali', 'सोयाबीन खली',
  'प्रोटीन से भरपूर सोयाबीन की खली।',
  700, 'बोरी', '25 KG', 60, true, false, 9,
  'assets/images/product-silver-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000001',
  'Kapas Khali', 'कपास खली',
  'पशुओं के लिए कपास की खली — प्रोटीन और ऊर्जा का स्रोत।',
  600, 'बोरी', '25 KG', 50, true, false, 10,
  'assets/images/product-large-feed.jpg'
),
(
  'a0000001-0000-0000-0000-000000000002',
  'Soybean Seed', 'सोयाबीन बीज',
  'उच्च उपज देने वाला सोयाबीन बीज।',
  2200, 'बोरी', '25 KG', 30, true, true, 11,
  'assets/images/service-soybean.jpg'
),
(
  'a0000001-0000-0000-0000-000000000002',
  'Chana Seed', 'चना बीज',
  'उच्च गुणवत्ता का चना बीज।',
  1900, 'बोरी', '25 KG', 30, true, true, 12,
  'assets/images/hero.jpg'
),
(
  'a0000001-0000-0000-0000-000000000002',
  'Wheat Seed', 'गेहूँ बीज',
  'प्रमाणित और उच्च उपज वाला गेहूँ बीज।',
  850, 'बोरी', '25 KG', 50, true, false, 13,
  'assets/images/hero.jpg'
),
(
  'a0000001-0000-0000-0000-000000000003',
  'Grading Service Pack', 'ग्रेडिंग सर्विस पैक',
  'अनाज की ग्रेडिंग के लिए विशेष पैक।',
  150, 'पैकेट', '100 KG', 50, true, false, 14,
  'assets/images/machine_front.jpg'
),
(
  'a0000001-0000-0000-0000-000000000004',
  'Processing Pack', 'प्रोसेसिंग पैक',
  'अनाज प्रोसेसिंग के लिए विशेष पैक।',
  180, 'पैकेट', '100 KG', 50, true, false, 15,
  'assets/images/machine_side.jpg'
);

-- =============================================
-- 4. SERVICES (10 Agricultural services)
-- =============================================
INSERT INTO public.services (
  name, name_hi, description, description_hi,
  price, unit, price_unit, price_unit_hi,
  image_url, is_active, featured, sort_order
) VALUES
(
  'Wheat Grading', 'गेहूँ ग्रेडिंग',
  'Professional wheat grading and cleaning service.',
  'हमारी मशीन से गेहूँ की पेशेवर ग्रेडिंग और सफाई।',
  90, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_front.jpg', true, true, 1
),
(
  'Soybean Grading', 'सोयाबीन ग्रेडिंग',
  'Soybean grading and cleaning service.',
  'सोयाबीन की मशीन से ग्रेडिंग और सफाई।',
  80, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/service-soybean.jpg', true, true, 2
),
(
  'Chana Grading', 'चना ग्रेडिंग',
  'High-quality chana grading service.',
  'चने की उच्च गुणवत्ता ग्रेडिंग सेवा।',
  100, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_side.jpg', true, true, 3
),
(
  'Wheat Processing', 'गेहूँ प्रोसेसिंग',
  'Complete wheat processing and cleaning.',
  'गेहूँ की पूर्ण प्रोसेसिंग और सफाई।',
  90, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_front.jpg', true, false, 4
),
(
  'Soybean Processing', 'सोयाबीन प्रोसेसिंग',
  'Advanced soybean processing service.',
  'सोयाबीन की उन्नत प्रोसेसिंग सेवा।',
  80, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/service-soybean.jpg', true, false, 5
),
(
  'Chana Processing', 'चना प्रोसेसिंग',
  'Gram / chana processing service.',
  'चना / ग्राम प्रोसेसिंग सेवा।',
  100, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_side.jpg', true, false, 6
),
(
  'Garlic Processing', 'लहसुन प्रोसेसिंग',
  'Garlic peeling and processing service.',
  'लहसुन छीलने और प्रोसेसिंग की सेवा।',
  120, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/service-garlic.jpg', true, false, 7
),
(
  'Seed Grading', 'बीज ग्रेडिंग',
  'Professional seed grading for all crops.',
  'सभी फसलों के बीजों की पेशेवर ग्रेडिंग।',
  150, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/service-seed-grading.jpg', true, false, 8
),
(
  'Agri Yield Cleaning', 'अनाज सफाई',
  'General agricultural yield cleaning service.',
  'सामान्य कृषि उपज सफाई सेवा।',
  80, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_front.jpg', true, false, 9
),
(
  'Other Grain Processing', 'अन्य अनाज प्रोसेसिंग',
  'Processing for specialized grains and crops.',
  'विशेष अनाज और फसलों की प्रोसेसिंग।',
  180, 'quintal', 'per quintal', 'प्रति क्विंटल',
  'assets/images/machine_side.jpg', true, false, 10
);
