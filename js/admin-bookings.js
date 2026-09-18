// =============================================
// Admin - Bookings Management (Mobile)
// =============================================

async function renderAdminBookings() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">बुकिंग लोड हो रही हैं...</p></div>';
  
  try {
    const bookings = await getAllBookings();
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">📅 बुकिंग प्रबंधन (${bookings.length})</h2>
      </div>

      <!-- Search & Status Filter -->
      <div class="admin-action-bar" style="flex-wrap:wrap;">
        <div class="admin-search-box" style="min-width:140px;">
          <span>🔍</span>
          <input type="text" placeholder="किसान / फोन खोजें..." oninput="filterBookings(this.value)">
        </div>
        <select class="form-control" style="width:auto;min-height:44px;font-size:0.85rem;border-radius:10px;" onchange="filterBookingsByStatus(this.value)">
          <option value="">सभी स्थिति</option>
          <option value="pending">⏳ प्रतीक्षारत</option>
          <option value="confirmed">✅ पुष्ट</option>
          <option value="completed">✅ पूर्ण</option>
          <option value="cancelled">❌ रद्द</option>
        </select>
      </div>

      <div id="bookings-cards-wrap">
        ${renderBookingsCards(bookings)}
      </div>
    `;
    window._adminBookings = bookings;
  } catch(e) {
    console.error('renderAdminBookings error:', e);
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="hindi">बुकिंग लोड करने में समस्या।</p><button class="btn btn-primary btn-sm hindi" onclick="renderAdminBookings()">दोबारा कोशिश करें</button></div>';
  }
}

function renderBookingsCards(bookings) {
  if (bookings.length === 0) {
    return '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📅</div><p class="hindi">कोई बुकिंग नहीं मिली।</p></div>';
  }

  return bookings.map(b => `
    <div class="admin-booking-card" id="booking-card-${b.id}">
      <div class="admin-booking-header">
        <span style="font-weight:800;color:var(--dark-green);font-size:0.95rem;">
          📅 Booking #${escapeHtml(b.booking_number)}
        </span>
        <span class="status-badge status-${b.status}">
          ${getStatusLabel(b.status)}
        </span>
      </div>

      <div class="admin-booking-service hindi" style="margin:4px 0 8px;font-size:1.05rem;color:var(--primary-green);">
        ⚙️ ${escapeHtml(b.service_name_snapshot || b.services?.name_hi || 'सेवा')}
      </div>

      <div class="hindi" style="background:#F8FAFC;border-radius:10px;padding:10px;margin-bottom:10px;font-size:0.88rem;line-height:1.6;">
        <div>👤 <strong>किसान नाम:</strong> ${escapeHtml(b.customer_name)}</div>
        <div>
          📞 <strong>मोबाइल:</strong> 
          <a href="tel:${escapeHtml(b.customer_phone || b.phone || '')}" style="color:var(--dark-green);text-decoration:none;font-weight:700;">
            ${escapeHtml(b.customer_phone || b.phone || '-')}
          </a>
          <a href="https://wa.me/91${escapeHtml(b.customer_phone || b.phone || '').replace(/\\D/g,'')}" target="_blank" style="color:#25D366;margin-left:8px;font-weight:600;font-size:0.85rem;">
            💬 WhatsApp
          </a>
        </div>
        <div>📦 <strong>मात्रा:</strong> ${b.quantity} ${escapeHtml(b.quantity_unit || b.unit || 'क्विंटल')}</div>
        <div>📅 <strong>तारीख:</strong> ${formatDate(b.booking_date)}</div>
        <div>⏰ <strong>समय:</strong> ${formatTime(b.start_time)} - ${formatTime(b.end_time)}</div>
        <div>📍 <strong>स्थान:</strong> ${escapeHtml(b.village || b.location || 'खरदोन कलां')}</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid #F1F5F9;">
        <div style="font-size:0.9rem;font-weight:800;color:var(--primary-green);" class="hindi">
          ${b.total_amount > 0 ? formatCurrency(b.total_amount) : ''}
        </div>
        <div>
          <select class="admin-status-select" onchange="changeBookingStatus('${b.id}', this.value)">
            <option value="pending" ${b.status==='pending'?'selected':''}>⏳ Pending</option>
            <option value="confirmed" ${b.status==='confirmed'?'selected':''}>✅ Confirmed</option>
            <option value="completed" ${b.status==='completed'?'selected':''}>✅ Completed</option>
            <option value="cancelled" ${b.status==='cancelled'?'selected':''}>❌ Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

async function changeBookingStatus(bookingId, status) {
  showLoader('स्थिति बदल रहे हैं...');
  try {
    await updateBookingStatus(bookingId, status);
    hideLoader();
    showToast('बुकिंग स्थिति अपडेट हुई!', 'success');
    const b = (window._adminBookings || []).find(x => x.id === bookingId);
    if (b) b.status = status;
    await renderAdminBookings();
  } catch(e) {
    hideLoader();
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

function filterBookings(query) {
  const filtered = (window._adminBookings || []).filter(b =>
    b.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
    (b.customer_phone || b.phone || '').includes(query) ||
    b.booking_number?.toLowerCase().includes(query.toLowerCase())
  );
  document.getElementById('bookings-cards-wrap').innerHTML = renderBookingsCards(filtered);
}

function filterBookingsByStatus(status) {
  const filtered = status ? (window._adminBookings || []).filter(b => b.status === status) : (window._adminBookings || []);
  document.getElementById('bookings-cards-wrap').innerHTML = renderBookingsCards(filtered);
}

window.renderAdminBookings = renderAdminBookings;
window.changeBookingStatus = changeBookingStatus;
window.filterBookings = filterBookings;
window.filterBookingsByStatus = filterBookingsByStatus;
