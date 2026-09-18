// =============================================
// Service Booking Module
// =============================================

let selectedSlot = null;
let allSlots = [];
let currentServiceId = null;

let currentServicePrice = 0;

function calculateBookingTotal() {
  const qty = parseFloat(document.getElementById('booking-quantity')?.value) || 0;
  const display = document.getElementById('booking-total-display');
  if (qty > 0 && currentServicePrice > 0) {
    const total = currentServicePrice * qty;
    display.textContent = 'अनुमानित कुल मूल्य: ' + formatCurrency(total);
    display.style.display = 'block';
  } else {
    display.style.display = 'none';
  }
}


async function initBookingPage() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get('service');
  
  // Set min date to today immediately
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', onDateChange);
  }

  // Fetch services asynchronously without blocking page UI
  try {
    const services = await getServices();
    const serviceSelect = document.getElementById('booking-service');
    if (serviceSelect) {
      serviceSelect.innerHTML = `<option value="">-- सेवा चुनें --</option>` +
        services.map(s => `<option value="${s.id}" data-name="${escapeHtml(s.name)}" data-name-hi="${escapeHtml(s.name_hi)}" data-price="${s.price}" ${s.id === serviceId ? 'selected' : ''}>${s.name_hi} (₹${s.price}/${s.unit})</option>`).join('');
      if (serviceId) {
        serviceSelect.value = serviceId;
        currentServiceId = serviceId;
        await onServiceChange();
      }
      serviceSelect.addEventListener('change', onServiceChange);

      // Autofill user phone if logged in
      const user = getCurrentUser();
      if (user && user.mobile && user.mobile !== 'adminuser85') {
        const phoneInput = document.getElementById('booking-phone');
        if (phoneInput && !phoneInput.value) {
          phoneInput.value = user.mobile;
        }
      }

      // Restore draft booking if returning from login
      try {
        const draft = JSON.parse(localStorage.getItem('swarni_draft_booking') || 'null');
        if (draft) {
          localStorage.removeItem('swarni_draft_booking');
          if (draft.date && dateInput) dateInput.value = draft.date;
          if (draft.quantity && document.getElementById('booking-quantity')) document.getElementById('booking-quantity').value = draft.quantity;
          if (draft.unit && document.getElementById('booking-unit')) document.getElementById('booking-unit').value = draft.unit;
          if (draft.name && document.getElementById('booking-name')) document.getElementById('booking-name').value = draft.name;
          if (draft.phone && document.getElementById('booking-phone')) document.getElementById('booking-phone').value = draft.phone;
          if (draft.village && document.getElementById('booking-village')) document.getElementById('booking-village').value = draft.village;
          if (draft.landmark && document.getElementById('booking-landmark')) document.getElementById('booking-landmark').value = draft.landmark;
          if (draft.notes && document.getElementById('booking-notes')) document.getElementById('booking-notes').value = draft.notes;
          if (draft.serviceId) {
            serviceSelect.value = draft.serviceId;
            currentServiceId = draft.serviceId;
            await onServiceChange();
          }
        }
      } catch(e) {}
    }
  } catch(e) {
    console.error('Booking services load error:', e);
  }
}

async function onServiceChange() {
  const serviceSelect = document.getElementById('booking-service');
  currentServiceId = serviceSelect?.value;
  const selectedOpt = serviceSelect?.options[serviceSelect.selectedIndex];
  currentServicePrice = parseFloat(selectedOpt?.dataset.price || 0);
  calculateBookingTotal();
  const dateInput = document.getElementById('booking-date');
  if (dateInput?.value && currentServiceId) {
    await loadSlots(currentServiceId, dateInput.value);
  } else {
    clearSlots();
  }
}

async function onDateChange() {
  const dateInput = document.getElementById('booking-date');
  if (currentServiceId && dateInput?.value) {
    await loadSlots(currentServiceId, dateInput.value);
  } else {
    clearSlots();
  }
}

function clearSlots() {
  const container = document.getElementById('slots-container');
  if (container) container.innerHTML = '<p class="hindi text-muted" style="padding:var(--space-md);">पहले सेवा और तारीख चुनें।</p>';
  selectedSlot = null;
}

async function loadSlots(serviceId, date) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner loading-spinner-sm"></div><p class="hindi" style="margin-left:8px;">उपलब्ध स्लॉट जांच रहे हैं...</p>';
  try {
    allSlots = await getServiceSlots(serviceId, date);
    renderSlots(allSlots);
  } catch(e) {
    container.innerHTML = '<p class="hindi text-muted">स्लॉट लोड करने में समस्या।</p>';
  }
}

