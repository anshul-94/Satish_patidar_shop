# 🚀 DEPLOYMENT GUIDE — स्वर्णी पशु आहार
### Supabase + Cloudflare Pages — Step by Step

---

## PART 1: SUPABASE SETUP

### Step 1 — Create Supabase Account
1. Go to **https://supabase.com**
2. Click **Start your project** → Sign up (free tier is enough)

### Step 2 — Create New Project
1. Click **New Project**
2. Fill in:
   - **Name:** `swarni-pashu-aahar`
   - **Database Password:** Create a strong password (save it somewhere safe)
   - **Region:** `ap-south-1` (Mumbai — closest to India)
3. Click **Create new project**
4. Wait ~2 minutes for setup to complete

### Step 3 — Get Your API Keys
1. Go to **Settings** → **API** (left sidebar)
2. Note down:
   - **Project URL** → e.g. `https://xyzabcdef.supabase.co`
   - **anon / public key** → starts with `eyJ...`
   
> ⚠️ **NEVER copy the `service_role` key into your frontend code**

### Step 4 — Run Database Schema
1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file: `supabase/schema.sql`
4. Copy the entire content and paste it into the SQL Editor
5. Click **Run** (▶ button)
6. You should see: `Success. No rows returned.`

### Step 5 — Run RLS Policies
1. Open `supabase/policies.sql`
2. Copy and paste into a **New query** in SQL Editor
3. Click **Run**

### Step 6 — Run Seed Data
1. Open `supabase/seed.sql`
2. Copy and paste into a **New query** in SQL Editor
3. Click **Run**
4. You should now have 15 products and 10 services in the database

### Step 7 — Create Storage Buckets
**Option A — Via Dashboard (Recommended):**
1. Go to **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `product-images`, toggle **Public bucket** ON
4. Click **Create bucket**
5. Repeat: create `service-images`, also **Public bucket** ON

**Option B — Via SQL:**
1. Open `supabase/storage_policies.sql`
2. Run in SQL Editor

### Step 8 — Apply Storage Policies
1. Open `supabase/storage_policies.sql`
2. Scroll past the bucket creation INSERT statements
3. Copy and run only the `CREATE POLICY` statements

### Step 9 — Configure Supabase Auth
1. Go to **Authentication** → **Settings**
2. Under **Email Auth**: Make sure it's enabled
3. **Disable email confirmations**:
   - Toggle OFF: "Enable email confirmations"
   - This allows instant login after signup (mobile farmers don't have email)
4. **Site URL**: Enter `http://localhost:8001` for now (update after Cloudflare deployment)
5. **Redirect URLs**: Add:
   ```
   http://localhost:8001/**
   ```
   (Add your Cloudflare URL here after deployment)

### Step 10 — Create Admin User
1. Go to **Authentication** → **Users** → **Invite user**
2. Email: `admin@swarni.app`
3. After user is created, click on the user to get their **User ID** (UUID)
4. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO public.admin_profiles (user_id, role)
   VALUES ('PASTE-ADMIN-USER-ID-HERE', 'admin')
   ON CONFLICT (user_id) DO NOTHING;
   ```
5. Now set the admin password:
   - Go to **Authentication** → **Users**
   - Find `admin@swarni.app`
   - Click **Send password reset** OR use **Update user** to set password to `adminuser85`

---

## PART 2: CONFIGURE THE PROJECT

### Step 11 — Add Supabase Keys to Project
1. Open: `js/config.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';  // ← Your real URL
   const SUPABASE_ANON_KEY = 'eyJ...your_anon_key...';            // ← Your real anon key
   ```
3. Save the file

### Step 12 — Test Locally
1. Make sure the server is running:
   ```bash
   cd "/Users/vijaypatidar/Desktop/satish patidar"
   python3 -m http.server 8001
   ```
2. Open `http://localhost:8001`
3. Test:
   - Products load from Supabase ✓
   - Farmer signup works ✓
   - Farmer login works ✓
   - Add to cart ✓
   - Place order (saves to Supabase `orders` table) ✓
   - Admin login at `admin-login.html` with `adminuser85` / `adminuser85` ✓
   - Admin can add product with image upload ✓

---

## PART 3: GITHUB

### Step 13 — Push to GitHub
1. Create a new repository at https://github.com/new
   - Name: `swarni-pashu-aahar`
   - Set to **Private** (recommended)
2. Initialize and push:
   ```bash
   cd "/Users/vijaypatidar/Desktop/satish patidar"
   git init
   git add .
   git commit -m "Initial commit — production ready"
   git remote add origin https://github.com/YOUR_USERNAME/swarni-pashu-aahar.git
   git push -u origin main
   ```

> ⚠️ Make sure `.gitignore` is in place before pushing. `server.py`, `*.db`, `server.log` will be excluded automatically.

---

## PART 4: CLOUDFLARE PAGES

### Step 14 — Create Cloudflare Account
1. Go to **https://cloudflare.com**
2. Sign up (free tier works)

### Step 15 — Create Pages Project
1. Go to **Workers & Pages** (left sidebar)
2. Click **Create application** → **Pages** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub
4. Select the `swarni-pashu-aahar` repository

### Step 16 — Configure Build Settings
| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | *(leave empty)* |
| **Build output directory** | `/` |
| **Root directory** | `/` |

Click **Save and Deploy**

### Step 17 — Wait for Deployment
Cloudflare will deploy in ~1-2 minutes.
You'll get a URL like: `https://swarni-pashu-aahar.pages.dev`

### Step 18 — Update Supabase Auth Settings
1. Go back to **Supabase** → **Authentication** → **URL Configuration**
2. Add your Cloudflare URL:
   - **Site URL**: `https://swarni-pashu-aahar.pages.dev`
   - **Redirect URLs**: Add `https://swarni-pashu-aahar.pages.dev/**`
3. Save

### Step 19 — Add Custom Domain (Optional)
1. In Cloudflare Pages → your project → **Custom domains**
2. Add your domain name

---

## PART 5: POST-DEPLOYMENT TESTING

### Step 20 — Test Live Site (Mobile)
Open on your Android phone: `https://swarni-pashu-aahar.pages.dev`

Test these flows:
- [ ] Products page loads with real data from Supabase
- [ ] Services page loads with real data
- [ ] Farmer can sign up with mobile number
- [ ] Farmer can log in
- [ ] Add product to cart
- [ ] Place order → check Supabase `orders` table
- [ ] Book a service → check Supabase `bookings` table
- [ ] Admin login with `adminuser85` / `adminuser85`
- [ ] Admin dashboard shows real order counts
- [ ] Admin can add product with photo upload (from phone gallery)
- [ ] Uploaded image appears in Supabase Storage
- [ ] Uploaded image URL saved in `products.image_url`
- [ ] No console errors

---

## QUICK REFERENCE

| Secret | Where to Find | Where to Paste |
|--------|--------------|----------------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL | `js/config.js` line 16 |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | `js/config.js` line 17 |
| Admin User ID | Supabase → Auth → Users → `admin@swarni.app` | `admin_setup.sql` |

## SQL EXECUTION ORDER

```
1. supabase/schema.sql          ← Run first
2. supabase/seed.sql            ← Run second  
3. supabase/policies.sql        ← Run third
4. supabase/storage_policies.sql ← Run fourth
5. Create admin via Dashboard   ← Manual step
```

## WHAT DOES NOT REQUIRE A SERVER

This is a **100% static site**. No Node.js, no Python server needed in production.
Cloudflare Pages serves the HTML/CSS/JS files.
All data operations go directly from the browser to Supabase.
