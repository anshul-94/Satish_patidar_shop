// =============================================
// Mobile Image Upload — Supabase Storage
// Replaces local /api/upload with real Supabase Storage
// =============================================
//
// Usage:
//   renderMobileImagePickerHTML({ id, currentImageUrl, folder })
//   uploadSelectedImageIfNeeded(id, defaultFallback)
//
// Storage bucket required: "product-images"
// See supabase/storage_policies.sql to create it.
// =============================================

window._selectedImages = window._selectedImages || {};

/**
 * Renders mobile-first native gallery picker HTML
 */
function renderMobileImagePickerHTML({
  id,
  currentImageUrl = '',
  folder = 'products',
  defaultFallback = 'assets/images/product-super-feed.jpg'
}) {
  window._selectedImages[id] = null;
  const hasImage   = Boolean(currentImageUrl && currentImageUrl.trim() && currentImageUrl !== defaultFallback);
  const displayUrl = hasImage ? currentImageUrl : (currentImageUrl || defaultFallback);

  return `
    <div class="mobile-image-picker" id="${id}-wrapper" data-folder="${folder}" data-fallback="${defaultFallback}">
      <input type="file" id="${id}-input" accept="image/*" capture="environment"
             style="display:none;" onchange="handleImageSelection(this, '${id}', '${folder}')">
      <input type="hidden" id="${id}-url" value="${escapeHtml(currentImageUrl || '')}">

      <!-- Tap to open Native Gallery -->
      <div class="image-picker-card ${hasImage ? 'hidden' : ''}" id="${id}-dropzone"
           onclick="document.getElementById('${id}-input').click()">
        <div class="image-picker-icon">🖼️</div>
        <div class="image-picker-title hindi">फोटो चुनें</div>
        <div class="image-picker-subtitle hindi">गैलरी से फोटो चुनें (अधिकतम 5 MB)</div>
      </div>

      <!-- Preview when image selected -->
      <div class="image-picker-preview ${hasImage ? '' : 'hidden'}" id="${id}-preview-box">
        <div class="image-preview-frame">
          <img id="${id}-preview-img" src="${escapeHtml(displayUrl)}" alt="Preview"
               onerror="this.src='${defaultFallback}'">
          <div class="image-badge hindi" id="${id}-badge">${hasImage ? 'मौजूदा फोटो' : 'फोटो चुनी गई ✓'}</div>
        </div>
        <div class="image-action-row">
          <button type="button" class="btn btn-secondary btn-sm hindi" style="flex:1;"
                  onclick="document.getElementById('${id}-input').click()">
            🔄 फोटो बदलें
          </button>
          <button type="button" class="btn btn-danger btn-sm hindi"
                  onclick="confirmRemoveSelectedImage('${id}', '${defaultFallback}')">
            🗑️ फोटो हटाएं
          </button>
        </div>
        <div id="${id}-filename" class="image-filename"></div>
      </div>

      <!-- Upload progress -->
      <div id="${id}-progress" class="hindi" style="display:none;font-size:0.85rem;color:var(--primary-green);margin-top:8px;">
        ⏳ फोटो अपलोड हो रही है...
      </div>

      <!-- Error container -->
      <div id="${id}-error" class="image-picker-error hindi"></div>
    </div>
  `;
}

/**
 * Handles image file selection — validates, compresses, previews
 */
async function handleImageSelection(input, id, folder) {
  const errorEl = document.getElementById(`${id}-error`);
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

  const file = input.files && input.files[0];
  if (!file) return;

  // Validate type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    showPickerError(id, 'केवल JPG, PNG या WEBP फोटो स्वीकार्य है।');
    input.value = '';
    return;
  }

  // Validate size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    showPickerError(id, 'फोटो 5 MB से छोटी होनी चाहिए');
    input.value = '';
    return;
  }

  try {
    const compressed = await compressImageFile(file, 1200, 0.85);

    const previewImg = document.getElementById(`${id}-preview-img`);
    const previewBox = document.getElementById(`${id}-preview-box`);
    const dropzone   = document.getElementById(`${id}-dropzone`);
    const badge      = document.getElementById(`${id}-badge`);
    const filenameEl = document.getElementById(`${id}-filename`);

    if (previewImg) previewImg.src = compressed.base64;
    if (previewBox) previewBox.classList.remove('hidden');
    if (dropzone)   dropzone.classList.add('hidden');
    if (badge)      badge.textContent = 'फोटो चुनी गई ✓';
    if (filenameEl) filenameEl.textContent = `${file.name} (${Math.round(compressed.size / 1024)} KB)`;

    // Save in memory
    window._selectedImages[id] = {
      file,
      base64:   compressed.base64,
      filename: file.name,
      folder,
      hasNew:   true,
      removed:  false,
    };
  } catch(err) {
    console.error('Image process error:', err);
    showPickerError(id, 'फोटो प्रोसेस करने में समस्या: ' + err.message);
    input.value = '';
  }
}

