// =============================================
// Supabase Client & Core Data Functions
// Real Database Integration - No Mock Fallbacks
// =============================================

let _supabase = null;
const DB_TIMEOUT_MS = 8000;

function withTimeout(promise, timeoutMs = DB_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('नेटवर्क धीमा है। दोबारा कोशिश करें।')), timeoutMs)
    )
  ]);
}

function isSupabaseConfigured() {
  if (typeof window.supabase === 'undefined') return false;
  if (!window.SUPABASE_URL || typeof window.SUPABASE_URL !== 'string') return false;
  if (!window.SUPABASE_ANON_KEY || typeof window.SUPABASE_ANON_KEY !== 'string') return false;
  if (window.SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' || window.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') return false;

  try {
    const parsed = new URL(window.SUPABASE_URL);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function getSupabase() {
  if (!_supabase) {
    if (typeof window.IS_DEV !== 'undefined' && window.IS_DEV) {
      console.log('Supabase URL configured:', Boolean(window.SUPABASE_URL && window.SUPABASE_URL.trim() !== ''));
      console.log('Supabase anon key configured:', Boolean(window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.trim() !== ''));
    }

    if (!isSupabaseConfigured()) {
      console.error('Supabase URL/Key missing or invalid format. URL:', window.SUPABASE_URL);
      throw new Error('डेटाबेस की सेटिंग पूरी नहीं है।');
    }

    _supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
  return _supabase;
}

// =============================================
// BUSINESS SETTINGS
// =============================================
async function getBusinessSettings() {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('business_settings').select('*').limit(1).single()
  );
  if (error && error.code !== 'PGRST116') {
    console.error('Settings error:', error);
  }
  return data || {};
}

async function updateBusinessSettings(settings) {
  const sb = getSupabase();
  const { data: existing } = await withTimeout(
    sb.from('business_settings').select('id').limit(1).single()
  );
  if (existing) {
    const { data, error } = await withTimeout(
      sb.from('business_settings').update(settings).eq('id', existing.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('business_settings').insert(settings).select().single()
    );
    if (error) throw error;
    return data;
  }
}

// =============================================
// CATEGORIES
// =============================================
async function getCategories(activeOnly = true) {
  const sb = getSupabase();
  let query = sb.from('categories').select('*').order('sort_order');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await withTimeout(query);
  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('⚠️ Table categories does not exist yet. Run supabase/schema.sql in Supabase SQL Editor.');
      return [];
    }
    console.error('Categories error:', error);
    throw error;
  }
  return data || [];
}

async function upsertCategory(category) {
  const sb = getSupabase();
  if (category.id) {
    const { data, error } = await withTimeout(
      sb.from('categories').update(category).eq('id', category.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('categories').insert(category).select().single()
    );
    if (error) throw error;
    return data;
  }
}

async function deleteCategory(id) {
  const sb = getSupabase();
  const { error } = await withTimeout(
    sb.from('categories').delete().eq('id', id)
  );
  if (error) throw error;
}

// =============================================
// PRODUCTS
// Fields: id, name, name_hi, price, unit, weight, stock_quantity, image_url, is_active, featured, category_id
// =============================================
async function getProducts({ categoryId, search, featured, activeOnly = true, limit = 100 } = {}) {
  const sb = getSupabase();
  let query = sb.from('products')
    .select('id, name, name_hi, price, unit, weight, stock_quantity, image_url, is_active, featured, category_id, sort_order')
    .order('sort_order')
    .limit(limit);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (featured) {
    query = query.eq('featured', true);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,name_hi.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await withTimeout(query);
  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('⚠️ Table products does not exist yet. Run supabase/schema.sql in Supabase SQL Editor.');
      return [];
    }
    console.error('Products error from Supabase:', error);
    throw error;
  }
  return data || [];
}

async function getProductById(id) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('products').select('*').eq('id', id).single()
  );
  if (error) {
    console.error('Product error:', error);
    throw error;
  }
  return data;
}

