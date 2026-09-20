// =============================================
// Service Booking Module — Swarni Pashu Aahar
// =============================================

let selectedSlot = null;
let allSlots = [];
let currentServiceId = null;
let currentServicePrice = 0;

window.selectedSlot = null;

function calculateBookingTotal() {
  const qty = parseFloat(document.getElementById('booking-quantity')?.value) || 0;
  const display = document.getElementById('booking-total-display');
  if (display) {
    if (qty > 0 && currentServicePrice > 0) {
      const total = currentServicePrice * qty;
      display.textContent = 'अनुमानित कुल मूल्य: ' + formatCurrency(total);
      display.style.display = 'block';
    } else {
      display.style.display = 'none';
    }
  }
}

async function initBookingPage() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get('service');
  
  // Set min date to today immediately
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) {
      dateInput.value = today;
    }
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

      // Autofill farmer details if available (Logged in or previously saved)
      const user = getCurrentUser();
      if (user && user.mobile && user.mobile !== 'adminuser85') {
        const phoneInput = document.getElementById('booking-phone');
        if (phoneInput && !phoneInput.value) phoneInput.value = user.mobile;

        const nameInput = document.getElementById('booking-name');
        if (nameInput && !nameInput.value) nameInput.value = user.full_name || localStorage.getItem('swarni_farmer_name') || '';

        const villageInput = document.getElementById('booking-village');
        if (villageInput && !villageInput.value) villageInput.value = user.village || localStorage.getItem('swarni_farmer_village') || '';

        const landmarkInput = document.getElementById('booking-landmark');
        if (landmarkInput && !landmarkInput.value) landmarkInput.value = localStorage.getItem('swarni_farmer_landmark') || '';

        const locationInput = document.getElementById('booking-location');
        if (locationInput && !locationInput.value) locationInput.value = user.address || localStorage.getItem('swarni_farmer_address') || '';
      } else {
        // Autofill from localStorage for guest farmers returning
        const nameInput = document.getElementById('booking-name');
        if (nameInput && !nameInput.value) nameInput.value = localStorage.getItem('swarni_farmer_name') || '';

        const villageInput = document.getElementById('booking-village');
        if (villageInput && !villageInput.value) villageInput.value = localStorage.getItem('swarni_farmer_village') || '';

        const landmarkInput = document.getElementById('booking-landmark');
        if (landmarkInput && !landmarkInput.value) landmarkInput.value = localStorage.getItem('swarni_farmer_landmark') || '';

        const locationInput = document.getElementById('booking-location');
        if (locationInput && !locationInput.value) locationInput.value = localStorage.getItem('swarni_farmer_address') || '';
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
  clearSelectedSlot();
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
  clearSelectedSlot();
  const dateInput = document.getElementById('booking-date');
  if (currentServiceId && dateInput?.value) {
    await loadSlots(currentServiceId, dateInput.value);
  } else {
    clearSlots();
  }
}

function clearSelectedSlot() {
  selectedSlot = null;
  window.selectedSlot = null;
  const selectedInfo = document.getElementById('selected-slot-info');
  if (selectedInfo) {
    selectedInfo.innerHTML = '';
    selectedInfo.classList.add('hidden');
  }
}

function clearSlots() {
  clearSelectedSlot();
  const container = document.getElementById('slots-container');
  if (container) container.innerHTML = '<p class="hindi text-muted" style="padding:var(--space-md);">पहले सेवा और तारीख चुनें।</p>';
}

function getDefaultSlots(serviceId, date) {
  return [
    { id: `def-${date}-1`, service_id: serviceId, slot_date: date, start_time: '09:00:00', end_time: '11:00:00', capacity: 10, booked_count: 0, is_available: true, is_blocked: false },
    { id: `def-${date}-2`, service_id: serviceId, slot_date: date, start_time: '11:00:00', end_time: '13:00:00', capacity: 10, booked_count: 0, is_available: true, is_blocked: false },
    { id: `def-${date}-3`, service_id: serviceId, slot_date: date, start_time: '14:00:00', end_time: '16:00:00', capacity: 10, booked_count: 0, is_available: true, is_blocked: false },
    { id: `def-${date}-4`, service_id: serviceId, slot_date: date, start_time: '16:00:00', end_time: '18:00:00', capacity: 10, booked_count: 0, is_available: true, is_blocked: false }
  ];
}