function renderSlots(slots) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  if (slots.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--space-xl);">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title hindi">इस तारीख पर कोई स्लॉट नहीं</div>
        <p class="empty-state-message hindi">कोई अन्य तारीख चुनें।</p>
      </div>`;
    return;
  }
  container.innerHTML = `
    <div class="slot-grid">
      ${slots.map(slot => {
        const isAvail = slot.is_available && !slot.is_blocked && slot.booked_count < slot.capacity;
        const startTime = formatTime(slot.start_time);
        const endTime = formatTime(slot.end_time);
        return `
          <div class="slot-item ${isAvail ? 'available' : (slot.is_blocked ? 'blocked' : 'unavailable')}"
               id="slot-${slot.id}"
               onclick="${isAvail ? `selectSlot('${slot.id}')` : ''}">
            <div class="slot-time">${startTime}</div>
            <div class="slot-time" style="font-size:0.75rem;font-weight:500;">- ${endTime}</div>
            <div class="slot-status ${isAvail ? 'available' : 'unavailable'}">
              ${isAvail ? '✅ उपलब्ध' : (slot.is_blocked ? '🚫 बंद' : '❌ भरा')}
            </div>
            ${isAvail && slot.capacity > 1 ? `<div style="font-size:0.65rem;color:var(--muted-text);">${slot.capacity - slot.booked_count} शेष</div>` : ''}
          </div>`;
      }).join('')}
    </div>
  `;
}

function selectSlot(slotId) {
  document.querySelectorAll('.slot-item').forEach(el => el.classList.remove('selected'));
  const slotEl = document.getElementById('slot-' + slotId);
  if (slotEl) slotEl.classList.add('selected');
  selectedSlot = allSlots.find(s => s.id === slotId);
  const selectedInfo = document.getElementById('selected-slot-info');
  if (selectedInfo && selectedSlot) {
    selectedInfo.innerHTML = `
      <div style="background:var(--soft-green);border:1px solid var(--primary-green);border-radius:var(--radius-md);padding:var(--space-md);margin-top:var(--space-sm);">
        <p class="hindi" style="color:var(--primary-green);font-weight:700;">✅ चुना गया स्लॉट: ${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}</p>
      </div>`;
    selectedInfo.classList.remove('hidden');
  }
}

async function submitBooking(event) {
  event.preventDefault();
  if (!selectedSlot) {
    showToast('पहले समय चुनें, फिर बुकिंग करें।', 'warning');
    return;
  }
  const form = document.getElementById('booking-form');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  // Auth requirement check
  if (!isAuthenticated()) {
    const qtyVal = parseFloat(document.getElementById('booking-quantity').value) || 1;
    const draftBooking = {
      serviceId: currentServiceId,
      date: document.getElementById('booking-date').value,
      quantity: qtyVal,
      unit: document.getElementById('booking-unit')?.value || 'kg',
      name: document.getElementById('booking-name')?.value.trim() || '',
      phone: document.getElementById('booking-phone')?.value.trim() || '',
      village: document.getElementById('booking-village')?.value.trim() || '',
      landmark: document.getElementById('booking-landmark')?.value.trim() || '',
      location: document.getElementById('booking-location')?.value.trim() || '',
      notes: document.getElementById('booking-notes')?.value.trim() || '',
      slotId: selectedSlot ? selectedSlot.id : null,
    };
    localStorage.setItem('swarni_draft_booking', JSON.stringify(draftBooking));
    showToast('बुकिंग के लिए पहले लॉगिन करें', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=booking.html';
    }, 350);
    return;
  }

  const currentUser = getCurrentUser();
  const serviceSelect = document.getElementById('booking-service');
  const selectedOption = serviceSelect?.options[serviceSelect.selectedIndex];
  const qtyVal = parseFloat(document.getElementById('booking-quantity').value) || 1;
  const rateVal = currentServicePrice || 0;
  const totalVal = rateVal * qtyVal;

  const params = {
    user_id: currentUser ? currentUser.id : null,
    serviceId: currentServiceId,
    slotId: selectedSlot.id,
    serviceName: selectedOption?.dataset.name || '',
    customerName: document.getElementById('booking-name').value.trim(),
    customerPhone: document.getElementById('booking-phone').value.trim(),
    phone: document.getElementById('booking-phone').value.trim(),
    customerEmail: document.getElementById('booking-email')?.value.trim() || null,
    quantity: qtyVal,
    quantityUnit: document.getElementById('booking-unit')?.value || 'kg',
    unit: document.getElementById('booking-unit')?.value || 'kg',
    rateSnapshot: rateVal,
    totalAmount: totalVal,
    bookingDate: document.getElementById('booking-date').value,
    startTime: selectedSlot.start_time,
    endTime: selectedSlot.end_time,
    location: document.getElementById('booking-location')?.value.trim() || null,
    village: document.getElementById('booking-village').value.trim(),
    landmark: document.getElementById('booking-landmark')?.value.trim() || null,
    notes: document.getElementById('booking-notes')?.value.trim() || null,
  };
  const submitBtn = document.querySelector('#booking-form button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '📅 बुकिंग कन्फर्म करें';
  if (submitBtn) {
    submitBtn.innerHTML = '⏳ बुकिंग दर्ज की जा रही है...';
    submitBtn.disabled = true;
  }

  try {
    const result = await createBooking(params);
    if (result && (result.success || result.id)) {
      localStorage.setItem('last_booking_number', result.booking_number);
      
      const savedBookings = JSON.parse(localStorage.getItem('saved_bookings') || '[]');
      savedBookings.push({ id: result.booking_id, number: result.booking_number, date: new Date().toISOString() });
      localStorage.setItem('saved_bookings', JSON.stringify(savedBookings));

      localStorage.setItem('last_booking_service', selectedOption?.dataset.nameHi || selectedOption?.dataset.name || '');
      localStorage.setItem('last_booking_date', params.bookingDate);
      localStorage.setItem('last_booking_time', formatTime(params.startTime) + ' - ' + formatTime(params.endTime));
      localStorage.setItem('last_booking_village', params.village);
      localStorage.setItem('last_booking_qty', params.quantity + ' ' + params.quantityUnit);
      showToast('बुकिंग हो गई! हम जल्द फोन करेंगे।', 'success');
      window.location.href = 'booking-success.html';
    } else {
      if (submitBtn) {
        submitBtn.innerHTML = originalBtnHtml;
        submitBtn.disabled = false;
      }
      const errorMsgs = {
        'SLOT_FULL': 'यह स्लॉट अभी भर गया है। कृपया दूसरा समय चुनें।',
        'SLOT_BLOCKED': 'यह स्लॉट उपलब्ध नहीं है। कृपया दूसरा चुनें।',
        'SLOT_UNAVAILABLE': 'यह स्लॉट अभी उपलब्ध नहीं है। कृपया दूसरा चुनें।',
      };
      showToast(errorMsgs[result.error] || 'बुकिंग में समस्या: ' + result.error, 'error');
      // Refresh slots
      await loadSlots(currentServiceId, params.bookingDate);
      selectedSlot = null;
    }
  } catch(e) {
    if (submitBtn) {
      submitBtn.innerHTML = originalBtnHtml;
      submitBtn.disabled = false;
    }
    console.error('Booking error:', e);
    showToast('बुकिंग नहीं हुई। कोशिश करें।', 'error');
  }
}

function renderBookingSuccess() {
  const bn = localStorage.getItem('last_booking_number') || 'BK-XXXX';
  const service = localStorage.getItem('last_booking_service') || '';
  const date = localStorage.getItem('last_booking_date') || '';
  const time = localStorage.getItem('last_booking_time') || '';
  const village = localStorage.getItem('last_booking_village') || '';
  const qty = localStorage.getItem('last_booking_qty') || '';
  const container = document.getElementById('booking-success-content');
  if (!container) return;
  container.innerHTML = `
    <div class="booking-success">
      <div class="booking-success-icon">🎉</div>
      <h2 class="hindi" style="color:var(--dark-green);margin-bottom:8px;">बुकिंग हो गई!</h2>
      <p class="hindi" style="color:var(--medium-text);">हम जल्द फोन करेंगे।</p>
      <div class="booking-detail-grid">
        <div class="booking-detail-item"><div class="booking-detail-label">Booking ID</div><div class="booking-detail-value">${escapeHtml(bn)}</div></div>
        <div class="booking-detail-item"><div class="booking-detail-label hindi">सेवा</div><div class="booking-detail-value hindi">${escapeHtml(service)}</div></div>
        <div class="booking-detail-item"><div class="booking-detail-label hindi">तारीख</div><div class="booking-detail-value hindi">${formatDate(date)}</div></div>
        <div class="booking-detail-item"><div class="booking-detail-label hindi">समय</div><div class="booking-detail-value">${escapeHtml(time)}</div></div>
        <div class="booking-detail-item"><div class="booking-detail-label hindi">मात्रा</div><div class="booking-detail-value hindi">${escapeHtml(qty)}</div></div>
        <div class="booking-detail-item"><div class="booking-detail-label hindi">ग्राम/स्थान</div><div class="booking-detail-value hindi">${escapeHtml(village)}</div></div>
      </div>
      <div style="background:var(--golden-light);border:1px solid var(--golden);border-radius:var(--radius-md);padding:var(--space-md);margin:var(--space-md) 0;">
        <p class="hindi" style="font-weight:700;color:#92400E;">⏳ स्थिति: पुष्टि प्रतीक्षारत</p>
        <p class="hindi" style="font-size:0.85rem;color:#92400E;margin-top:4px;">हमारी टीम जल्द ही आपसे संपर्क करेगी।</p>
      </div>
      <div style="display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap;margin-top:var(--space-lg);">
        <a href="${whatsappBooking(bn, service, date)}" class="btn btn-whatsapp hindi" target="_blank">💬 WhatsApp पर पुष्टि करें</a>
        
        <a href="index.html" class="btn btn-primary hindi">🏠 होम पर जाएं</a>
      </div>
    </div>`;
}

window.initBookingPage = initBookingPage;
window.onServiceChange = onServiceChange;
window.onDateChange = onDateChange;
window.selectSlot = selectSlot;
window.submitBooking = submitBooking;
window.renderBookingSuccess = renderBookingSuccess;
window.calculateBookingTotal = calculateBookingTotal;
