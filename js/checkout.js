// =============================================
// Checkout Module
// =============================================

async function initCheckoutPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  const user = getCurrentUser();
  if (user && user.mobile && user.mobile !== 'adminuser85') {
    const phoneInput = document.getElementById('checkout-phone');
    if (phoneInput && !phoneInput.value) {
      phoneInput.value = user.mobile;
    }
    const nameInput = document.getElementById('checkout-name');
    if (nameInput && !nameInput.value) {
      nameInput.value = user.full_name || localStorage.getItem('swarni_farmer_name') || '';
    }
  }

  // Autofill saved address details if available
  const villageInput = document.getElementById('checkout-village');
  if (villageInput && !villageInput.value) villageInput.value = (user && user.village) || localStorage.getItem('swarni_farmer_village') || '';

  const landmarkInput = document.getElementById('checkout-landmark');
  if (landmarkInput && !landmarkInput.value) landmarkInput.value = localStorage.getItem('swarni_farmer_landmark') || '';

  const addressInput = document.getElementById('checkout-address');
  if (addressInput && !addressInput.value) addressInput.value = (user && user.address) || localStorage.getItem('swarni_farmer_address') || '';

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }
  renderCheckoutSummary();
  
  // Load delivery charge from settings
  try {
    const settings = await getBusinessSettings();
    const deliveryCharge = settings.delivery_charge || 50;
    const minOrder = settings.minimum_order || 200;
    const subtotal = getCartTotal();
    const delivery = subtotal >= minOrder ? deliveryCharge : 0;
    document.getElementById('checkout-delivery').textContent = delivery > 0 ? formatCurrency(delivery) : 'मुफ्त';
    document.getElementById('checkout-total').textContent = formatCurrency(subtotal + delivery);
    window._checkoutDeliveryCharge = delivery;
  } catch(e) {
    window._checkoutDeliveryCharge = 50;
  }
}

function renderCheckoutSummary() {
  const cart = getCart();
  const container = document.getElementById('checkout-items');
  if (!container) return;
  container.innerHTML = cart.map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(item.name_hi)}</div>
        <div style="font-size:0.8rem;color:var(--light-text);">x${item.quantity} ${escapeHtml(item.unit)}</div>
      </div>
      <div style="font-weight:700;color:var(--primary-green);">${formatCurrency(item.price * item.quantity)}</div>
    </div>
  `).join('');
  const subtotal = getCartTotal();
  const subtotalEl = document.getElementById('checkout-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
}

async function submitOrder(event) {
  event.preventDefault();
  if (!isAuthenticated()) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  const currentUser = getCurrentUser();
  const form = document.getElementById('checkout-form');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  // Collect form data
  const orderData = {
    user_id: currentUser ? currentUser.id : null,
    customer_name: document.getElementById('checkout-name').value.trim(),
    customer_phone: document.getElementById('checkout-phone').value.trim(),
    customer_email: document.getElementById('checkout-email')?.value.trim() || null,
    delivery_village_city: document.getElementById('checkout-village').value.trim(),
    delivery_area: document.getElementById('checkout-area')?.value.trim() || null,
    delivery_landmark: document.getElementById('checkout-landmark')?.value.trim() || null,
    delivery_full_address: document.getElementById('checkout-address').value.trim(),
    delivery_pincode: document.getElementById('checkout-pincode')?.value.trim() || null,
    subtotal: getCartTotal(),
    delivery_charge: window._checkoutDeliveryCharge || 50,
    total_amount: getCartTotal() + (window._checkoutDeliveryCharge || 50),
    payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'cod',
    notes: document.getElementById('checkout-notes')?.value.trim() || null,
    order_status: 'pending',
  };
  const orderItems = getCart().map(item => ({
    product_id: item.id,
    product_name_snapshot: item.name,
    product_name_hi_snapshot: item.name_hi,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,
  }));
  const submitBtn = document.getElementById('place-order-btn') || document.querySelector('#checkout-form button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '✅ ऑर्डर दें';
  if (submitBtn) {
    submitBtn.innerHTML = '⏳ ओर्डर किया जा रहा है...';
    submitBtn.disabled = true;
  }

  try {
    const newOrder = await createOrder(orderData, orderItems);
    clearCart();
    showToast('ओर्डर हो गया! हम जल्द संपर्क करेंगे।', 'success');

    // Save farmer contact/address info for reuse in future bookings and checkouts
    if (orderData.customer_name) localStorage.setItem('swarni_farmer_name', orderData.customer_name);
    if (orderData.delivery_village_city) localStorage.setItem('swarni_farmer_village', orderData.delivery_village_city);
    if (orderData.delivery_landmark) localStorage.setItem('swarni_farmer_landmark', orderData.delivery_landmark);
    if (orderData.delivery_full_address) localStorage.setItem('swarni_farmer_address', orderData.delivery_full_address);
    
    const savedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
    savedOrders.push({ id: newOrder.id, number: newOrder.order_number, date: new Date().toISOString() });
    localStorage.setItem('saved_orders', JSON.stringify(savedOrders));

    window.location.href = 'order-details.html?id=' + newOrder.id;
  } catch(e) {
    if (submitBtn) {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
    console.error('Order error:', e);
    showToast('ओर्डर नहीं हुआ: ' + e.message, 'error');
  }
}

window.initCheckoutPage = initCheckoutPage;
window.renderCheckoutSummary = renderCheckoutSummary;
window.submitOrder = submitOrder;
