// =============================================
// UI Utilities - Toast, Modal, Loader, etc.
// =============================================

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'success', duration = 3500) {
  initToastContainer();
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <span class="toast-close" onclick="this.parentElement.classList.add('exit'); setTimeout(() => this.parentElement.remove(), 300)">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// =============================================
// LOADING OVERLAY (DISABLED - NON-BLOCKING UX)
// =============================================
function showLoader(message = '') {
  // Non-blocking architecture: never freeze, blur, or block the screen
}

function hideLoader() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

// =============================================
// MODAL
// =============================================
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => {
    m.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

// =============================================
// CONFIRMATION DIALOG
// =============================================
function showConfirm(message, onConfirm, onCancel = null) {
  const id = 'confirm-modal-' + Date.now();
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-header">
        <h3 class="modal-title">⚠️ पुष्टि करें</h3>
        <button class="modal-close" onclick="document.getElementById('${id}').remove(); document.body.style.overflow=''">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--dark-text); font-family: var(--font-hindi);">${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="${id}-cancel">नहीं, रहने दें</button>
        <button class="btn btn-danger" id="${id}-confirm">हाँ, हटाओ</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  setTimeout(() => overlay.classList.add('open'), 10);
  document.getElementById(`${id}-confirm`).addEventListener('click', () => {
    overlay.remove(); document.body.style.overflow = '';
    if (onConfirm) onConfirm();
  });
  document.getElementById(`${id}-cancel`).addEventListener('click', () => {
    overlay.remove(); document.body.style.overflow = '';
    if (onCancel) onCancel();
  });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('hi-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString, locale = 'hi-IN') {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatTime(timeString) {
  if (!timeString) return '';
  const [h, m] = timeString.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${m} ${ampm}`;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('hi-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getStatusLabel(status) {
  const labels = {
    pending: '⏳ नया ओर्डर',
    confirmed: '✅ पक्का',
    preparing: '🔄 तैयार हो रहा',
    out_for_delivery: '🚚 रास्ते में है',
    delivered: '✅ मिल गया',
    cancelled: '❌ रद्द',
    rejected: '❌ नहीं होगा',
    completed: '✅ हो गया',
  };
  return labels[status] || status;
}

function getStatusClass(status) {
  return `status-badge status-${status}`;
}

function getStockLabel(qty) {
  if (qty === 0) return { label: '❌ स्टॉक खतम', cls: 'out' };
  if (qty < 10) return { label: `⚠️ कम बचा है (${qty})`, cls: 'low' };
  return { label: `✅ उपलब्ध (${qty})`, cls: '' };
}

// =============================================
// NAVBAR COMMON FUNCTIONS
// =============================================
function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  });
}

function initNavbar() {
  // Sticky navbar on scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
  // Hamburger
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }
  // Cart badge
  updateCartBadge();
  // Auth nav
  if (typeof updateNavAuth === 'function') {
    updateNavAuth();
  }
  // Search
  const searchBtn = document.getElementById('nav-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      window.location.href = 'products.html';
    });
  }
}

// =============================================
// ANIMATIONS / INTERSECTION OBSERVER
// =============================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// =============================================
// BUSINESS SETTINGS LOADER
// =============================================
async function loadBusinessSettingsIntoPage() {
  try {
    const settings = await getBusinessSettings();
    if (!settings) return;
    // Update phone links
    document.querySelectorAll('[data-phone]').forEach(el => {
      el.href = 'tel:' + (settings.phone || '8120860801');
    });
    document.querySelectorAll('[data-whatsapp]').forEach(el => {
      el.href = 'https://wa.me/91' + (settings.whatsapp || '8120860801');
    });
    document.querySelectorAll('[data-maps]').forEach(el => {
      el.href = settings.maps_url || '#';
    });
    document.querySelectorAll('[data-business-name]').forEach(el => {
      el.textContent = settings.business_name_hi || 'स्वर्णी पशु आहार';
    });
  } catch(e) { /* Silent fail */ }
}

// NAVBAR HTML template (shared across pages)
function getNavbarHTML() {
  return `
  <nav class="navbar">
    <div class="nav-container">
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">🌾</div>
        <div class="nav-logo-text">
          <span class="nav-logo-name hindi">स्वर्णी पशु आहार</span>
          <span class="nav-logo-sub">Swarni Pashu Aahar</span>
        </div>
      </a>
      <div class="nav-menu">
        <a href="index.html" class="nav-link hindi">होम</a>
        <a href="products.html" class="nav-link hindi">पशु आहार</a>
        <a href="services.html" class="nav-link hindi">कृषि सेवाएं</a>
        <a href="services.html?tab=grading" class="nav-link hindi">सीड ग्रेडिंग</a>
        <a href="about.html" class="nav-link hindi">हमारे बारे में</a>
        <a href="gallery.html" class="nav-link hindi">गैलरी</a>
        <a href="contact.html" class="nav-link hindi">संपर्क</a>
      </div>
      <div class="nav-actions">
        <button class="nav-btn btn-search" id="nav-search-btn" aria-label="Search">🔍</button>
        <a href="cart.html" class="nav-btn btn-cart" style="position:relative;">
          🛒 <span>कार्ट</span>
          <span class="cart-badge" style="display:none;">0</span>
        </a>
        <a href="login.html" class="nav-btn btn-login" id="nav-login-btn"><span>लॉगिन</span></a>
        <a href="account.html" class="nav-btn btn-login hidden" id="nav-account-btn">
          👤 <span class="nav-user-name hindi">खाता</span>
        </a>
      </div>
      <button class="hamburger" id="hamburger-btn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobile-menu">
      <a href="index.html" class="nav-link hindi">🏠 होम</a>
      <a href="products.html" class="nav-link hindi">🐄 पशु आहार</a>
      <a href="services.html" class="nav-link hindi">⚙️ कृषि सेवाएं</a>
      <a href="services.html?tab=grading" class="nav-link hindi">🌾 सीड ग्रेडिंग</a>
      <a href="about.html" class="nav-link hindi">ℹ️ हमारे बारे में</a>
      <a href="gallery.html" class="nav-link hindi">📷 गैलरी</a>
      <a href="contact.html" class="nav-link hindi">📞 संपर्क</a>
      <div class="mobile-menu-actions">
        <a href="cart.html" class="btn btn-secondary btn-full hindi">🛒 कार्ट देखें</a>
        <a href="account.html" class="btn btn-primary btn-full hindi">👤 मेरा खाता</a>
        <a href="https://wa.me/918120860801" class="btn btn-whatsapp btn-full hindi" target="_blank">💬 WhatsApp</a>
      </div>
    </div>
  </nav>
  `;
}

function getFooterHTML() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo-name hindi">🌾 स्वर्णी पशु आहार</div>
          <p class="footer-tagline hindi">पशुओं के स्वास्थ्य एवं बेहतर उत्पादन के लिए उत्तम गुणवत्ता वाला आहार।<br>स्वस्थ पशु - समृद्ध किसान</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="tel:8120860801" class="btn btn-sm btn-ghost" style="color:rgba(255,255,255,0.7);border-color:rgba(255,255,255,0.2);" data-phone>📞 कॉल करें</a>
            <a href="https://wa.me/918120860801" class="btn btn-sm btn-whatsapp" target="_blank">💬 WhatsApp</a>
          </div>
        </div>
        <div>
          <div class="footer-heading">उत्पाद</div>
          <a href="products.html" class="footer-link hindi">पशु आहार</a>
          <a href="products.html?category=beej" class="footer-link hindi">बीज</a>
          <a href="products.html?category=processing" class="footer-link hindi">प्रोसेसिंग</a>
        </div>
        <div>
          <div class="footer-heading">सेवाएं</div>
          <a href="services.html" class="footer-link hindi">सीड ग्रेडिंग</a>
          <a href="services.html" class="footer-link hindi">सोयाबीन प्रोसेसिंग</a>
          <a href="services.html" class="footer-link hindi">लहसुन छीलना</a>
          <a href="booking.html" class="footer-link hindi">सेवा बुक करें</a>
        </div>
        <div>
          <div class="footer-heading">संपर्क</div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">📍</span>
            <span class="footer-contact-text hindi">कुरावर रोड, खरदोन कलां, अजय ऑनलाइन के पास</span>
          </div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">📞</span>
            <span class="footer-contact-text"><a href="tel:8120860801" style="color:inherit;">8120860801</a></span>
          </div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">🕐</span>
            <span class="footer-contact-text hindi">सोमवार - शनिवार: 8AM - 8PM</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="hindi">© 2026 स्वर्णी पशु आहार. सर्वाधिकार सुरक्षित।</span>
        <div style="display:flex;gap:16px;">
          <a href="about.html" class="footer-link hindi" style="margin:0;">हमारे बारे में</a>
          <a href="contact.html" class="footer-link hindi" style="margin:0;">संपर्क</a>
        </div>
      </div>
    </div>
  </footer>
  <nav class="bottom-nav">
    <div class="bottom-nav-items">
      <a href="index.html" class="bottom-nav-item"><span class="bottom-nav-icon">🏠</span><span class="bottom-nav-label hindi">होम</span></a>
      <a href="products.html" class="bottom-nav-item"><span class="bottom-nav-icon">🐄</span><span class="bottom-nav-label hindi">उत्पाद</span></a>
      <a href="cart.html" class="bottom-nav-item" style="position:relative;">
        <span class="bottom-nav-icon">🛒<span class="cart-badge" style="display:none;font-size:0.6rem;width:16px;height:16px;">0</span></span>
        <span class="bottom-nav-label hindi">कार्ट</span>
      </a>
      <a href="orders.html" class="bottom-nav-item"><span class="bottom-nav-icon">📦</span><span class="bottom-nav-label hindi">ऑर्डर</span></a>
      <a href="account.html" class="bottom-nav-item"><span class="bottom-nav-icon">👤</span><span class="bottom-nav-label hindi">खाता</span></a>
    </div>
  </nav>
  `;
}

function getBottomNavActiveClass() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return page;
}

// Export
window.showToast = showToast;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.showConfirm = showConfirm;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.escapeHtml = escapeHtml;
window.getStatusLabel = getStatusLabel;
window.getStatusClass = getStatusClass;
window.getStockLabel = getStockLabel;
window.updateCartBadge = updateCartBadge;
window.initNavbar = initNavbar;
window.initScrollAnimations = initScrollAnimations;
window.loadBusinessSettingsIntoPage = loadBusinessSettingsIntoPage;
window.getNavbarHTML = getNavbarHTML;
window.getFooterHTML = getFooterHTML;
