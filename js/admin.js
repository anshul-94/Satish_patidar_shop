// =============================================
// Admin - Mobile Shell & Dashboard
// =============================================

let adminUser = null;

function getAdminSidebarHTML(activePage) {
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'डैशबोर्ड', href: 'admin.html' },
    { id: 'products', icon: '📦', label: 'उत्पाद प्रबंधन', href: 'admin.html?page=products' },
    { id: 'services', icon: '⚙️', label: 'सेवाएं प्रबंधन', href: 'admin.html?page=services' },
    { id: 'orders', icon: '🛒', label: 'ऑर्डर प्रबंधन', href: 'admin.html?page=orders' },
    { id: 'bookings', icon: '📅', label: 'बुकिंग प्रबंधन', href: 'admin.html?page=bookings' },
    { id: 'slots', icon: '⏰', label: 'समय स्लॉट प्रबंधन', href: 'admin.html?page=slots' },
    { id: 'gallery', icon: '🖼️', label: 'फोटो व गैलरी', href: 'admin.html?page=gallery' },
    { id: 'settings', icon: '⚙️', label: 'व्यवसाय सेटिंग्स', href: 'admin.html?page=settings' },
  ];

  return `
  <!-- Drawer Backdrop Overlay -->
  <div class="admin-drawer-overlay" id="admin-drawer-overlay" onclick="closeAdminSidebar()"></div>

  <!-- Mobile Drawer Sidebar -->
  <div class="admin-sidebar" id="admin-sidebar">
    <div class="admin-sidebar-header">
      <div class="admin-drawer-brand">
        <div class="admin-drawer-logo-icon">🌾</div>
        <div>
          <div class="hindi" style="font-weight:700;font-size:1.05rem;">स्वर्णी Admin</div>
          <div style="font-size:0.75rem;opacity:0.7;">सतीश पाटीदार</div>
        </div>
      </div>
      <button class="admin-drawer-close" onclick="closeAdminSidebar()" aria-label="Close menu">✕</button>
    </div>
    
    <nav class="admin-nav">
      ${navItems.map(item => `
        <a href="${item.href}" class="admin-nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" onclick="closeAdminSidebar()">
          <span class="admin-nav-item-icon">${item.icon}</span>
          <span class="hindi">${item.label}</span>
        </a>
      `).join('')}
    </nav>
    
    <div class="admin-sidebar-footer">
      <a href="index.html" class="admin-nav-item" target="_blank" style="padding-left:0;">
        <span class="admin-nav-item-icon">🌐</span>
        <span class="hindi">वेबसाइट देखें</span>
      </a>
      <button class="admin-nav-item" onclick="adminLogout()" style="padding-left:0;width:100%;color:#FCA5A5;border:none;background:none;cursor:pointer;">
        <span class="admin-nav-item-icon">🚪</span>
        <span class="hindi">लॉगआउट</span>
      </button>
    </div>
  </div>`;
}

function getAdminBottomNavHTML(activePage) {
  return `
  <nav class="admin-bottom-nav">
    <a href="admin.html" class="admin-bottom-item ${activePage === 'dashboard' ? 'active' : ''}">
      <span class="admin-bottom-icon">🏠</span>
      <span>डैशबोर्ड</span>
    </a>
    <a href="admin.html?page=products" class="admin-bottom-item ${activePage === 'products' ? 'active' : ''}">
      <span class="admin-bottom-icon">📦</span>
      <span>उत्पाद</span>
    </a>
    <a href="admin.html?page=orders" class="admin-bottom-item ${activePage === 'orders' ? 'active' : ''}">
      <span class="admin-bottom-icon">🛒</span>
      <span>ऑर्डर</span>
    </a>
    <a href="admin.html?page=bookings" class="admin-bottom-item ${activePage === 'bookings' ? 'active' : ''}">
      <span class="admin-bottom-icon">📅</span>
      <span>बुकिंग</span>
    </a>
    <button class="admin-bottom-item" onclick="openAdminSidebar()" style="outline:none;">
      <span class="admin-bottom-icon">⚙️</span>
      <span>अधिक</span>
    </button>
  </nav>`;
}

