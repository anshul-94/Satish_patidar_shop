// =============================================
// Admin - Services Management (Mobile)
// =============================================

async function renderAdminServices() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">सेवाएं लोड हो रही हैं...</p></div>';

  try {
    const services = await getServices(false);
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">⚙️ सेवाएं प्रबंधन (${services.length})</h2>
        <button class="btn btn-primary btn-sm hindi" onclick="showServiceForm()" style="border-radius:8px;font-weight:700;">
          + सेवा जोड़ें
        </button>
      </div>

      <!-- Add/Edit Service Form Container -->
      <div id="service-form-container" class="hidden" style="margin-bottom:16px;"></div>

      <!-- Mobile Service Cards -->
      <div id="services-cards-body">
        ${renderServicesCards(services)}
      </div>
    `;
    window._adminServices = services;
  } catch(e) {
    console.error('renderAdminServices error:', e);
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="hindi">सेवाएं लोड करने में समस्या।</p><button class="btn btn-primary btn-sm hindi" onclick="renderAdminServices()">दोबारा कोशिश करें</button></div>';
  }
}

function renderServicesCards(services) {
  if (services.length === 0) {
    return '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon">⚙️</div><p class="hindi">कोई सेवा उपलब्ध नहीं है।</p></div>';
  }

  return services.map(s => `
    <div class="admin-mobile-card" id="service-card-${s.id}">
      <div class="admin-prod-card-top">
        <img src="${escapeHtml(s.image_url || 'assets/images/service-seed-grading.jpg')}" class="admin-prod-thumb" alt="" onerror="this.src='assets/images/service-seed-grading.jpg'">
        <div class="admin-prod-details">
          <div class="admin-prod-title hindi">🌾 ${escapeHtml(s.name_hi)}</div>
          <div class="admin-prod-sub">${escapeHtml(s.name)}</div>
          <div class="admin-prod-price">
            ${s.price > 0 ? formatCurrency(s.price) : 'संपर्क करें'}
            <span class="hindi" style="font-size:0.8rem;color:var(--light-text);font-weight:500;">/ ${escapeHtml(s.price_unit_hi || s.unit || 'क्विंटल')}</span>
          </div>
          <div style="margin-top:4px;">
            <span class="status-badge ${s.is_active ? 'status-confirmed' : 'status-cancelled'}">
              ${s.is_active ? '✅ सक्रिय' : '❌ निष्क्रिय'}
            </span>
          </div>
        </div>
      </div>

      <div class="admin-card-actions">
        <button class="btn btn-secondary hindi" onclick="showServiceForm('${s.id}')">
          ✏️ Edit
        </button>
        <button class="btn ${s.is_active ? 'btn-ghost' : 'btn-primary'} hindi" onclick="toggleServiceActive('${s.id}', ${!s.is_active})">
          ${s.is_active ? '🚫 Disable' : '✅ Enable'}
        </button>
      </div>
    </div>
  `).join('');
}

function showServiceForm(serviceId = null) {
  const container = document.getElementById('service-form-container');
  if (!container) return;
  const service = serviceId ? (window._adminServices || []).find(s => s.id === serviceId) : null;
  container.classList.remove('hidden');

  container.innerHTML = `
    <div class="admin-mobile-form">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 class="hindi" style="margin:0;font-size:1.1rem;color:var(--dark-green);">${service ? 'सेवा संपादित करें' : 'नई सेवा जोड़ें'}</h3>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('service-form-container').classList.add('hidden')">✕ बंद करें</button>
      </div>

      <form onsubmit="saveService(event, '${serviceId || ''}')">
        <div class="form-group">
          <label class="form-label hindi">सेवा नाम (English)*</label>
          <input class="form-control" name="name" value="${escapeHtml(service?.name || '')}" required>
        </div>

        <div class="form-group">
          <label class="form-label hindi">सेवा नाम (हिंदी)*</label>
          <input class="form-control" name="name_hi" value="${escapeHtml(service?.name_hi || '')}" required>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label class="form-label hindi">मूल्य (₹)*</label>
            <input class="form-control" type="number" step="0.01" name="price" id="admin-service-price-input" value="${service?.price || 0}" required>
          </div>
          <div class="form-group">
            <label class="form-label hindi">इकाई (हिंदी)</label>
            <input class="form-control" name="price_unit_hi" value="${escapeHtml(service?.price_unit_hi || service?.unit || 'क्विंटल')}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label hindi">सेवा फोटो</label>
          ${renderMobileImagePickerHTML({
            id: 'service-photo',
            currentImageUrl: service?.image_url || '',
            folder: 'services',
            defaultFallback: 'assets/images/service-seed-grading.jpg'
          })}
        </div>

        <div class="form-group">
          <label class="form-label hindi">विवरण (हिंदी)</label>
          <textarea class="form-control" name="description_hi" rows="2">${escapeHtml(service?.description_hi || '')}</textarea>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:0.9rem;cursor:pointer;">
            <input type="checkbox" name="is_active" ${service?.is_active !== false ? 'checked' : ''}>
            <span>✅ Active</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-full hindi" id="save-service-btn" style="min-height:46px;font-weight:700;">
          💾 सेवा सुरक्षित करें
        </button>
      </form>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth' });
}

async function saveService(e, serviceId) {
  e.preventDefault();
  const btn = document.getElementById('save-service-btn');
  btn.disabled = true;
  btn.textContent = '⏳ फोटो अपलोड हो रही है...';

  let finalImageUrl = 'assets/images/service-seed-grading.jpg';
  try {
    finalImageUrl = await uploadSelectedImageIfNeeded('service-photo', 'assets/images/service-seed-grading.jpg');
  } catch(uploadErr) {
    btn.disabled = false;
    btn.textContent = '💾 सेवा सुरक्षित करें';
    showToast('फोटो अपलोड में समस्या: ' + uploadErr.message, 'error');
    return;
  }

  btn.textContent = '⏳ सुरक्षित हो रहा है...';
  const form = e.target;
  const serviceData = {
    name: form.name.value.trim(),
    name_hi: form.name_hi.value.trim(),
    price: parseFloat(form.price.value) || 0,
    price_unit_hi: form.price_unit_hi.value.trim() || 'क्विंटल',
    unit: form.price_unit_hi.value.trim() || 'क्विंटल',
    image_url: finalImageUrl,
    description_hi: form.description_hi.value.trim(),
    is_active: form.is_active.checked,
  };

  if (serviceId) serviceData.id = serviceId;

  try {
    await upsertService(serviceData);
    showToast(serviceId ? 'सेवा अपडेट हो गई!' : 'नई सेवा जुड़ गई!', 'success');
    document.getElementById('service-form-container')?.classList.add('hidden');
    await renderAdminServices();
  } catch(err) {
    showToast('त्रुटि: ' + (err.message || 'सेवा सुरक्षित नहीं हुई'), 'error');
    btn.disabled = false;
    btn.textContent = '💾 सेवा सुरक्षित करें';
  }
}

async function toggleServiceActive(serviceId, active) {
  try {
    await upsertService({ id: serviceId, is_active: active });
    showToast(active ? 'सेवा सक्रिय की गई।' : 'सेवा निष्क्रिय की गई।', 'info');
    await renderAdminServices();
  } catch(e) {
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

window.renderAdminServices = renderAdminServices;
window.showServiceForm = showServiceForm;
window.saveService = saveService;
window.toggleServiceActive = toggleServiceActive;
