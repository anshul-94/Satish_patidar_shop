// =============================================
// Orders Module (Instant Render, Non-Blocking)
// =============================================

async function loadOrdersPage() {
  const container = document.getElementById('orders-list');
  try {
    const sb = getSupabase();
    let orders = [];
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const savedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
    const orderIds = savedOrders.map(o => o.id);

    if (user && user.role === 'admin') {
      const { data, error } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      orders = data || [];
    } else if (user && user.id) {
      const { data, error } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      orders = data || [];

      if (orderIds.length > 0) {
        const { data: localData } = await sb
          .from('orders')
          .select('*, order_items(*)')
          .in('id', orderIds);
        if (localData) {
          const presentIds = new Set(orders.map(o => o.id));
          localData.forEach(o => {
            if (!presentIds.has(o.id)) orders.push(o);
          });
        }
      }
    } else if (orderIds.length > 0) {
      const { data, error } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      orders = data || [];
    }

    renderOrders(orders);
  } catch(e) {
    console.error('loadOrdersPage error:', e);
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="padding:32px 16px;text-align:center;">
          <div class="empty-state-icon">⚠️</div>
          <p class="hindi" style="font-weight:700;color:var(--dark-green);margin-bottom:12px;">ओर्डर नहीं आये। नेट चेक करें।</p>
          <button class="btn btn-primary btn-sm hindi" onclick="loadOrdersPage()">🔄 फिर कोशिश करें</button>
        </div>`;
    }
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders-list');
  const emptyState = document.getElementById('orders-empty');
  if (!container) return;
  if (orders.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');
  container.innerHTML = orders.map(order => `
    <div class="order-card animate-on-scroll" onclick="window.location.href='order-details.html?id=${order.id}'">
      <div class="order-header">
        <div>
          <div class="order-id">#${escapeHtml(order.order_number)}</div>
          <div class="order-date">${formatDateTime(order.created_at)}</div>
        </div>
        <span class="${getStatusClass(order.order_status)}">${getStatusLabel(order.order_status)}</span>
      </div>
      <div class="order-items-preview">
        ${(order.order_items || []).map(item => `
          <div class="order-item-row">
            <span>${escapeHtml(item.product_name_hi_snapshot || item.product_name_snapshot)} × ${item.quantity}</span>
            <span>${formatCurrency(item.subtotal)}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-footer">
        <span class="order-total-label hindi">कुल कीमत:</span>
        <span class="order-total-value">${formatCurrency(order.total_amount)}</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-secondary hindi" onclick="event.stopPropagation()">विवरण देखें</a>
        <a href="${whatsappOrder(order.order_number, order.total_amount)}" class="btn btn-sm btn-whatsapp hindi" target="_blank" onclick="event.stopPropagation()">💬 WhatsApp</a>
      </div>
    </div>
  `).join('');
}

async function loadOrderDetails() {
  const params = new URLSearchParams(window.location.search);
  let orderId = params.get('id');
  const container = document.getElementById('order-detail-container');
  if (!container) return;

  if (!orderId) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      if (savedOrders.length > 0) {
        orderId = savedOrders[savedOrders.length - 1].id;
      }
    } catch(err) {}
  }

  if (!orderId) {
    container.innerHTML = `
      <div class="card" style="padding:32px 16px;text-align:center;border-radius:16px;border:1px solid var(--border);background:white;">
        <div style="font-size:2.5rem;margin-bottom:8px;">⚠️</div>
        <h3 class="hindi" style="color:var(--dark-green);margin-bottom:8px;">ऑर्डर विवरण उपलब्ध नहीं है</h3>
        <p class="hindi" style="color:var(--medium-text);margin-bottom:16px;">कृपया नया ऑर्डर दें या होम पर जाएं।</p>
        <a href="index.html" class="btn btn-primary hindi" style="display:inline-block;padding:10px 24px;">🏠 होम पर जाएं</a>
      </div>`;
    return;
  }

  // Fetch actual order data asynchronously (non-blocking, page shell already visible)
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      container.innerHTML = `
        <div class="card" style="padding:32px 16px;text-align:center;border-radius:16px;border:1px solid var(--border);background:white;">
          <div style="font-size:2.5rem;margin-bottom:8px;">⚠️</div>
          <h3 class="hindi" style="color:var(--dark-green);margin-bottom:8px;">ऑर्डर विवरण उपलब्ध नहीं है</h3>
          <p class="hindi" style="color:var(--medium-text);margin-bottom:16px;">यह ऑर्डर नहीं मिला या हटाया जा चुका है।</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary hindi" onclick="loadOrderDetails()">🔄 दोबारा कोशिश करें</button>
            <a href="index.html" class="btn btn-secondary hindi">🏠 होम पर जाएं</a>
          </div>
        </div>`;
      return;
    }
    renderOrderDetails(order);
  } catch(e) {
    console.error('loadOrderDetails error:', e);
    container.innerHTML = `
      <div class="card" style="padding:32px 16px;text-align:center;border-radius:16px;border:1px solid var(--border);background:white;">
        <div style="font-size:2.5rem;margin-bottom:8px;">⚠️</div>
        <h3 class="hindi" style="color:var(--dark-green);margin-bottom:8px;">ऑर्डर विवरण उपलब्ध नहीं है</h3>
        <p class="hindi" style="color:var(--medium-text);margin-bottom:16px;">नेटवर्क या सर्वर समस्या के कारण विवरण लोड नहीं हो सका।</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary hindi" onclick="loadOrderDetails()">🔄 दोबारा कोशिश करें</button>
          <a href="index.html" class="btn btn-secondary hindi">🏠 होम पर जाएं</a>
        </div>
      </div>`;
  }
}

