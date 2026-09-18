// =============================================
// Admin - Service Slots Management
// =============================================

async function renderAdminSlots() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">स्लॉट लोड हो रहे हैं...</p></div>';
  
  try {
    const services = await getServices(false);
    const today = new Date().toISOString().split('T')[0];
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">⏰ समय स्लॉट प्रबंधन</h2>
        <button class="btn btn-primary btn-sm hindi" onclick="showAddSlotForm()" style="border-radius:8px;font-weight:700;">
          ➕ स्लॉट जोड़ें
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="admin-mobile-form" style="margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label hindi">सेवा चुनें</label>
          <select class="form-control" id="slot-service-filter" onchange="loadAdminSlotsView()">
            <option value="">सभी सेवाएं</option>
            ${services.map(s => `<option value="${s.id}">${escapeHtml(s.name_hi)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label hindi">तारीख</label>
          <input type="date" class="form-control" id="slot-date-filter" value="${today}" onchange="loadAdminSlotsView()">
        </div>
      </div>

      <!-- Add Slot Form -->
      <div id="add-slot-form-container" class="hidden" style="margin-bottom:16px;">
        <div class="admin-mobile-form">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 class="hindi" style="margin:0;font-size:1.05rem;">नया स्लॉट जोड़ें</h3>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-slot-form-container').classList.add('hidden')">✕</button>
          </div>
          <form onsubmit="addAdminSlot(event)">
            <div class="form-group">
              <label class="form-label hindi">सेवा*</label>
              <select class="form-control" name="service_id" required>
                ${services.map(s => `<option value="${s.id}">${escapeHtml(s.name_hi)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label hindi">तारीख*</label>
              <input class="form-control" type="date" name="slot_date" required min="${today}" value="${today}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group">
                <label class="form-label hindi">प्रारंभ समय*</label>
                <input class="form-control" type="time" name="start_time" required value="10:00">
              </div>
              <div class="form-group">
                <label class="form-label hindi">समाप्त समय*</label>
                <input class="form-control" type="time" name="end_time" required value="11:00">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label hindi">क्षमता (Capacity)</label>
              <input class="form-control" type="number" name="capacity" value="5" min="1">
            </div>
            <button type="submit" class="btn btn-primary btn-full hindi" style="min-height:46px;font-weight:700;">➕ स्लॉट सुरक्षित करें</button>
          </form>
        </div>
      </div>

      <div id="slots-view-container"></div>
    `;
    window._adminServicesForSlots = services;
    await loadAdminSlotsView();
  } catch(e) {
    console.error('renderAdminSlots error:', e);
    content.innerHTML = '<div class="empty-state"><p class="hindi">लोड में समस्या।</p></div>';
  }
}

function showAddSlotForm() {
  document.getElementById('add-slot-form-container')?.classList.remove('hidden');
}

async function loadAdminSlotsView() {
  const serviceId = document.getElementById('slot-service-filter')?.value;
  const date = document.getElementById('slot-date-filter')?.value;
  container.innerHTML = '<div style="text-align:center;padding:16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">स्लॉट लोड हो रहे हैं...</p></div>';
  
  try {
    const slots = await getSlotsForAdmin(serviceId, date);
    window._adminSlots = slots;
    if (slots.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📅</div><p class="hindi">कोई स्लॉट नहीं मिला। नए स्लॉट जोड़ें।</p></div>';
      return;
    }
    
    // Group by date + service
    const grouped = {};
    slots.forEach(s => {
      const key = s.slot_date + '_' + s.service_id;
      if (!grouped[key]) grouped[key] = { date: s.slot_date, service_id: s.service_id, slots: [] };
      grouped[key].slots.push(s);
    });

    container.innerHTML = Object.values(grouped).map(group => {
      const service = (window._adminServicesForSlots || []).find(sv => sv.id === group.service_id);
      return `
        <div class="admin-panel" style="margin-bottom:16px;">
          <div class="admin-panel-header">
            <span class="admin-panel-title hindi">${service ? service.name_hi : 'सेवा'} - ${formatDate(group.date)}</span>
          </div>
          <div class="admin-panel-body">
            <div class="admin-slot-grid">
              ${group.slots.map(slot => {
                const status = slot.is_blocked ? 'blocked' : (slot.booked_count >= slot.capacity || !slot.is_available) ? 'booked' : 'available';
                return `
                  <div class="admin-slot-item ${status}" id="slot-card-${slot.id}">
                    <div class="admin-slot-time">${formatTime(slot.start_time)}</div>
                    <div class="admin-slot-time" style="font-size:0.75rem;">- ${formatTime(slot.end_time)}</div>
                    <div class="admin-slot-count">${slot.booked_count}/${slot.capacity} बुक</div>
                    <div style="font-size:0.75rem;margin:4px 0;font-weight:600;">${slot.is_blocked ? '🚫 बंद (Blocked)' : '✅ खुला'}</div>
                    <div class="admin-slot-actions">
                      ${!slot.is_blocked ? `
                        <button class="btn btn-sm btn-danger hindi" onclick="adminBlockSlot('${slot.id}', true)">🚫 ब्लॉक करें</button>
                      ` : `
                        <button class="btn btn-sm btn-primary hindi" onclick="adminBlockSlot('${slot.id}', false)">✅ खोलें</button>
                      `}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    console.error('loadAdminSlotsView error:', e);
    container.innerHTML = '<p class="hindi" style="padding:16px;">लोड में समस्या।</p>';
  }
}

async function addAdminSlot(event) {
  event.preventDefault();
  const form = event.target;
  const fd = new FormData(form);
  const slotData = {
    service_id: fd.get('service_id'),
    slot_date: fd.get('slot_date'),
    start_time: fd.get('start_time'),
    end_time: fd.get('end_time'),
    capacity: parseInt(fd.get('capacity')),
    booked_count: 0,
    is_available: true,
    is_blocked: false
  };
  showLoader('स्लॉट जोड़ रहे हैं...');
  try {
    await upsertSlot(slotData);
    hideLoader();
    showToast('स्लॉट जोड़ा गया!', 'success');
    document.getElementById('add-slot-form-container')?.classList.add('hidden');
    await loadAdminSlotsView();
  } catch(e) {
    hideLoader();
    console.error('addAdminSlot error:', e);
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

async function adminBlockSlot(slotId, block) {
  showLoader(block ? 'स्लॉट ब्लॉक कर रहे हैं...' : 'स्लॉट खोल रहे हैं...');
  try {
    await blockSlot(slotId, block);
    hideLoader();
    showToast(block ? 'स्लॉट ब्लॉक कर दिया गया!' : 'स्लॉट खोल दिया गया!', 'success');
    await loadAdminSlotsView();
  } catch(e) {
    hideLoader();
    console.error('adminBlockSlot error:', e);
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

window.renderAdminSlots = renderAdminSlots;
window.showAddSlotForm = showAddSlotForm;
window.loadAdminSlotsView = loadAdminSlotsView;
window.addAdminSlot = addAdminSlot;
window.adminBlockSlot = adminBlockSlot;
