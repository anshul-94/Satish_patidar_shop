// =============================================
// WhatsApp Integration
// =============================================

const WA_BASE = 'https://wa.me/';

function generateWhatsAppUrl(phone, message) {
  const number = phone.replace(/[^0-9]/g, '');
  const fullNumber = number.startsWith('91') ? number : '91' + number;
  return `${WA_BASE}${fullNumber}?text=${encodeURIComponent(message)}`;
}

function getBusinessWhatsApp() {
  return APP_CONFIG.whatsappNumber || '918120860801';
}

function whatsappProduct(productName, productNameHi) {
  const msg = `Namaste! Mujhe ${productName} (${productNameHi}) ke baare mein jankari chahiye.\n\nKripya price aur availability batayein.\n\nDhanyawad 🙏`;
  return generateWhatsAppUrl(getBusinessWhatsApp(), msg);
}

function whatsappOrder(orderNumber, orderTotal) {
  const msg = `Namaste! Mera order #${orderNumber} hai.\nTotal: ₹${orderTotal}\n\nMujhe order status ke baare mein jankari chahiye.\n\nDhanyawad 🙏`;
  return generateWhatsAppUrl(getBusinessWhatsApp(), msg);
}

function whatsappService(serviceName, serviceNameHi) {
  const msg = `Namaste! Mujhe ${serviceName} (${serviceNameHi}) book karna hai.\n\nKripya availability aur rate batayein.\n\nDhanyawad 🙏`;
  return generateWhatsAppUrl(getBusinessWhatsApp(), msg);
}

function whatsappBooking(bookingNumber, serviceName, date) {
  const msg = `Namaste! Meri booking #${bookingNumber} hai.\nSeva: ${serviceName}\nDate: ${date}\n\nKripya confirm karein.\n\nDhanyawad 🙏`;
  return generateWhatsAppUrl(getBusinessWhatsApp(), msg);
}

function whatsappGeneral() {
  const msg = `Namaste! Mujhe Swarni Pashu Aahar ke baare mein jankari chahiye.\n\nDhanyawad 🙏`;
  return generateWhatsAppUrl(getBusinessWhatsApp(), msg);
}

function openWhatsApp(url) {
  window.open(url, '_blank');
}

window.generateWhatsAppUrl = generateWhatsAppUrl;
window.whatsappProduct = whatsappProduct;
window.whatsappOrder = whatsappOrder;
window.whatsappService = whatsappService;
window.whatsappBooking = whatsappBooking;
window.whatsappGeneral = whatsappGeneral;
window.openWhatsApp = openWhatsApp;