async function initAdminPage() {
  const page = new URLSearchParams(window.location.search).get('page') || 'dashboard';
  
  // Check auth
  const user = await requireAdmin();
  if (!user) return;
  adminUser = user;

  // Render Mobile Shell
  const appEl = document.getElementById('admin-app');
  if (!appEl) return;
  appEl.innerHTML = `
    ${getAdminSidebarHTML(page)}
    <div class="admin-main">
      <!-- Mobile Topbar -->
      <div class="admin-topbar">
        <div class="admin-topbar-left">
          <button class="admin-hamburger" id="admin-hamburger" onclick="openAdminSidebar()" aria-label="Open menu">
            ☰
          </button>
          <div class="admin-page-brand">
            <span>🌾</span> <span>स्वर्णी Admin</span>
          </div>
        </div>
        <div class="admin-topbar-right">
          <button class="admin-notif-btn" onclick="showToast('कोई नया अलर्ट नहीं है', 'info')" aria-label="Notifications">
            🔔
            <span class="admin-notif-dot"></span>
          </button>
        </div>
      </div>

      <!-- Main Content Container -->
      <div class="admin-content" id="admin-content">
        <div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">डेटा लोड हो रहा है...</p></div>
      </div>

      <!-- Fixed Mobile Bottom Nav -->
      ${getAdminBottomNavHTML(page)}
    </div>
  `;

  // Load requested sub-page
  await loadAdminPage(page);
}

function openAdminSidebar() {
  document.getElementById('admin-sidebar')?.classList.add('open');
  document.getElementById('admin-drawer-overlay')?.classList.add('open');
}

function closeAdminSidebar() {
  document.getElementById('admin-sidebar')?.classList.remove('open');
  document.getElementById('admin-drawer-overlay')?.classList.remove('open');
}

function toggleAdminSidebar() {
  const sb = document.getElementById('admin-sidebar');
  if (sb?.classList.contains('open')) closeAdminSidebar();
  else openAdminSidebar();
}

async function loadAdminPage(page) {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">डेटा लोड हो रहा है...</p></div>';

  switch(page) {
    case 'dashboard': await renderAdminDashboard(); break;
    case 'products': await renderAdminProducts(); break;
    case 'services': await renderAdminServices(); break;
    case 'orders': await renderAdminOrders(); break;
    case 'bookings': await renderAdminBookings(); break;
    case 'slots': await renderAdminSlots(); break;
    case 'gallery': await renderAdminGallery(); break;
    case 'settings': await renderAdminSettings(); break;
    default: await renderAdminDashboard();
  }
}

