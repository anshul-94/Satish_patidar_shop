# स्वर्णी पशु आहार - Setup Guide

## STEP 1: Supabase Setup

1. supabase.com पर जाएं और Free Account बनाएं
2. New Project बनाएं: Name = "swarni-pashu-aahar", Region = Singapore
3. SQL Editor में ये तीन files क्रम से run करें:
   - supabase/schema.sql
   - supabase/seed.sql  
   - supabase/policies.sql
4. Project Settings > API से URL और anon key लें

## STEP 2: Config.js Update करें

js/config.js खोलें:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

## STEP 3: Admin Account बनाएं

1. login.html पर जाएं और admin email से account बनाएं
2. Supabase SQL Editor में run करें:

```sql
SELECT id, email FROM auth.users WHERE email = 'your-admin@email.com';
INSERT INTO public.admin_profiles (user_id, role)
VALUES ('USER_ID_FROM_ABOVE', 'super_admin');
```

3. admin-login.html पर जाएं और login करें

## STEP 4: Website चलाएं

VS Code में index.html खोलें > Right click > Open with Live Server

या Python से:
```bash
python3 -m http.server 8080
# http://localhost:8080 खोलें
```

---

## File Structure

```
satish patidar/
- index.html          (होमपेज)
- products.html       (पशु आहार उत्पाद)
- services.html       (सेवाएं)
- booking.html        (सेवा बुकिंग)
- cart.html           (कार्ट)
- checkout.html       (चेकआउट)
- orders.html         (ऑर्डर)
- login.html          (लॉगिन)
- account.html        (मेरा खाता)
- gallery.html        (गैलरी)
- about.html          (हमारे बारे में)
- contact.html        (संपर्क)
- admin.html          (Admin Panel)
- admin-login.html    (Admin Login)
- js/config.js        ← SUPABASE KEYS यहाँ बदलें
- supabase/schema.sql ← Database Tables
- supabase/seed.sql   ← Sample Data
- supabase/policies.sql ← Security
```

## Admin Panel Features

- Dashboard: Orders, bookings, revenue stats
- Products: Add/Edit/Delete products
- Categories: Category management
- Orders: View & update status
- Services: Add/Edit services  
- Bookings: Confirm/reject bookings
- Slots: Time slot management
- Gallery: Image management
- Settings: Business info update

## Business Info

- Business: Swarni Pashu Aahar
- Owner: Satish Patidar
- Phone: 8120860801
- Address: Kurawar Road, Khardon Kalan