function renderOrderDetails(order) {
  const container = document.getElementById('order-detail-container');
  if (!container) return;

  const trackerSteps = [
    { key: 'pending', label: 'ऑर्डर दिया', icon: '📋' },
    { key: 'confirmed', label: 'पुष्ट', icon: '✅' },
    { key: 'preparing', label: 'तैयारी', icon: '🔄' },
    { key: 'out_for_delivery', label: 'डिलीवरी पर', icon: '🚚' },
    { key: 'delivered', label: 'डिलीवर', icon: '🏠' },
  ];
  const statusOrder = ['pending','confirmed','preparing','out_for_delivery','delivered'];
  const currentIdx = statusOrder.indexOf(order.order_status);

  container.innerHTML = `
    <div class="card" style="box-shadow:0 4px 16px rgba(0,0,0,0.06);border-radius:16px;border:1px solid var(--border);background:white;">
      <div class="card-body" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:1px solid #F1F5F9;padding-bottom:12px;">
          <div>
            <h2 class="hindi" style="color:var(--dark-green);margin:0 0 4px;font-size:1.3rem;">ऑर्डर #${escapeHtml(order.order_number)}</h2>
            <p style="color:var(--light-text);margin:0;font-size:0.85rem;">${formatDateTime(order.created_at)}</p>
          </div>
          <span class="${getStatusClass(order.order_status)}">${getStatusLabel(order.order_status)}</span>
        </div>

        ${order.order_status !== 'cancelled' ? `
        <div class="order-tracker" style="margin-bottom:18px;">
          <div class="tracker-steps">
            ${trackerSteps.map((step, i) => `
              <div class="tracker-step ${i < currentIdx ? 'done' : (i === currentIdx ? 'active' : '')}">
                <div class="tracker-dot">${i < currentIdx ? '✓' : step.icon}</div>
                <div class="tracker-label hindi">${step.label}</div>
              </div>
            `).join('')}
          </div>
        </div>` : '<div style="text-align:center;padding:14px;background:#FEE2E2;border-radius:8px;color:#B91C1C;font-weight:700;margin-bottom:16px;" class="hindi">❌ यह ऑर्डर रद्द किया गया है।</div>'}

        <h3 class="hindi" style="margin:16px 0 10px;font-size:1.05rem;color:var(--dark-green);">📦 ऑर्डर आइटम</h3>
        <div style="background:#F8FAFC;border-radius:10px;padding:12px;margin-bottom:14px;">
          ${(order.order_items || []).map(item => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E2E8F0;">
              <div>
                <div style="font-weight:700;font-size:0.95rem;" class="hindi">${escapeHtml(item.product_name_hi_snapshot || item.product_name_snapshot)}</div>
                <div style="font-size:0.8rem;color:var(--light-text);">x${item.quantity} @ ${formatCurrency(item.unit_price)}</div>
              </div>
              <div style="font-weight:700;color:var(--primary-green);font-size:0.95rem;">${formatCurrency(item.subtotal)}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin-bottom:16px;background:white;border:1px solid #E2E8F0;border-radius:10px;padding:12px;">
          <div class="order-summary-row"><span class="hindi">सामान की कीमत</span><span>${formatCurrency(order.subtotal)}</span></div>
          <div class="order-summary-row"><span class="hindi">घर पहुँचाने का खर्च</span><span>${formatCurrency(order.delivery_charge)}</span></div>
          <div class="order-summary-row total" style="margin-top:6px;padding-top:6px;border-top:1px dashed #CBD5E1;"><span class="hindi">कुल कीमत</span><span style="color:var(--primary-green);">${formatCurrency(order.total_amount)}</span></div>
        </div>

        <h3 class="hindi" style="margin:16px 0 8px;font-size:1.05rem;color:var(--dark-green);">📍 डिलीवरी पता</h3>
        <div style="background:var(--soft-green);padding:14px;border-radius:12px;font-size:0.9rem;line-height:1.5;margin-bottom:18px;">
          <div class="hindi" style="font-weight:700;color:var(--dark-green);margin-bottom:4px;">👤 ${escapeHtml(order.customer_name)}</div>
          <div style="margin-bottom:4px;">📞 <a href="tel:${escapeHtml(order.customer_phone)}" style="color:var(--dark-green);font-weight:600;text-decoration:none;">${escapeHtml(order.customer_phone)}</a></div>
          <div class="hindi" style="color:var(--medium-text);">${escapeHtml(order.delivery_village_city)}${order.delivery_full_address ? ', ' + escapeHtml(order.delivery_full_address) : ''}</div>
          <div class="hindi" style="margin-top:6px;font-size:0.8rem;color:var(--light-text);">भुगतान: ${order.payment_method === 'cod' ? '💵 कैश ऑन डिलीवरी (COD)' : 'ऑनलाइन'}</div>
        </div>

        <div style="display:flex;gap:10px;">
          <a href="https://wa.me/918120860801?text=Order%20${encodeURIComponent(order.order_number)}" class="btn btn-whatsapp hindi" target="_blank" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;">💬 WhatsApp से पूछें</a>
          <a href="index.html" class="btn btn-primary hindi" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;">🏠 होम</a>
        </div>
      </div>
    </div>
  `;
}

window.loadOrdersPage = loadOrdersPage;
window.renderOrders = renderOrders;
window.loadOrderDetails = loadOrderDetails;
window.renderOrderDetails = renderOrderDetails;