async function renderAdminDashboard() {
  const content = document.getElementById('admin-content');
  try {
    const stats = await getDashboardStats();
    const [recentOrders, recentBookings] = await Promise.all([
      getAllOrders({ limit: 4 }),
      getAllBookings({ limit: 4 })
    ]);

    content.innerHTML = `
      <!-- Greeting -->
      <div class="admin-welcome-section">
        <h2 class="admin-welcome-title">नमस्ते Admin 👋</h2>
        <p class="admin-welcome-sub">आज का कारोबार</p>
      </div>

      <!-- Compact 2-Column Stats Grid -->
      <div class="admin-stats-grid">
        <a href="admin.html?page=orders" class="admin-stat-card">
          <div class="admin-stat-card-header">
            <div class="admin-stat-icon" style="background:#EFF6FF;">🛒</div>
            <div class="admin-stat-label">Orders</div>
          </div>
          <div class="admin-stat-value">${stats.totalOrders}</div>
        </a>

        <a href="admin.html?page=bookings" class="admin-stat-card">
          <div class="admin-stat-card-header">
            <div class="admin-stat-icon" style="background:#FFFBEB;">📅</div>
            <div class="admin-stat-label">Bookings</div>
          </div>
          <div class="admin-stat-value">${stats.pendingBookings + stats.todayBookings}</div>
        </a>

        <a href="admin.html?page=products" class="admin-stat-card">
          <div class="admin-stat-card-header">
            <div class="admin-stat-icon" style="background:#F0FDF4;">📦</div>
            <div class="admin-stat-label">Products</div>
          </div>
          <div class="admin-stat-value">${stats.activeProducts}</div>
        </a>

        <a href="admin.html?page=services" class="admin-stat-card">
          <div class="admin-stat-card-header">
            <div class="admin-stat-icon" style="background:#FAF5FF;">⚙️</div>
            <div class="admin-stat-label">Services</div>
          </div>
          <div class="admin-stat-value">${stats.activeServices}</div>
        </a>
      </div>

      <!-- Quick Actions Section -->
      <div class="admin-section-header">
        <h3 class="admin-section-title">त्वरित कार्य (Quick Actions)</h3>
      </div>
      
      <div class="admin-quick-grid">
        <a href="admin.html?page=products" class="admin-quick-card">
          <div class="admin-quick-icon">📦</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">उत्पाद</span>
            <span class="admin-quick-sub">Manage Products</span>
          </div>
        </a>

        <a href="admin.html?page=services" class="admin-quick-card">
          <div class="admin-quick-icon">⚙️</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">सेवाएं</span>
            <span class="admin-quick-sub">Manage Services</span>
          </div>
        </a>

        <a href="admin.html?page=orders" class="admin-quick-card">
          <div class="admin-quick-icon">🛒</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">ऑर्डर</span>
            <span class="admin-quick-sub">Manage Orders</span>
          </div>
        </a>

        <a href="admin.html?page=bookings" class="admin-quick-card">
          <div class="admin-quick-icon">📅</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">बुकिंग</span>
            <span class="admin-quick-sub">Manage Bookings</span>
          </div>
        </a>

        <a href="admin.html?page=slots" class="admin-quick-card">
          <div class="admin-quick-icon">⏰</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">समय स्लॉट</span>
            <span class="admin-quick-sub">Manage Time Slots</span>
          </div>
        </a>

        <a href="admin.html?page=gallery" class="admin-quick-card">
          <div class="admin-quick-icon">🖼️</div>
          <div class="admin-quick-info">
            <span class="admin-quick-label">फोटो</span>
            <span class="admin-quick-sub">Manage Images</span>
          </div>
        </a>
      </div>

      <!-- Recent Orders List -->
      <div class="admin-section-header">
        <h3 class="admin-section-title">ताज़ा ऑर्डर (Recent Orders)</h3>
        <a href="admin.html?page=orders" class="hindi" style="font-size:0.85rem;color:var(--primary-green);font-weight:700;text-decoration:none;">सभी देखें →</a>
      </div>

      <div style="margin-bottom:20px;">
        ${recentOrders.length === 0 ? '<p class="hindi text-muted">कोई ऑर्डर नहीं</p>' : recentOrders.map(o => `
          <div class="admin-order-card">
            <div class="admin-order-header">
              <span class="admin-order-id">${escapeHtml(o.order_number)}</span>
              <span class="status-badge status-${o.order_status}">${formatStatus(o.order_status)}</span>
            </div>
            <div class="admin-order-customer hindi" style="font-size:0.9rem;">
              👤 <strong>${escapeHtml(o.customer_name || 'ग्राहक')}</strong> • 📞 ${escapeHtml(o.customer_phone || '')}
            </div>
            <div class="admin-order-footer">
              <span class="admin-order-total">${formatCurrency(o.total_amount)}</span>
              <a href="admin.html?page=orders" class="btn btn-sm btn-secondary hindi" style="min-height:36px;padding:4px 12px;border-radius:8px;">विवरण देखें</a>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Recent Bookings List -->
      <div class="admin-section-header">
        <h3 class="admin-section-title">ताज़ा बुकिंग (Recent Bookings)</h3>
        <a href="admin.html?page=bookings" class="hindi" style="font-size:0.85rem;color:var(--primary-green);font-weight:700;text-decoration:none;">सभी देखें →</a>
      </div>

      <div>
        ${recentBookings.length === 0 ? '<p class="hindi text-muted">कोई बुकिंग नहीं</p>' : recentBookings.map(b => `
          <div class="admin-booking-card">
            <div class="admin-booking-header">
              <span class="admin-booking-service">${escapeHtml(b.services?.name_hi || b.service_name_snapshot || 'सेवा')}</span>
              <span class="status-badge status-${b.status}">${formatStatus(b.status)}</span>
            </div>
            <div class="hindi" style="font-size:0.85rem;margin:4px 0;color:var(--medium-text);">
              👤 <strong>${escapeHtml(b.customer_name || 'किसान')}</strong> • 📞 ${escapeHtml(b.customer_phone || b.phone || '')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:0.82rem;color:var(--light-text);">
              <span>📅 ${formatDate(b.booking_date)}</span>
              <a href="admin.html?page=bookings" class="btn btn-sm btn-secondary hindi" style="min-height:36px;padding:4px 12px;border-radius:8px;">विवरण</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) {
    console.error('renderAdminDashboard error:', e);
    content.innerHTML = '<div class="empty-state"><p class="hindi">डैशबोर्ड लोड करने में समस्या।</p></div>';
  }
}

async function adminLogout() {
  await signOut();
  window.location.href = 'login.html';
}

function formatStatus(status) {
  const map = {
    pending: '⏳ प्रतीक्षारत',
    confirmed: '✅ पुष्ट',
    preparing: '🔄 तैयारी में',
    out_for_delivery: '🚚 डिलीवरी पर',
    delivered: '✅ डिलीवर',
    completed: '✅ पूर्ण',
    cancelled: '❌ रद्द',
  };
  return map[status] || status;
}

window.initAdminPage = initAdminPage;
window.openAdminSidebar = openAdminSidebar;
window.closeAdminSidebar = closeAdminSidebar;
window.toggleAdminSidebar = toggleAdminSidebar;
window.adminLogout = adminLogout;
