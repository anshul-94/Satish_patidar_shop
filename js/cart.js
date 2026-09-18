// =============================================
// Cart Management (localStorage)
// =============================================

const CART_KEY = 'swarni_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      price: product.price,
      unit: product.unit,
      image_url: product.image_url,
      quantity: quantity,
    });
  }
  saveCart(cart);
  showToast(`"${product.name_hi}" कार्ट में डला!`, 'success');
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  showToast('सामान हटा दिया।', 'info');
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    item.quantity = quantity;
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// =============================================
// RENDER CART PAGE
// =============================================
function renderCartPage() {
  const container = document.getElementById('cart-items');
  const emptyState = document.getElementById('cart-empty');
  const cartSummary = document.getElementById('cart-summary');
  const cart = getCart();
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (cartSummary) cartSummary.classList.add('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');
  if (cartSummary) cartSummary.classList.remove('hidden');
  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <img src="${escapeHtml(item.image_url || 'assets/images/product-super-feed.jpg')}"
           alt="${escapeHtml(item.name)}" class="cart-item-image"
           onerror="this.src='assets/images/product-super-feed.jpg'">
      <div>
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-name-hi hindi">${escapeHtml(item.name_hi)}</div>
        <div class="cart-item-price">${formatCurrency(item.price)} / ${escapeHtml(item.unit)}</div>
        <div class="quantity-selector" style="margin-top:8px;max-width:120px;">
          <button class="qty-btn" onclick="changeCartQty('${item.id}', -1)">−</button>
          <input type="number" class="qty-input" value="${item.quantity}" min="1"
                 onchange="changeCartQtyDirect('${item.id}', this.value)">
          <button class="qty-btn" onclick="changeCartQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="cart-item-subtotal">${formatCurrency(item.price * item.quantity)}</div>
        <button class="cart-item-remove" onclick="removeFromCartAndRefresh('${item.id}')">🗑 हटाएं</button>
      </div>
    </div>
  `).join('');
  updateCartSummary();
}

function updateCartSummary() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const deliveryCharge = subtotal > 0 ? 50 : 0;
  const total = subtotal + deliveryCharge;
  const subtotalEl = document.getElementById('cart-subtotal');
  const deliveryEl = document.getElementById('cart-delivery');
  const totalEl = document.getElementById('cart-total');
  const itemCountEl = document.getElementById('cart-item-count');
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (deliveryEl) deliveryEl.textContent = deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'मुफ्त';
  if (totalEl) totalEl.textContent = formatCurrency(total);
  if (itemCountEl) itemCountEl.textContent = `${getCartItemCount()} सामान`;
}

function changeCartQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      showConfirm('क्या इस सामान को हटाना है?', () => {
        removeFromCart(productId);
        renderCartPage();
      });
    } else {
      updateCartQuantity(productId, newQty);
      renderCartPage();
    }
  }
}

function changeCartQtyDirect(productId, value) {
  const qty = parseInt(value);
  if (isNaN(qty) || qty < 1) return;
  updateCartQuantity(productId, qty);
  renderCartPage();
}

function removeFromCartAndRefresh(productId) {
  removeFromCart(productId);
  renderCartPage();
}

window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.renderCartPage = renderCartPage;
window.updateCartSummary = updateCartSummary;
window.changeCartQty = changeCartQty;
window.changeCartQtyDirect = changeCartQtyDirect;
window.removeFromCartAndRefresh = removeFromCartAndRefresh;
