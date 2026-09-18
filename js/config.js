// =============================================
// SUPABASE CONFIGURATION
// स्वर्णी पशु आहार — Production Config
// =============================================
//
// ⚠️  SETUP REQUIRED:
// 1. Go to https://supabase.com → Your Project → Settings → API
// 2. Copy "Project URL"  → paste below as SUPABASE_URL
// 3. Copy "anon public"  → paste below as SUPABASE_ANON_KEY
//
// ❌ NEVER paste the service_role key here.
// ❌ NEVER commit real keys to a public GitHub repository.
//
// =============================================

// Supabase configuration is now in supabase-config.js
// =============================================
// APP CONFIGURATION
// =============================================
const APP_CONFIG = {
  appName:         'स्वर्णी पशु आहार',
  appNameEn:       'Swarni Pashu Aahar',
  whatsappNumber:  '918120860801',
  currency:        'INR',
  currencySymbol:  '₹',
  dateLocale:      'hi-IN',
  itemsPerPage:    12,
  deliveryCharge:  50,
  freeDeliveryAbove: 0,    // set to e.g. 500 for free delivery above ₹500
  storageBucket:   'product-images',
  serviceImagesBucket: 'service-images',
};

// =============================================
// ENVIRONMENT DETECTION
// =============================================
const IS_DEV = (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1')
);

// Export
window.APP_CONFIG        = APP_CONFIG;
window.IS_DEV            = IS_DEV;
