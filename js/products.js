// =============================================
// Products Module
// =============================================

let allProducts = [];
let allCategories = [];
let currentFilters = { category: '', search: '', minPrice: 0, maxPrice: 99999, sort: 'default' };

// =============================================
// PRODUCT CARD HTML
// =============================================
function renderProductCard(product) {
  const stock = getStockLabel(product.stock_quantity);
  const imageUrl = product.image_url || 'assets/images/product-super-feed.jpg';
  return `
  <div class="product-card animate-on-scroll" id="product-${product.id}" data-product-id="${product.id}">
    <div class="product-card-image-wrap">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}"
           class="product-card-image" loading="lazy"
           onerror="this.src='assets/images/product-super-feed.jpg'">
      ${product.featured ? '<span class="product-card-badge">⭐ Featured</span>' : ''}
      ${product.stock_quantity === 0 ? '<span class="product-card-badge out-of-stock">Out of Stock</span>' : ''}
    </div>
    <div class="product-card-body">
      <div class="product-card-name">${escapeHtml(product.name)}</div>
      <div class="product-card-name-hi hindi">${escapeHtml(product.name_hi)}</div>
      <div class="product-card-description">${escapeHtml(product.description_hi || product.description || 'विवरण उपलब्ध नहीं')}</div>
      <div class="product-card-price">
        <span class="product-card-price-value">${formatCurrency(product.price)}</span>
        <span class="product-card-price-unit">/ ${escapeHtml(product.unit)}</span>
      </div>
      <div class="product-card-stock ${stock.cls}">${stock.label}</div>
    </div>
    <div class="product-card-actions">
      <button class="btn btn-secondary" onclick="openProductModal('${product.id}')" ${product.stock_quantity === 0 ? 'disabled' : ''}>
        🔍 विवरण
      </button>
      <button class="btn btn-primary" onclick="quickAddToCart('${product.id}')" ${product.stock_quantity === 0 ? 'disabled' : ''}>
        🛒 कार्ट
      </button>
    </div>
  </div>`;
}

function quickAddToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  if (product.stock_quantity === 0) {
    showToast('यह सामान अभी उपलब्ध नहीं है।', 'warning'); return;
  }
  addToCart(product, 1);
}

