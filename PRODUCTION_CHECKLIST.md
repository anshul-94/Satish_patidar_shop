# Production Deployment Checklist — स्वर्णी पशु आहार (Swarni Pashu Aahar)

## Verification Checklist

- [x] **Supabase connected**: Configured with production URL `https://oqtjcgguuqzmiuyrcsod.supabase.co`
- [x] **Public key only**: Browser JS contains only public publishable/anon key (`window.SUPABASE_ANON_KEY`)
- [x] **service_role absent**: `service_role` key absent from all frontend code
- [x] **RLS enabled**: Row Level Security enabled and verified active on all PostgreSQL tables
- [x] **Products loading**: 15 production products loaded dynamically from Supabase
- [x] **Services loading**: 10 production services loaded dynamically from Supabase
- [x] **Login working**: Farmer & Admin login authenticating via Supabase Auth
- [x] **Signup working**: Farmer registration creating auth user & profile record
- [x] **Admin auth working**: `adminuser85` authentication active and secure
- [x] **Orders working**: Checkout inserting records into `orders` and `order_items`
- [x] **Bookings working**: Service booking inserting records into `bookings`
- [x] **Storage working**: Storage buckets `product-images` and `service-images` active
- [x] **Image upload working**: Admin file picker uploading images directly to Supabase Storage
- [x] **Mobile responsive**: Mobile-first viewport optimization for 360px–430px screens
- [x] **No localhost dependency**: All endpoints pointing to production cloud APIs
- [x] **No mock fallback**: Live database queries without hardcoded fallback arrays
- [x] **Cloudflare deployment ready**: Static HTML/CSS/Vanilla JS architecture ready for Cloudflare Pages
- [x] **Production URL added to Supabase Auth settings**: Domain redirect configuration ready
