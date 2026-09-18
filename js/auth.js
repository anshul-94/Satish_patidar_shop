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
      if (error.message?.toLowerCase().includes('invalid login credentials') ||
          error.message?.toLowerCase().includes('email not confirmed') ||
          error.code === 'invalid_credentials') {
        throw new Error('मोबाइल नंबर या पासवर्ड सही नहीं है');
      }
      throw new Error('इंटरनेट में दिक्कत है। दोबारा कोशिश करें।');
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
    if (err.message && !err.message.includes('Supabase')) {
      throw err; // our own translated errors
    }
    throw new Error('लॉगिन नहीं हो पाया। इंटरनेट चेक करें।');
  }
}

// -------------------------------------------
// SIGNUP (Farmer only — mobile + password)
// -------------------------------------------
async function signup(mobile, password, confirmPassword) {
  mobile          = (mobile          || '').trim();
  password        = (password        || '').trim();
  confirmPassword = (confirmPassword || '').trim();

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    throw new Error('सही 10 अंकों का मोबाइल नंबर डालें');
  }
  if (!password || password.length < 6) {
    throw new Error('पासवर्ड कम से कम 6 अक्षर का होना चाहिए');
  }
  if (password !== confirmPassword) {
    throw new Error('दोनों पासवर्ड एक जैसे होने चाहिए');
  }

  const email = mobileToEmail(mobile);

  try {
    const sb = getSupabase();

    // Try to sign up
    const { data: signupData, error: signupError } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { mobile, role: 'farmer' },
        emailRedirectTo: undefined,
      }
    });

    // If user already exists, try login instead
    if (signupError) {
      if (signupError.message?.toLowerCase().includes('already registered') ||
          signupError.message?.toLowerCase().includes('user already registered')) {
        // Attempt login with given credentials
        const loginResult = await login(mobile, password);
        return { ...loginResult, already_existed: true };
      }
      console.error('Signup error:', signupError);
      throw new Error('खाता नहीं बन पाया। दोबारा कोशिश करें।');
    }

    // Supabase may return session immediately (email confirm disabled) or require confirm
    if (signupData?.session) {
      const userObj = {
        id:     signupData.user.id,
        email:  signupData.user.email,
        mobile: mobile,
        role:   'farmer',
      };
      _saveSession(userObj);
      if (signupData.session?.access_token) {
        localStorage.setItem('swarni_token', signupData.session.access_token);
      }
      return { ...userObj, already_existed: false };
    }

    // No session yet (email confirm mode — shouldn't happen with phone-based flow)
    // Try to immediately log in
    try {
      const loginResult = await login(mobile, password);
      return { ...loginResult, already_existed: false };
    } catch(loginErr) {
      // Account created but can't log in yet
      return {
        id: signupData?.user?.id || null,
        mobile,
        role: 'farmer',
        already_existed: false,
        needs_confirm: true,
      };
    }

  } catch(err) {
    if (err.message && !err.message.includes('Supabase')) throw err;
    throw new Error('खाता नहीं बन पाया। इंटरनेट चेक करें।');
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
    window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
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
