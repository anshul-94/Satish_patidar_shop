// =============================================
// Swarni Pashu Aahar — Unified Auth Module
// Uses real Supabase Auth (no Python server)
// =============================================
//
// FARMER LOGIN:  mobile number (10 digits) + password
// ADMIN LOGIN:   adminuser85 + adminuser85
//
// Supabase stores mobile as email: {mobile}@swarni.app
// Admin is stored as: admin@swarni.app
// =============================================

const ADMIN_EMAIL    = 'admin@swarni.app';
const MOBILE_SUFFIX  = '@swarni.app';

// -------------------------------------------
// Helpers: mobile ↔ Supabase email
// -------------------------------------------
function mobileToEmail(mobile) {
  if (mobile === 'adminuser85') return ADMIN_EMAIL;
  return `${mobile}${MOBILE_SUFFIX}`;
}

// -------------------------------------------
// Session Management (localStorage cache)
// -------------------------------------------
function _saveSession(user) {
  try {
    localStorage.setItem('swarni_user', JSON.stringify(user));
  } catch(e) {}
}

function _clearSession() {
  localStorage.removeItem('swarni_user');
  localStorage.removeItem('swarni_token');
  localStorage.removeItem('swarni_cart');
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('swarni_user');
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem('swarni_token') || null;
}

function isAuthenticated() {
  return !!getCurrentUser();
}

function isAdmin() {
  const u = getCurrentUser();
  return !!(u && (u.role === 'admin' || u.mobile === 'adminuser85' || u.email === ADMIN_EMAIL));
}

// -------------------------------------------
// LOGIN
// -------------------------------------------
async function login(identifier, password) {
  identifier = (identifier || '').trim();
  password   = (password   || '').trim();

  if (!identifier) throw new Error('मोबाइल नंबर डालें');
  if (!password)   throw new Error('पासवर्ड डालें');

  // Validate: admin OR 10-digit mobile
  if (identifier !== 'adminuser85') {
    if (!/^\d{10}$/.test(identifier)) {
      throw new Error('सही 10 अंकों का मोबाइल नंबर डालें');
    }
  }

  const email = mobileToEmail(identifier);

  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Supabase auth error:', error);
      console.error('MESSAGE:', error.message);
      console.error('STATUS:', error.status);
      console.error('CODE:', error.code || error.error_code);
      throw new Error('पासवर्ड गलत है।');
    }

    const supaUser = data.user;
    const session  = data.session;

    // Build our user object
    const userObj = {
      id:     supaUser.id,
      email:  supaUser.email,
      mobile: identifier === 'adminuser85' ? 'adminuser85' : identifier,
      role:   supaUser.email === ADMIN_EMAIL ? 'admin' : 'farmer',
    };

    _saveSession(userObj);
    if (session?.access_token) {
      localStorage.setItem('swarni_token', session.access_token);
    }

    return userObj;

  } catch(err) {
    if (err.message && !err.message.toLowerCase().includes('supabase') && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
    throw new Error('पासवर्ड गलत है।');
  }
}

