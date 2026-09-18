// =============================================
// Admin - Orders & Gallery & Settings Management (Mobile)
// =============================================

// =============================================
// ORDERS (Mobile Cards)
// =============================================
async function renderAdminOrders() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">ऑर्डर लोड हो रहे हैं...</p></div>';
  
  try {
    const orders = await getAllOrders();
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">🛒 ऑर्डर प्रबंधन (${orders.length})</h2>
      </div>

      <!-- Search & Status Filter -->
      <div class="admin-action-bar" style="flex-wrap:wrap;">
        <div class="admin-search-box" style="min-width:140px;">
          <span>🔍</span>
          <input type="text" placeholder="ग्राहक / फोन खोजें..." oninput="filterOrders(this.value)">
        </div>
        <select class="form-control" style="width:auto;min-height:44px;font-size:0.85rem;border-radius:10px;" onchange="filterOrdersByStatus(this.value)">
          <option value="">सभी स्थिति</option>
          <option value="pending">⏳ प्रतीक्षारत</option>
          <option value="confirmed">✅ पुष्ट</option>
          <option value="preparing">🔄 तैयारी</option>
          <option value="out_for_delivery">🚚 डिलीवरी</option>
          <option value="delivered">✅ डिलीवर</option>
          <option value="cancelled">❌ रद्द</option>
        </select>
      </div>

      <div id="orders-cards-wrap">
        ${renderOrdersCards(orders)}
      </div>
    `;
    window._adminOrders = orders;
  } catch(e) {
    console.error('renderAdminOrders error:', e);
    content.innerHTML = '<div class="empty-state"><p class="hindi">ऑर्डर लोड करने में समस्या।</p><button class="btn btn-primary btn-sm hindi" onclick="renderAdminOrders()">दोबारा कोशिश करें</button></div>';
  }
}

function renderOrdersCards(orders) {
  if (orders.length === 0) {
    return '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📦</div><p class="hindi">कोई ऑर्डर नहीं</p></div>';
  }

  return orders.map(o => `
    <div class="admin-order-card" id="order-card-${o.id}">
      <div class="admin-order-header">
        <div>
          <span class="admin-order-id">${escapeHtml(o.order_number)}</span>
          <div class="admin-order-date">${formatDate(o.created_at)}</div>
        </div>
        <span class="status-badge status-${o.order_status}">
          ${getStatusLabel(o.order_status)}
        </span>
      </div>

      <div class="admin-order-customer hindi">
        <div style="font-size:0.95rem;font-weight:700;color:var(--dark-green);">
          👤 ${escapeHtml(o.customer_name)}
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:2px;">
          <a href="tel:${escapeHtml(o.customer_phone)}" style="color:var(--dark-green);text-decoration:none;font-weight:600;font-size:0.9rem;">
            📞 ${escapeHtml(o.customer_phone)}
          </a>
          <a href="https://wa.me/91${escapeHtml(o.customer_phone).replace(/\\D/g,'')}" target="_blank" style="color:#25D366;text-decoration:none;font-weight:600;font-size:0.85rem;">
            💬 WhatsApp
          </a>
        </div>
        ${o.delivery_village_city ? `
          <div style="font-size:0.8rem;color:var(--light-text);margin-top:2px;">
            📍 ${escapeHtml(o.delivery_village_city)}${o.delivery_full_address ? ', ' + escapeHtml(o.delivery_full_address) : ''}
          </div>` : ''}
      </div>

      <!-- Items Ordered -->
      <div class="admin-order-items hindi">
        ${(o.order_items || []).map(i => `
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span>${escapeHtml(i.product_name_hi_snapshot || i.product_name_snapshot)} × ${i.quantity}</span>
            <span style="font-weight:600;">${formatCurrency(i.subtotal || (i.unit_price * i.quantity))}</span>
          </div>
        `).join('') || '<div style="color:var(--light-text);">-</div>'}
      </div>

      <!-- Footer with Total & Status Dropdown -->
      <div class="admin-order-footer">
        <div>
          <div style="font-size:0.75rem;color:var(--light-text);" class="hindi">कुल राशि</div>
          <div class="admin-order-total">${formatCurrency(o.total_amount)}</div>
        </div>

        <div>
          <select class="admin-status-select" onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="pending" ${o.order_status==='pending'?'selected':''}>⏳ Pending</option>
            <option value="confirmed" ${o.order_status==='confirmed'?'selected':''}>✅ Confirmed</option>
            <option value="preparing" ${o.order_status==='preparing'?'selected':''}>🔄 Preparing</option>
            <option value="out_for_delivery" ${o.order_status==='out_for_delivery'?'selected':''}>🚚 Out for Delivery</option>
            <option value="delivered" ${o.order_status==='delivered'?'selected':''}>🏠 Delivered</option>
            <option value="cancelled" ${o.order_status==='cancelled'?'selected':''}>❌ Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

async function changeOrderStatus(orderId, status) {
  showLoader('स्थिति बदल रहे हैं...');
  try {
    await updateOrderStatus(orderId, status);
    hideLoader();
    showToast('ऑर्डर स्थिति अपडेट हुई!', 'success');
    const order = (window._adminOrders || []).find(o => o.id === orderId);
    if (order) order.order_status = status;
    await renderAdminOrders();
  } catch(e) {
    hideLoader();
    console.error('changeOrderStatus error:', e);
    showToast('अपडेट में समस्या: ' + e.message, 'error');
  }
}

function filterOrders(query) {
  const filtered = (window._adminOrders || []).filter(o =>
    o.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
    o.customer_phone?.includes(query) ||
    o.order_number?.toLowerCase().includes(query.toLowerCase())
  );
  document.getElementById('orders-cards-wrap').innerHTML = renderOrdersCards(filtered);
}

function filterOrdersByStatus(status) {
  const filtered = status ? (window._adminOrders || []).filter(o => o.order_status === status) : (window._adminOrders || []);
  document.getElementById('orders-cards-wrap').innerHTML = renderOrdersCards(filtered);
}

// =============================================
// GALLERY (Mobile Friendly)
// =============================================
async function renderAdminGallery() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">गैलरी लोड हो रही है...</p></div>';
  
  try {
    const gallery = await getAllGallery();
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">🖼️ फोटो व गैलरी (${gallery.length})</h2>
        <button class="btn btn-primary btn-sm hindi" onclick="showGalleryForm()" style="border-radius:8px;font-weight:700;">
          ➕ छवि जोड़ें
        </button>
      </div>

      <div id="gallery-form-container" class="hidden" style="margin-bottom:16px;"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${gallery.map(item => `
          <div class="admin-mobile-card" style="padding:8px;margin-bottom:0;">
            <img src="${escapeHtml(item.image_url)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;" onerror="this.src='assets/images/hero.jpg'">
            <div class="hindi" style="font-size:0.8rem;font-weight:700;line-height:1.2;margin-bottom:4px;">
              ${escapeHtml(item.title_hi || item.title || 'फोटो')}
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
              <button class="btn btn-sm btn-danger" style="flex:1;min-height:34px;padding:4px;" onclick="confirmDeleteGallery('${item.id}')">🗑</button>
              <button class="btn btn-sm ${item.is_active ? 'btn-ghost' : 'btn-primary'}" style="flex:1;min-height:34px;padding:4px;" onclick="toggleGalleryItem('${item.id}',${!item.is_active})">
                ${item.is_active ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    window._adminGallery = gallery;
  } catch(e) {
    console.error('renderAdminGallery error:', e);
    content.innerHTML = '<div class="empty-state"><p class="hindi">लोड में समस्या।</p></div>';
  }
}

function showGalleryForm() {
  const container = document.getElementById('gallery-form-container');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="admin-mobile-form">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 class="hindi" style="margin:0;font-size:1.05rem;">नई छवि जोड़ें</h3>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('gallery-form-container').classList.add('hidden')">✕</button>
      </div>
      <form onsubmit="saveGalleryItem(event)">
        <div class="form-group">
          <label class="form-label hindi">छवि / फोटो</label>
          ${renderMobileImagePickerHTML({
            id: 'gallery-photo',
            currentImageUrl: '',
            folder: 'gallery',
            defaultFallback: 'assets/images/service-seed-grading.jpg'
          })}
        </div>
        <div class="form-group">
          <label class="form-label hindi">शीर्षक (हिंदी)</label>
          <input class="form-control" name="title_hi" placeholder="फोटो का नाम...">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" name="category">
            <option value="machines">Machines (कृषि मशीन)</option>
            <option value="general">General (सामान्य)</option>
            <option value="shop">Shop (दुकान)</option>
            <option value="animal_feed">Animal Feed (पशु आहार)</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full hindi" id="save-gallery-btn" style="min-height:44px;font-weight:700;">➕ जोड़ें</button>
      </form>
    </div>
  `;
}

async function saveGalleryItem(event) {
  event.preventDefault();
  const form = event.target;
  const btn = document.getElementById('save-gallery-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ फोटो अपलोड हो रही है...';
  }

  let finalImageUrl = '';
  try {
    finalImageUrl = await uploadSelectedImageIfNeeded('gallery-photo', '');
    if (!finalImageUrl) {
      if (btn) { btn.disabled = false; btn.textContent = '➕ जोड़ें'; }
      showToast('कृपया एक फोटो चुनें', 'warning');
      return;
    }
  } catch(uploadErr) {
    if (btn) { btn.disabled = false; btn.textContent = '➕ जोड़ें'; }
    showToast('फोटो अपलोड में समस्या: ' + uploadErr.message, 'error');
    return;
  }

  if (btn) btn.textContent = '⏳ सुरक्षित हो रहा है...';
  const fd = new FormData(form);
  const data = {
    image_url: finalImageUrl,
    title_hi: fd.get('title_hi') || null,
    category: fd.get('category') || 'machines',
    is_active: true
  };

  try {
    await upsertGalleryItem(data);
    showToast('छवि सफलतापूर्वक जोड़ी गई!', 'success');
    document.getElementById('gallery-form-container')?.classList.add('hidden');
    await renderAdminGallery();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '➕ जोड़ें'; }
    console.error('saveGalleryItem error:', e);
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

async function confirmDeleteGallery(id) {
  if (!confirm('इस छवि को हटाएं?')) return;
  try {
    await deleteGalleryItem(id);
    showToast('छवि हटाई गई।', 'success');
    await renderAdminGallery();
  } catch(e) {
    showToast('त्रुटि।', 'error');
  }
}

async function toggleGalleryItem(id, active) {
  try {
    await upsertGalleryItem({ id, is_active: active });
    await renderAdminGallery();
  } catch(e) {
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

// =============================================
// BUSINESS SETTINGS (Mobile Friendly)
// =============================================
async function renderAdminSettings() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">सेटिंग्स लोड हो रही हैं...</p></div>';

  try {
    const settings = await getBusinessSettings();
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">⚙️ व्यवसाय सेटिंग्स</h2>
      </div>

      <div class="admin-mobile-form">
        <form onsubmit="saveBusinessSettings(event)">
          <div class="form-group">
            <label class="form-label hindi">दुकान का नाम (हिंदी)</label>
            <input class="form-control" name="business_name_hi" value="${escapeHtml(settings.business_name_hi || 'स्वर्णी पशु आहार')}" required>
          </div>

          <div class="form-group">
            <label class="form-label hindi">मालिक का नाम</label>
            <input class="form-control" name="owner_name" value="${escapeHtml(settings.owner_name || 'सतीश पाटीदार')}">
          </div>

          <div class="form-group">
            <label class="form-label hindi">फ़ोन नंबर</label>
            <input class="form-control" name="phone_primary" value="${escapeHtml(settings.phone_primary || '8120860801')}" required>
          </div>

          <div class="form-group">
            <label class="form-label hindi">पता (हिंदी)</label>
            <textarea class="form-control" name="address_hi" rows="2">${escapeHtml(settings.address_hi || 'कुरावर रोड, अजय ऑनलाइन के पास, खरदोन कलां')}</textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label hindi">डिलीवरी शुल्क (₹)</label>
              <input class="form-control" type="number" name="delivery_charge" value="${settings.delivery_charge || 50}">
            </div>
            <div class="form-group">
              <label class="form-label hindi">न्यूनतम ऑर्डर (₹)</label>
              <input class="form-control" type="number" name="minimum_order" value="${settings.minimum_order || 200}">
            </div>
          </div>

          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;">
              <input type="checkbox" name="delivery_available" ${settings.delivery_available !== false ? 'checked' : ''}>
              <span class="hindi">🚚 होम डिलीवरी सेवा चालू रखें</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-full hindi" id="save-settings-btn" style="min-height:46px;font-weight:700;">
            💾 सेटिंग्स सुरक्षित करें
          </button>
        </form>
      </div>
    `;
  } catch(e) {
    console.error('renderAdminSettings error:', e);
    content.innerHTML = '<div class="empty-state"><p class="hindi">सेटिंग्स लोड करने में समस्या।</p></div>';
  }
}

async function saveBusinessSettings(event) {
  event.preventDefault();
  const btn = document.getElementById('save-settings-btn');
  btn.disabled = true;
  btn.textContent = 'सहेज रहे हैं...';

  const form = event.target;
  const data = {
    business_name_hi: form.business_name_hi.value.trim(),
    owner_name: form.owner_name.value.trim(),
    phone_primary: form.phone_primary.value.trim(),
    address_hi: form.address_hi.value.trim(),
    delivery_charge: parseFloat(form.delivery_charge.value) || 0,
    minimum_order: parseFloat(form.minimum_order.value) || 0,
    delivery_available: form.delivery_available.checked,
  };

  try {
    await updateBusinessSettings(data);
    showToast('सेटिंग्स सुरक्षित हो गईं!', 'success');
  } catch(e) {
    showToast('त्रुटि: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 सेटिंग्स सुरक्षित करें';
  }
}

window.renderAdminOrders = renderAdminOrders;
window.changeOrderStatus = changeOrderStatus;
window.filterOrders = filterOrders;
window.filterOrdersByStatus = filterOrdersByStatus;
window.renderAdminGallery = renderAdminGallery;
window.showGalleryForm = showGalleryForm;
window.saveGalleryItem = saveGalleryItem;
window.confirmDeleteGallery = confirmDeleteGallery;
window.toggleGalleryItem = toggleGalleryItem;
window.renderAdminSettings = renderAdminSettings;
window.saveBusinessSettings = saveBusinessSettings;