async function loadSlots(serviceId, date) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  container.innerHTML = '<div style="display:flex;align-items:center;padding:12px;"><div class="loading-spinner loading-spinner-sm"></div><p class="hindi" style="margin-left:8px;margin-bottom:0;">उपलब्ध स्लॉट जांच रहे हैं...</p></div>';
  try {
    let slots = await getServiceSlots(serviceId, date);
    if (!slots || slots.length === 0) {
      // Provide standard default time slots for the chosen date
      slots = getDefaultSlots(serviceId, date);
    }
    allSlots = slots;
    renderSlots(allSlots);
  } catch(e) {
    allSlots = getDefaultSlots(serviceId, date);
    renderSlots(allSlots);
  }
}

function renderSlots(slots) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  if (!slots || slots.length === 0) {
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
        const isSelected = selectedSlot && String(selectedSlot.id) === String(slot.id);
        return `
          <div class="slot-item ${isAvail ? 'available' : (slot.is_blocked ? 'blocked' : 'unavailable')} ${isSelected ? 'selected' : ''}"
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
  selectedSlot = allSlots.find(s => String(s.id) === String(slotId));
  window.selectedSlot = selectedSlot;

  const selectedInfo = document.getElementById('selected-slot-info');
  if (selectedInfo && selectedSlot) {
    selectedInfo.innerHTML = `
      <div style="background:var(--soft-green);border:1px solid var(--primary-green);border-radius:var(--radius-md);padding:var(--space-md);margin-top:var(--space-sm);">
        <p class="hindi" style="color:var(--primary-green);font-weight:700;margin:0;">✅ चुना गया स्लॉट: ${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}</p>
      </div>`;
    selectedInfo.classList.remove('hidden');
  }
}
window.selectSlot = selectSlot;

async function submitBooking(event) {
  event.preventDefault();
  const activeSlot = selectedSlot || window.selectedSlot;
  if (!activeSlot) {
    showToast('पहले समय चुनें, फिर बुकिंग करें।', 'warning');
    return;
  }

  const form = document.getElementById('booking-form');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const dateInput = document.getElementById('booking-date');
  const selectedDate = dateInput?.value || activeSlot.slot_date;

  // Auth requirement check
  if (!isAuthenticated()) {
    const qtyVal = parseFloat(document.getElementById('booking-quantity').value) || 1;
    const draftBooking = {
      serviceId: currentServiceId,
      date: selectedDate,
      quantity: qtyVal,
      unit: document.getElementById('booking-unit')?.value || 'kg',
      name: document.getElementById('booking-name')?.value.trim() || '',
      phone: document.getElementById('booking-phone')?.value.trim() || '',
      village: document.getElementById('booking-village')?.value.trim() || '',
      landmark: document.getElementById('booking-landmark')?.value.trim() || '',
      location: document.getElementById('booking-location')?.value.trim() || '',
      slotId: activeSlot ? activeSlot.id : null,
    };
    localStorage.setItem('swarni_draft_booking', JSON.stringify(draftBooking));
    showToast('बुकिंग के लिए खाता बनाएं या लॉगिन करें', 'info');
    setTimeout(() => {
      window.location.href = 'signup.html?redirect=booking.html';
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
    slotId: String(activeSlot.id).startsWith('def-') ? null : activeSlot.id,
    serviceName: selectedOption?.dataset.name || '',
    customerName: document.getElementById('booking-name').value.trim(),
    customerPhone: document.getElementById('booking-phone').value.trim(),
    phone: document.getElementById('booking-phone').value.trim(),
    quantity: qtyVal,
    quantityUnit: document.getElementById('booking-unit')?.value || 'kg',
    unit: document.getElementById('booking-unit')?.value || 'kg',
    rateSnapshot: rateVal,
    totalAmount: totalVal,
    bookingDate: selectedDate,
    startTime: activeSlot.start_time,
    endTime: activeSlot.end_time,
    location: document.getElementById('booking-location')?.value.trim() || null,
    village: document.getElementById('booking-village').value.trim(),
    landmark: document.getElementById('booking-landmark')?.value.trim() || null,
    notes: null,
  };

  const submitBtn = document.querySelector('#booking-form button[type="submit"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '📅 बुकिंग अनुरोध भेजें';
  if (submitBtn) {
    submitBtn.innerHTML = '⏳ बुकिंग दर्ज की जा रही है...';
    submitBtn.disabled = true;
  }

  try {
    const result = await createBooking(params);
    if (result && (result.success || result.id)) {
      // Save farmer address/location for auto-fill in future checkouts and bookings
      if (params.customerName) localStorage.setItem('swarni_farmer_name', params.customerName);
      if (params.village) localStorage.setItem('swarni_farmer_village', params.village);
      if (params.landmark) localStorage.setItem('swarni_farmer_landmark', params.landmark);
      if (params.location) localStorage.setItem('swarni_farmer_address', params.location);

      localStorage.setItem('last_booking_number', result.booking_number);
      
      const savedBookings = JSON.parse(localStorage.getItem('saved_bookings') || '[]');
      savedBookings.push({ id: result.id, number: result.booking_number, date: new Date().toISOString() });
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
      showToast('बुकिंग में समस्या आई। पुनः प्रयास करें।', 'error');
    }
  } catch(e) {
    console.error('submitBooking error:', e);
    if (submitBtn) {
      submitBtn.innerHTML = originalBtnHtml;
      submitBtn.disabled = false;
    }
    showToast('बुकिंग में समस्या: ' + (e.message || 'नेटवर्क समस्या'), 'error');
  }
}

function renderBookingSuccess() {
  const container = document.getElementById('booking-success-content');
  if (!container) return;

  const bookingNumber = localStorage.getItem('last_booking_number') || 'BK-SUCCESS';
  const serviceName   = localStorage.getItem('last_booking_service') || 'मशीन ग्रेडिंग सेवा';
  const date          = localStorage.getItem('last_booking_date') || '';
  const time          = localStorage.getItem('last_booking_time') || '';
  const village       = localStorage.getItem('last_booking_village') || '';
  const qty           = localStorage.getItem('last_booking_qty') || '';

  container.innerHTML = `
    <div class="card-body" style="padding:28px 20px;text-align:center;">
      <div style="width:64px;height:64px;background:var(--soft-green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 16px;">
        ✅
      </div>
      <h2 class="hindi" style="color:var(--dark-green);margin:0 0 6px;">बुकिंग सफल हुई!</h2>
      <p class="hindi text-muted" style="margin:0 0 20px;font-size:0.95rem;">आपकी सेवा बुकिंग सफलतापूर्वक दर्ज हो गई है।</p>
      
      <div style="background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:left;margin-bottom:20px;line-height:1.8;" class="hindi">
        <div><strong>बुकिंग नंबर:</strong> #${escapeHtml(bookingNumber)}</div>
        <div><strong>सेवा:</strong> ${escapeHtml(serviceName)}</div>
        ${qty ? `<div><strong>मात्रा:</strong> ${escapeHtml(qty)}</div>` : ''}
        ${date ? `<div><strong>तारीख:</strong> ${escapeHtml(date)}</div>` : ''}
        ${time ? `<div><strong>समय:</strong> ${escapeHtml(time)}</div>` : ''}
        ${village ? `<div><strong>स्थान/गाँव:</strong> ${escapeHtml(village)}</div>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="https://wa.me/918120860801?text=${encodeURIComponent('नमस्ते, मेरी बुकिंग #' + bookingNumber + ' (' + serviceName + ') की पुष्टि करें।')}" class="btn btn-whatsapp btn-full hindi" target="_blank">
          💬 WhatsApp पर पूछें
        </a>
        <a href="index.html" class="btn btn-primary btn-full hindi">
          🏠 होम पेज पर जाएं
        </a>
      </div>
    </div>
  `;
}
window.renderBookingSuccess = renderBookingSuccess;