async function upsertProduct(product) {
  const sb = getSupabase();
  if (product.id) {
    const { data, error } = await withTimeout(
      sb.from('products').update({ ...product, updated_at: new Date() }).eq('id', product.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('products').insert(product).select().single()
    );
    if (error) throw error;
    return data;
  }
}

async function deleteProduct(id) {
  const sb = getSupabase();
  const { error } = await withTimeout(
    sb.from('products').update({ is_active: false }).eq('id', id)
  );
  if (error) throw error;
}

// =============================================
// SERVICES
// =============================================
async function getServices(activeOnly = true) {
  const sb = getSupabase();
  let query = sb.from('services').select('*').order('sort_order');
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await withTimeout(query);
  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('⚠️ Table services does not exist yet. Run supabase/schema.sql in Supabase SQL Editor.');
      return [];
    }
    console.error('Services error from Supabase:', error);
    throw error;
  }
  return data || [];
}

async function getServiceById(id) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('services').select('*').eq('id', id).single()
  );
  if (error) throw error;
  return data;
}

async function upsertService(service) {
  const sb = getSupabase();
  if (service.id) {
    const { data, error } = await withTimeout(
      sb.from('services').update({ ...service, updated_at: new Date() }).eq('id', service.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('services').insert(service).select().single()
    );
    if (error) throw error;
    return data;
  }
}

// =============================================
// SERVICE SLOTS
// =============================================
async function getServiceSlots(serviceId, date) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('service_slots')
      .select('*')
      .eq('service_id', serviceId)
      .eq('slot_date', date)
      .order('start_time')
  );
  if (error) {
    console.error('Slots error:', error);
    throw error;
  }
  return data || [];
}

async function getSlotsForAdmin(serviceId, date) {
  const sb = getSupabase();
  let query = sb.from('service_slots').select('*').order('slot_date').order('start_time');
  if (serviceId) query = query.eq('service_id', serviceId);
  if (date) query = query.eq('slot_date', date);
  const { data, error } = await withTimeout(query);
  if (error) throw error;
  return data || [];
}

async function upsertSlot(slot) {
  const sb = getSupabase();
  if (slot.id) {
    const { data, error } = await withTimeout(
      sb.from('service_slots').update(slot).eq('id', slot.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('service_slots').insert(slot).select().single()
    );
    if (error) throw error;
    return data;
  }
}

async function blockSlot(id, blocked) {
  const sb = getSupabase();
  const { error } = await withTimeout(
    sb.from('service_slots').update({ is_blocked: blocked, is_available: !blocked }).eq('id', id)
  );
  if (error) throw error;
}

// =============================================
// ORDERS
// =============================================
async function createOrder(orderData, orderItems) {
  const sb = getSupabase();
  const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
  const order = {
    ...orderData,
    order_number: orderNumber,
    user_id: null
  };

  const { data: newOrder, error: orderError } = await withTimeout(
    sb.from('orders').insert(order).select().single()
  );
  if (orderError) {
    console.error('Order insert error:', orderError);
    throw orderError;
  }

  const items = orderItems.map(item => ({
    order_id: newOrder.id,
    product_id: item.product_id || null,
    product_name_snapshot: item.product_name_snapshot,
    product_name_hi_snapshot: item.product_name_hi_snapshot || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal
  }));

  const { error: itemsError } = await withTimeout(
    sb.from('order_items').insert(items)
  );
  if (itemsError) {
    console.error('Order items insert error:', itemsError);
    throw itemsError;
  }

  return newOrder;
}

async function getOrders(userId = null) {
  const sb = getSupabase();
  let query = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await withTimeout(query);
  if (error) {
    console.error('Orders error:', error);
    throw error;
  }
  return data || [];
}

async function getOrderById(id) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('orders').select('*, order_items(*)').eq('id', id).single()
  );
  if (error) throw error;
  return data;
}