// -------------------------------------------
// SIGNUP (Farmer only — mobile + password)
// -------------------------------------------
async function signup(mobile, password, confirmPassword) {
  const cleanMobile = (mobile || '').trim().replace(/\D/g, '');
  password          = (password        || '').trim();
  confirmPassword   = (confirmPassword || '').trim();

  if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
    throw new Error('सही 10 अंकों का मोबाइल नंबर डालें');
  }
  if (!password || password.length < 6) {
    throw new Error('पासवर्ड कम से कम 6 अक्षर का होना चाहिए');
  }
  if (password !== confirmPassword) {
    throw new Error('दोनों पासवर्ड एक जैसे होने चाहिए');
  }

  const email = mobileToEmail(cleanMobile);
  const sb = getSupabase();

  let signupData = null;
  let signupError = null;

  try {
    const res = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { mobile: cleanMobile, role: 'farmer' },
        emailRedirectTo: undefined,
      }
    });
    signupData = res.data;
    signupError = res.error;
  } catch(e) {
    signupError = e;
  }

  if (signupError) {
    console.error('FARMER SIGNUP ERROR:', signupError);
    console.error('MESSAGE:', signupError.message);
    console.error('STATUS:', signupError.status);
    console.error('CODE:', signupError.code || signupError.error_code);

    const errMsg = (signupError.message || '').toLowerCase();
    const errCode = (signupError.code || signupError.error_code || '').toLowerCase();

    // 1. User already registered / duplicate mobile account
    if (errMsg.includes('already registered') || errMsg.includes('already exists') || errCode === 'user_already_exists' || signupError.status === 422) {
      try {
        const loginResult = await login(cleanMobile, password);
        return { ...loginResult, already_existed: true };
      } catch(loginErr) {
        const customErr = new Error('यह मोबाइल नंबर पहले से पंजीकृत है। कृपया सही पासवर्ड से लॉगिन करें।');
        customErr.code = 'user_already_exists';
        throw customErr;
      }
    }

    // 2. Email send rate limit (HTTP 429) fallback
    if (errMsg.includes('rate limit') || errCode === 'over_email_send_rate_limit' || signupError.status === 429) {
      try {
        const loginResult = await login(cleanMobile, password);
        return { ...loginResult, already_existed: true };
      } catch(loginErr) {
        throw new Error('खाता बन गया है या सर्वर व्यस्त है। कृपया सीधे लॉगिन करें।');
      }
    }

    // 3. Other auth error
    throw new Error(signupError.message || 'खाता नहीं बन पाया। दोबारा कोशिश करें।');
  }

  // Handle successful signup session
  if (signupData?.session) {
    const userObj = {
      id:     signupData.user.id,
      email:  signupData.user.email,
      mobile: cleanMobile,
      role:   'farmer',
    };
    _saveSession(userObj);
    if (signupData.session?.access_token) {
      localStorage.setItem('swarni_token', signupData.session.access_token);
    }
    return { ...userObj, already_existed: false };
  }

  // Fallback: try immediate login if session was not attached (e.g. email confirmation mode)
  try {
    const loginResult = await login(cleanMobile, password);
    return { ...loginResult, already_existed: false };
  } catch(loginErr) {
    return {
      id: signupData?.user?.id || null,
      mobile: cleanMobile,
      role: 'farmer',
      already_existed: false,
      needs_confirm: true,
    };
  }
}

// -------------------------------------------
// SIGN OUT
// -------------------------------------------
async function signOut() {
  try {
    const sb = getSupabase();
    await sb.auth.signOut();
  } catch(e) {
    console.warn('Supabase signout error (ignored):', e);
  }
  _clearSession();
  window.location.href = 'index.html';
}

// -------------------------------------------
// AUTH GUARDS
// -------------------------------------------
function requireAuth(redirectUrl) {
  if (!isAuthenticated()) {
    const target = redirectUrl || (window.location.pathname.split('/').pop() || 'index.html');
    window.location.href = `signup.html?redirect=${encodeURIComponent(target)}`;
    return null;
  }
  return getCurrentUser();
}

async function requireAdmin() {
  const user = getCurrentUser();
  if (!user || !isAdmin()) {
    window.location.href = 'admin-login.html';
    return null;
  }

  // Re-verify session is still valid with Supabase
  try {
    const sb = getSupabase();
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
      _clearSession();
      window.location.href = 'admin-login.html';
      return null;
    }
    // Refresh the local cache with latest session
    if (session?.access_token) {
      localStorage.setItem('swarni_token', session.access_token);
    }
  } catch(e) {
    console.warn('Admin session check error:', e);
    // Don't block if Supabase is temporarily unreachable
  }
  return user;
}