/**
 * Canvas-based image compression
 */
function compressImageFile(file, maxDimension = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width  = maxDimension;
          } else {
            width  = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const mimeType   = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const base64     = canvas.toDataURL(mimeType, quality);
        const approxBytes = Math.round((base64.length * 3) / 4);
        resolve({ base64, size: approxBytes, width, height });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function showPickerError(id, msg) {
  const el = document.getElementById(`${id}-error`);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

/**
 * Remove image after confirmation
 */
function confirmRemoveSelectedImage(id, defaultFallback) {
  if (!confirm('क्या यह फोटो हटानी है?')) return;

  const input      = document.getElementById(`${id}-input`);
  const previewBox = document.getElementById(`${id}-preview-box`);
  const dropzone   = document.getElementById(`${id}-dropzone`);
  const urlInput   = document.getElementById(`${id}-url`);
  const filenameEl = document.getElementById(`${id}-filename`);

  if (input)      input.value      = '';
  if (urlInput)   urlInput.value   = '';
  if (previewBox) previewBox.classList.add('hidden');
  if (dropzone)   dropzone.classList.remove('hidden');
  if (filenameEl) filenameEl.textContent = '';

  window._selectedImages[id] = { hasNew: false, removed: true };
}

/**
 * Upload to Supabase Storage (replaces /api/upload)
 *
 * Steps:
 *  1. Convert base64 → Blob
 *  2. Upload to Supabase Storage bucket
 *  3. Get public URL
 *  4. Return URL for saving in DB
 */
async function uploadSelectedImageIfNeeded(id, defaultFallback = 'assets/images/product-super-feed.jpg') {
  const state    = window._selectedImages[id];
  const urlInput = document.getElementById(`${id}-url`);
  const existingUrl = urlInput ? urlInput.value.trim() : '';

  // Show progress
  const progressEl = document.getElementById(`${id}-progress`);

  if (state && state.hasNew && state.base64) {
    if (progressEl) progressEl.style.display = 'block';
    try {
      const publicUrl = await uploadToSupabaseStorage(
        state.base64,
        state.filename,
        state.folder || 'products'
      );
      if (progressEl) progressEl.style.display = 'none';
      return publicUrl;
    } catch(err) {
      if (progressEl) progressEl.style.display = 'none';
      throw err;
    }
  }

  if (state && state.removed) return defaultFallback;

  return existingUrl || defaultFallback;
}

/**
 * Core Supabase Storage upload function
 */
async function uploadToSupabaseStorage(base64DataUrl, filename, folder = 'products') {
  const sb = getSupabase();

  // Convert base64 → Blob
  const [header, data] = base64DataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext       = mimeType === 'image/png' ? 'png' : 'jpg';

  // Build safe filename: folder/timestamp-random.ext
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 8);
  const safeName  = `${folder}/${timestamp}-${random}.${ext}`;

  // Decode base64 to Uint8Array
  const byteString = atob(data);
  const bytes      = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  const bucketName = folder === 'services' ? 'service-images' : 'product-images';

  const { data: uploadData, error } = await sb.storage
    .from(bucketName)
    .upload(safeName, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    if (error.message?.includes('Bucket not found')) {
      throw new Error('Storage bucket नहीं मिला। Admin को DEPLOYMENT.md देखना होगा।');
    }
    throw new Error('फोटो अपलोड नहीं हो पाई: ' + error.message);
  }

  // Get public URL
  const { data: urlData } = sb.storage.from(bucketName).getPublicUrl(safeName);
  if (!urlData?.publicUrl) {
    throw new Error('फोटो अपलोड हुई लेकिन URL नहीं मिला');
  }

  return urlData.publicUrl;
}

// Export
window.renderMobileImagePickerHTML    = renderMobileImagePickerHTML;
window.handleImageSelection           = handleImageSelection;
window.confirmRemoveSelectedImage     = confirmRemoveSelectedImage;
window.uploadSelectedImageIfNeeded    = uploadSelectedImageIfNeeded;
window.uploadToSupabaseStorage        = uploadToSupabaseStorage;