async function updateOrderStatus(id, status) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('orders').update({ order_status: status }).eq('id', id).select().single()
  );
  if (error) throw error;
  return data;
}

async function getAllOrders(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (filters.status) query = query.eq('order_status', filters.status);
  if (filters.search) {
    query = query.or(`customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
  }
  if (filters.limit) query = query.limit(filters.limit);
  const { data, error } = await withTimeout(query);
  if (error) {
    console.error('getAllOrders error:', error);
    throw error;
  }
  return data || [];
}

// =============================================
// BOOKINGS
// Fields: service_id, customer_name, phone, quantity, unit, booking_date, start_time, end_time, location, status, rate_snapshot, total_amount, created_at
// =============================================
async function createBookingAtomic(params) {
  return createBooking(params);
}

async function createBooking(params) {
  const sb = getSupabase();
  const currentUser = getCurrentUser();
  const bookingNumber = 'BK-' + Date.now().toString().slice(-8);
  const bookingData = {
    booking_number: bookingNumber,
    user_id: params.user_id || (currentUser ? currentUser.id : null),
    service_id: params.serviceId || null,
    slot_id: params.slotId || null,
    service_name_snapshot: params.serviceName || '',
    customer_name: params.customerName,
    customer_phone: params.customerPhone || params.phone || '',
    customer_email: params.customerEmail || null,
    quantity: params.quantity,
    quantity_unit: params.quantityUnit || params.unit || 'kg',
    booking_date: params.bookingDate,
    start_time: params.startTime,
    end_time: params.endTime,
    location: params.location || params.village || null,
    village: params.village || '',
    landmark: params.landmark || null,
    notes: params.notes || null,
    status: 'pending',
    rate_snapshot: params.rateSnapshot || params.rate || 0,
    total_amount: params.totalAmount || params.total || 0,
    created_at: new Date().toISOString()
  };

  const { data, error } = await withTimeout(
    sb.from('bookings').insert(bookingData).select().single()
  );
  if (error) {
    console.error('Booking insert error:', error);
    throw error;
  }

  // Update slot booked count if slotId provided
  if (params.slotId) {
    try {
      const { data: slot } = await sb.from('service_slots').select('booked_count, capacity').eq('id', params.slotId).single();
      if (slot) {
        const nextCount = (slot.booked_count || 0) + 1;
        await sb.from('service_slots').update({
          booked_count: nextCount,
          is_available: nextCount < slot.capacity
        }).eq('id', params.slotId);
      }
    } catch (slotErr) {
      console.warn('Could not update slot booked_count:', slotErr);
    }
  }

  return { success: true, booking_id: data.id, booking_number: data.booking_number, ...data };
}

async function getBookings(userId = null) {
  const sb = getSupabase();
  let query = sb.from('bookings').select('*, services(name, name_hi)').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await withTimeout(query);
  if (error) {
    console.error('Bookings error:', error);
    throw error;
  }
  return data || [];
}

async function getBookingById(id) {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('bookings').select('*, services(name, name_hi)').eq('id', id).single()
  );
  if (error) throw error;
  return data;
}

async function updateBookingStatus(id, status, adminNotes = null) {
  const sb = getSupabase();
  const updateData = { status };
  if (adminNotes !== null) updateData.admin_notes = adminNotes;
  const { data, error } = await withTimeout(
    sb.from('bookings').update(updateData).eq('id', id).select().single()
  );
  if (error) throw error;
  return data;
}

async function getAllBookings(filters = {}) {
  const sb = getSupabase();
  let query = sb.from('bookings').select('*, services(name, name_hi)').order('created_at', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.serviceId) query = query.eq('service_id', filters.serviceId);
  if (filters.date) query = query.eq('booking_date', filters.date);
  if (filters.search) {
    query = query.or(`customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,booking_number.ilike.%${filters.search}%`);
  }
  if (filters.limit) query = query.limit(filters.limit);
  const { data, error } = await withTimeout(query);
  if (error) {
    console.error('getAllBookings error:', error);
    throw error;
  }
  return data || [];
}

// =============================================
// GALLERY
// =============================================
async function getGallery(category = null) {
  const sb = getSupabase();
  let query = sb.from('gallery').select('*').eq('is_active', true).order('sort_order');
  if (category) query = query.eq('category', category);
  const { data, error } = await withTimeout(query);
  if (error) throw error;
  return data || [];
}

async function getAllGallery() {
  const sb = getSupabase();
  const { data, error } = await withTimeout(
    sb.from('gallery').select('*').order('sort_order')
  );
  if (error) throw error;
  return data || [];
}

async function upsertGalleryItem(item) {
  const sb = getSupabase();
  if (item.id) {
    const { data, error } = await withTimeout(
      sb.from('gallery').update(item).eq('id', item.id).select().single()
    );
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await withTimeout(
      sb.from('gallery').insert(item).select().single()
    );
    if (error) throw error;
    return data;
  }
}

async function deleteGalleryItem(id) {
  const sb = getSupabase();
  const { error } = await withTimeout(
    sb.from('gallery').delete().eq('id', id)
  );
  if (error) throw error;
}

// =============================================
// ANALYTICS (Admin)
// =============================================
async function getDashboardStats() {
  const sb = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  const [ordersRes, bookingsRes, productsRes, servicesRes] = await Promise.all([
    withTimeout(sb.from('orders').select('id, order_status, total_amount, created_at')),
    withTimeout(sb.from('bookings').select('id, status, booking_date, created_at')),
    withTimeout(sb.from('products').select('id, is_active')),
    withTimeout(sb.from('services').select('id, is_active')),
  ]);
  const orders = ordersRes.data || [];
  const bookings = bookingsRes.data || [];
  const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
  const todayBookings = bookings.filter(b => b.booking_date === today || b.created_at?.startsWith(today));
  const totalRevenue = orders.filter(o => o.order_status === 'delivered').reduce((sum, o) => sum + Number(o.total_amount), 0);
  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.order_status === 'pending').length,
    todayOrders: todayOrders.length,
    totalRevenue,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    todayBookings: todayBookings.length,
    activeProducts: (productsRes.data || []).filter(p => p.is_active).length,
    activeServices: (servicesRes.data || []).filter(s => s.is_active).length,
  };
}

// Make all functions globally available
window.getBusinessSettings = getBusinessSettings;
window.updateBusinessSettings = updateBusinessSettings;
window.getCategories = getCategories;
window.upsertCategory = upsertCategory;
window.deleteCategory = deleteCategory;
window.getProducts = getProducts;
window.getProductById = getProductById;
window.upsertProduct = upsertProduct;
window.deleteProduct = deleteProduct;
window.getServices = getServices;
window.getServiceById = getServiceById;
window.upsertService = upsertService;
window.getServiceSlots = getServiceSlots;
window.getSlotsForAdmin = getSlotsForAdmin;
window.upsertSlot = upsertSlot;
window.blockSlot = blockSlot;
window.createOrder = createOrder;
window.getOrders = getOrders;
window.getOrderById = getOrderById;
window.updateOrderStatus = updateOrderStatus;
window.getAllOrders = getAllOrders;
window.createBooking = createBooking;
window.createBookingAtomic = createBookingAtomic;
window.getBookings = getBookings;
window.getBookingById = getBookingById;
window.updateBookingStatus = updateBookingStatus;
window.getAllBookings = getAllBookings;
window.getGallery = getGallery;
window.getAllGallery = getAllGallery;
window.upsertGalleryItem = upsertGalleryItem;
window.deleteGalleryItem = deleteGalleryItem;
window.getDashboardStats = getDashboardStats;
window.getSupabase = getSupabase;