// -------------------------------------------
// NAV UI UPDATE
// -------------------------------------------
function updateNavAuth() {
  const user = getCurrentUser();

  // Desktop & header action buttons
  document.querySelectorAll('.nav-actions').forEach(container => {
    let authBtn = container.querySelector('.nav-auth-btn');
    if (!authBtn) {
      authBtn = document.createElement('a');
      authBtn.className = 'nav-btn nav-auth-btn hindi';
      Object.assign(authBtn.style, {
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.9rem',
        fontWeight: '600',
        padding: '6px 12px',
        borderRadius: '8px',
        background: 'var(--soft-green)',
        color: 'var(--dark-green)',
        border: '1px solid var(--border)',
      });
      container.insertBefore(authBtn, container.firstChild);
    }
    if (user) {
      if (isAdmin()) {
        authBtn.href = 'admin.html';
        authBtn.innerHTML = '👤 Admin';
      } else {
        authBtn.href = 'orders.html';
        authBtn.innerHTML = `👤 ${user.mobile ? user.mobile.slice(-4) : 'खाता'}`;
        authBtn.title = `लॉगिन: ${user.mobile || ''}`;
      }
    } else {
      authBtn.href = 'login.html';
      authBtn.innerHTML = '👤 Login';
    }
  });

  // Mobile menu
  document.querySelectorAll('.mobile-menu').forEach(menu => {
    let mobileAuthLink = menu.querySelector('.mobile-auth-link');
    if (!mobileAuthLink) {
      mobileAuthLink = document.createElement('a');
      mobileAuthLink.className = 'nav-link mobile-auth-link hindi';
      menu.appendChild(mobileAuthLink);
    }
    let logoutLink = menu.querySelector('.mobile-logout-link');
    if (user) {
      if (isAdmin()) {
        mobileAuthLink.href = 'admin.html';
        mobileAuthLink.innerHTML = '👤 Admin Dashboard';
      } else {
        mobileAuthLink.href = 'orders.html';
        mobileAuthLink.innerHTML = `📦 मेरे ऑर्डर (${user.mobile || ''})`;
      }
      if (!logoutLink) {
        logoutLink = document.createElement('a');
        logoutLink.className = 'nav-link mobile-logout-link hindi';
        logoutLink.style.color = '#DC2626';
        logoutLink.href = '#';
        logoutLink.onclick = (e) => { e.preventDefault(); signOut(); };
        logoutLink.innerHTML = '🚪 लॉगआउट';
        menu.appendChild(logoutLink);
      }
    } else {
      mobileAuthLink.href = 'login.html';
      mobileAuthLink.innerHTML = '👤 लॉगिन / नया खाता';
      if (logoutLink) logoutLink.remove();
    }
  });
}

// -------------------------------------------
// RESTORE SESSION ON PAGE LOAD
// (Keeps Supabase session in sync with localStorage)
// -------------------------------------------
async function restoreSupabaseSession() {
  try {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      const email = session.user.email || '';
      const isAdminUser = email === ADMIN_EMAIL;
      const mobile = isAdminUser
        ? 'adminuser85'
        : email.replace(MOBILE_SUFFIX, '');
      const userObj = {
        id:     session.user.id,
        email:  email,
        mobile: mobile,
        role:   isAdminUser ? 'admin' : 'farmer',
      };
      _saveSession(userObj);
      localStorage.setItem('swarni_token', session.access_token || '');
    }
    // If no session, clear stale localStorage data
    else {
      const localUser = getCurrentUser();
      if (localUser) {
        // Supabase says no session but we have local data — clear it
        _clearSession();
      }
    }
  } catch(e) {
    // Non-critical — offline/unconfigured Supabase
    console.warn('Session restore skipped:', e.message);
  }
}

// Auto-restore session when auth.js loads
if (typeof getSupabase === 'function' &&
    typeof window.SUPABASE_URL === 'string' &&
    window.SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && 
    window.SUPABASE_URL !== '') {
  restoreSupabaseSession();
}

// -------------------------------------------
// Global Exports
// -------------------------------------------
window.getCurrentUser      = getCurrentUser;
window.getAuthToken        = getAuthToken;
window.isAuthenticated     = isAuthenticated;
window.isAdmin             = isAdmin;
window.login               = login;
window.signup              = signup;
window.signUp              = (mobile, pass) => signup(mobile, pass, pass);
window.signIn              = (mobile, pass) => login(mobile, pass);
window.adminLogin          = (id, pass)     => login(id, pass);
window.signOut             = signOut;
window.requireAuth         = requireAuth;
window.requireAdmin        = requireAdmin;
window.updateNavAuth       = updateNavAuth;
window.restoreSupabaseSession = restoreSupabaseSession;