// =============================================
// LOAD PRODUCTS PAGE
// =============================================
async function loadProductsPage() {
  const container = document.getElementById('products-grid');
  const filterContainer = document.getElementById('category-filters');
  if (!container) return;
  try {
    [allCategories, allProducts] = await Promise.all([getCategories(), getProducts()]);
    // Render category filters
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button class="filter-tab active hindi" onclick="filterByCategory('')" data-cat="">सभी उत्पाद</button>
        ${allCategories.map(c => `<button class="filter-tab hindi" onclick="filterByCategory('${c.id}')" data-cat="${c.id}">${c.icon || ''} ${c.name_hi}</button>`).join('')}
      `;
    }
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const catSlug = params.get('category');
    if (catSlug) {
      const cat = allCategories.find(c => c.slug === catSlug);
      if (cat) filterByCategory(cat.id);
      else renderProducts(allProducts);
    } else {
      renderProducts(allProducts);
    }
    // Search from URL
    const searchQ = params.get('q');
    if (searchQ) {
      const searchInput = document.getElementById('product-search');
      if (searchInput) searchInput.value = searchQ;
      filterBySearch(searchQ);
    }
  } catch(e) {
    console.error('loadProductsPage error:', e);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 32px 16px; text-align: center;">
        <div class="empty-state-icon" style="font-size: 2.5rem; margin-bottom: 8px;">⚠️</div>
        <p class="empty-state-title hindi" style="font-size: 1.1rem; font-weight: 700; color: var(--dark-green); margin-bottom: 12px;">सामान नहीं आया। नेट डेटा चेक करें।</p>
        <button class="btn btn-primary hindi" onclick="loadProductsPage()" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 8px;">
          🔄 फिर कोशिश करें
        </button>
      </div>`;
  }
}

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  if (!container) return;
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title hindi">कोई सामान नहीं मिला</div>
        <p class="empty-state-message hindi">इस किस्म में अभी कुछ नहीं है।</p>
        <button class="btn btn-primary" onclick="filterByCategory('')">सभी सामान देखें</button>
      </div>`;
    if (countEl) countEl.textContent = '0 सामान';
    return;
  }
  container.innerHTML = products.map(renderProductCard).join('');
  if (countEl) countEl.textContent = `${products.length} सामान`;
  initScrollAnimations();
}

function filterByCategory(categoryId) {
  currentFilters.category = categoryId;
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === categoryId);
  });
  applyFilters();
}

function filterBySearch(query) {
  currentFilters.search = query.toLowerCase();
  applyFilters();
}

function applyFilters() {
  let filtered = [...allProducts];
  if (currentFilters.category) filtered = filtered.filter(p => p.category_id === currentFilters.category);
  if (currentFilters.search) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(currentFilters.search) ||
      p.name_hi?.toLowerCase().includes(currentFilters.search) ||
      p.description?.toLowerCase().includes(currentFilters.search) ||
      p.description_hi?.toLowerCase().includes(currentFilters.search)
    );
  }
  filtered = filtered.filter(p => p.price >= currentFilters.minPrice && p.price <= currentFilters.maxPrice);
  // Sort
  switch(currentFilters.sort) {
    case 'price-asc': filtered.sort((a,b) => a.price - b.price); break;
    case 'price-desc': filtered.sort((a,b) => b.price - a.price); break;
    case 'name': filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
    case 'featured': filtered.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
  }
  renderProducts(filtered);
}

// =============================================
// PRODUCT MODAL
// =============================================
async function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId) || await getProductById(productId);
  if (!product) return;
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  const stock = getStockLabel(product.stock_quantity);
  document.getElementById('modal-product-image').src = product.image_url || 'assets/images/product-super-feed.jpg';
  document.getElementById('modal-product-name').textContent = product.name;
  document.getElementById('modal-product-name-hi').textContent = product.name_hi;
  document.getElementById('modal-product-description').textContent = product.description_hi || product.description || 'विवरण जल्द उपलब्ध होगा।';
  document.getElementById('modal-product-price').textContent = formatCurrency(product.price) + ' / ' + product.unit;
  document.getElementById('modal-product-stock').textContent = stock.label;
  document.getElementById('modal-product-stock').className = 'product-card-stock ' + stock.cls;
  document.getElementById('modal-product-weight').textContent = product.weight || '-';
  // Set up add to cart
  const addBtn = document.getElementById('modal-add-cart');
  const buyBtn = document.getElementById('modal-buy-now');
  const waBtn = document.getElementById('modal-whatsapp');
  if (addBtn) {
    addBtn.disabled = product.stock_quantity === 0;
    addBtn.onclick = () => {
      const qty = parseInt(document.getElementById('modal-qty').value) || 1;
      addToCart(product, qty);
      closeModal('product-modal-overlay');
    };
  }
  if (buyBtn) {
    buyBtn.disabled = product.stock_quantity === 0;
    buyBtn.onclick = () => {
      const qty = parseInt(document.getElementById('modal-qty').value) || 1;
      addToCart(product, qty);
      window.location.href = 'cart.html';
    };
  }
  if (waBtn) {
    waBtn.href = whatsappProduct(product.name, product.name_hi);
  }
  document.getElementById('modal-qty').value = 1;
  window._currentModalProduct = product;
  calculateModalTotal();
  openModal('product-modal-overlay');
}

function calculateModalTotal() {
  const qtyInput = document.getElementById('modal-qty');
  const totalEl = document.getElementById('modal-product-total');
  if (!qtyInput || !totalEl || !window._currentModalProduct) return;
  const qty = Math.max(1, parseInt(qtyInput.value) || 1);
  const total = qty * Number(window._currentModalProduct.price || 0);
  totalEl.textContent = `कुल कीमत: ${formatCurrency(total)}`;
}

function stepModalQty(delta) {
  const qtyInput = document.getElementById('modal-qty');
  if (!qtyInput) return;
  const cur = parseInt(qtyInput.value) || 1;
  qtyInput.value = Math.max(1, cur + delta);
  calculateModalTotal();
}

// =============================================
// FEATURED PRODUCTS (for homepage)
// =============================================
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  try {
    const products = await getProducts({ featured: true, limit: 6 });
    if (products.length === 0) {
      const allProds = await getProducts({ limit: 6 });
      renderFeaturedProducts(allProds);
    } else {
      renderFeaturedProducts(products);
    }
  } catch(e) { console.error(e); }
}

function renderFeaturedProducts(products) {
  const container = document.getElementById('featured-products');
  if (!container) return;
  allProducts = products;
  container.innerHTML = products.map(renderProductCard).join('');
  initScrollAnimations();
}

window.loadProductsPage = loadProductsPage;
window.loadFeaturedProducts = loadFeaturedProducts;
window.renderProductCard = renderProductCard;
window.quickAddToCart = quickAddToCart;
window.openProductModal = openProductModal;
window.filterByCategory = filterByCategory;
window.filterBySearch = filterBySearch;
window.applyFilters = applyFilters;
window.calculateModalTotal = calculateModalTotal;
window.stepModalQty = stepModalQty;
window.allProducts = allProducts;
