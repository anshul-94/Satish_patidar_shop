// =============================================
// Admin - Products & Categories Management (Mobile)
// =============================================

async function renderAdminProducts() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:24px 16px;"><div class="loading-spinner loading-spinner-sm" style="margin:0 auto 8px;"></div><p class="hindi text-muted" style="font-size:0.85rem;margin:0;">उत्पाद लोड हो रहे हैं...</p></div>';

  try {
    const [products, categories] = await Promise.all([getProducts({ activeOnly: false }), getCategories(false)]);
    content.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">📦 उत्पाद प्रबंधन (${products.length})</h2>
        <button class="btn btn-primary btn-sm hindi" onclick="showProductForm()" style="border-radius:8px;font-weight:700;">
          + उत्पाद जोड़ें
        </button>
      </div>

      <!-- Search Box -->
      <div class="admin-action-bar">
        <div class="admin-search-box">
          <span>🔍</span>
          <input type="text" placeholder="उत्पाद खोजें..." id="prod-search" oninput="filterAdminProducts(this.value)">
        </div>
      </div>

      <!-- Add/Edit Product Form Container -->
      <div id="product-form-container" class="hidden" style="margin-bottom:16px;"></div>

      <!-- Mobile Product Cards List -->
      <div id="products-cards-body">
        ${renderProductsCards(products, categories)}
      </div>
    `;
    window._adminProducts = products;
    window._adminCategories = categories;
  } catch(e) {
    console.error('renderAdminProducts error:', e);
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="hindi">लोड करने में समस्या।</p></div>';
  }
}

function renderProductsCards(products, categories) {
  if (products.length === 0) {
    return '<div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📦</div><p class="hindi">कोई उत्पाद नहीं मिला।</p></div>';
  }

  return products.map(p => {
    const cat = categories.find(c => c.id === p.category_id);
    return `
      <div class="admin-mobile-card" id="prod-card-${p.id}">
        <div class="admin-prod-card-top">
          <img src="${escapeHtml(p.image_url || 'assets/images/product-super-feed.jpg')}" class="admin-prod-thumb" alt="" onerror="this.src='assets/images/product-super-feed.jpg'">
          <div class="admin-prod-details">
            <div class="admin-prod-title hindi">${escapeHtml(p.name_hi)}</div>
            <div class="admin-prod-sub">${escapeHtml(p.name)} • ${escapeHtml(p.weight || p.unit || '')}</div>
            <div class="admin-prod-price">${formatCurrency(p.price)}</div>
            <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
              <span class="status-badge ${p.is_active ? 'status-confirmed' : 'status-cancelled'}">
                ${p.is_active ? '✅ सक्रिय' : '❌ निष्क्रिय'}
              </span>
              ${p.featured ? '<span class="status-badge status-pending">⭐ Featured</span>' : ''}
              <span style="font-size:0.75rem;color:var(--light-text);margin-left:auto;">स्टॉक: ${p.stock_quantity ?? 100}</span>
            </div>
          </div>
        </div>

        <div class="admin-card-actions">
          <button class="btn btn-secondary hindi" onclick="showProductForm('${p.id}')">
            ✏️ Edit
          </button>
          <button class="btn ${p.is_active ? 'btn-ghost' : 'btn-primary'} hindi" onclick="toggleProductActive('${p.id}', ${!p.is_active})">
            ${p.is_active ? '🚫 Disable' : '✅ Enable'}
          </button>
          <button class="btn btn-danger hindi" style="max-width:44px;" onclick="confirmDeleteProduct('${p.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterAdminProducts(query) {
  const products = (window._adminProducts || []).filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.name_hi?.toLowerCase().includes(query.toLowerCase())
  );
  document.getElementById('products-cards-body').innerHTML = renderProductsCards(products, window._adminCategories || []);
}

function getCategoryOptionsHTML(selectedId = '') {
  return (window._adminCategories || []).map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name_hi} (${c.name})</option>`).join('');
}

function showProductForm(productId = null) {
  const container = document.getElementById('product-form-container');
  if (!container) return;
  const product = productId ? (window._adminProducts || []).find(p => p.id === productId) : null;
  container.classList.remove('hidden');
  
  container.innerHTML = `
    <div class="admin-mobile-form">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 class="hindi" style="margin:0;font-size:1.1rem;color:var(--dark-green);">${product ? 'उत्पाद संपादित करें' : 'नया उत्पाद जोड़ें'}</h3>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('product-form-container').classList.add('hidden')">✕ बंद करें</button>
      </div>

      <form id="product-form" onsubmit="saveProduct(event, '${productId || ''}')">
        <div class="form-group">
          <label class="form-label hindi">नाम (English)*</label>
          <input class="form-control" name="name" value="${escapeHtml(product?.name || '')}" required>
        </div>

        <div class="form-group">
          <label class="form-label hindi">हिंदी नाम*</label>
          <input class="form-control" name="name_hi" value="${escapeHtml(product?.name_hi || '')}" required>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label class="form-label hindi">कीमत (₹)*</label>
            <input class="form-control" type="number" name="price" id="admin-product-price-input" step="0.01" value="${product?.price || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label hindi">वजन (जैसे 25 KG)</label>
            <input class="form-control" name="weight" value="${escapeHtml(product?.weight || '')}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label class="form-label hindi">इकाई (जैसे बोरी)</label>
            <input class="form-control" name="unit" value="${escapeHtml(product?.unit || 'बोरी')}">
          </div>
          <div class="form-group">
            <label class="form-label hindi">स्टॉक</label>
            <input class="form-control" type="number" name="stock_quantity" value="${product?.stock_quantity ?? 100}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label hindi">कैटेगरी</label>
          <select class="form-control" name="category_id">
            <option value="">-- चुनें --</option>
            ${getCategoryOptionsHTML(product?.category_id)}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label hindi">उत्पाद फोटो</label>
          ${renderMobileImagePickerHTML({
            id: 'product-photo',
            currentImageUrl: product?.image_url || '',
            folder: 'products',
            defaultFallback: 'assets/images/product-super-feed.jpg'
          })}
        </div>

        <div style="display:flex;gap:20px;margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:0.9rem;cursor:pointer;">
            <input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}>
            <span>⭐ Featured</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.9rem;cursor:pointer;">
            <input type="checkbox" name="is_active" ${product?.is_active !== false ? 'checked' : ''}>
            <span>✅ Active</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-full hindi" id="save-prod-btn" style="min-height:46px;font-weight:700;">
          💾 उत्पाद सुरक्षित करें
        </button>
      </form>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth' });
}

async function saveProduct(e, productId) {
  e.preventDefault();
  const btn = document.getElementById('save-prod-btn');
  btn.disabled = true;
  btn.textContent = '⏳ फोटो अपलोड हो रही है...';

  let finalImageUrl = 'assets/images/product-super-feed.jpg';
  try {
    finalImageUrl = await uploadSelectedImageIfNeeded('product-photo', 'assets/images/product-super-feed.jpg');
  } catch(uploadErr) {
    btn.disabled = false;
    btn.textContent = '💾 उत्पाद सुरक्षित करें';
    showToast('फोटो अपलोड में समस्या: ' + uploadErr.message, 'error');
    return;
  }

  btn.textContent = '⏳ सुरक्षित हो रहा है...';
  const form = e.target;
  const productData = {
    name: form.name.value.trim(),
    name_hi: form.name_hi.value.trim(),
    price: parseFloat(form.price.value),
    weight: form.weight.value.trim(),
    unit: form.unit.value.trim() || 'बोरी',
    stock_quantity: parseInt(form.stock_quantity.value) || 0,
    category_id: form.category_id.value || null,
    image_url: finalImageUrl,
    featured: form.featured.checked,
    is_active: form.is_active.checked,
  };

  if (productId) productData.id = productId;

  try {
    await upsertProduct(productData);
    showToast(productId ? 'उत्पाद अपडेट हो गया!' : 'नया उत्पाद जुड़ गया!', 'success');
    document.getElementById('product-form-container')?.classList.add('hidden');
    await renderAdminProducts();
  } catch(err) {
    showToast('त्रुटि: ' + (err.message || 'उत्पाद सुरक्षित नहीं हुआ'), 'error');
    btn.disabled = false;
    btn.textContent = '💾 उत्पाद सुरक्षित करें';
  }
}

async function toggleProductActive(productId, active) {
  try {
    await upsertProduct({ id: productId, is_active: active });
    showToast(active ? 'उत्पाद सक्रिय किया गया।' : 'उत्पाद निष्क्रिय किया गया।', 'info');
    await renderAdminProducts();
  } catch(e) {
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

async function confirmDeleteProduct(productId) {
  if (!confirm('क्या आप सचमुच इस उत्पाद को हटाना चाहते हैं?')) return;
  try {
    await deleteProduct(productId);
    showToast('उत्पाद हटाया गया।', 'success');
    await renderAdminProducts();
  } catch(e) {
    showToast('त्रुटि: ' + e.message, 'error');
  }
}

window.renderAdminProducts = renderAdminProducts;
window.filterAdminProducts = filterAdminProducts;
window.showProductForm = showProductForm;
window.saveProduct = saveProduct;
window.toggleProductActive = toggleProductActive;
window.confirmDeleteProduct = confirmDeleteProduct;
