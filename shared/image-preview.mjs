// Salvaged from cratejuice-snaps. One owned URL; release on replacement/disposal.
export function createImagePreview(image, {urls = URL, maxBytes = 12 * 1024 * 1024, maxPixels = 24000000} = {}) {
  let owned = null;
  function clear() {
    image.onload = image.onerror = null;
    image.removeAttribute('src');
    if (owned) urls.revokeObjectURL(owned);
    owned = null;
  }
  function show(file, onError = () => {}) {
    if (!file || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP or GIF image.');
    if (!file.size || file.size > maxBytes) throw new Error('Choose an image smaller than 12 MB.');
    clear();
    const current = owned = urls.createObjectURL(file);
    image.onload = () => {
      if (owned !== current) return;
      if (image.naturalWidth * image.naturalHeight > maxPixels) {
        clear(); onError('Choose an image under 24 megapixels.');
      }
    };
    image.onerror = () => {
      if (owned === current) { clear(); onError('This image could not be opened.'); }
    };
    image.src = current;
  }
  return {show, clear, dispose: clear};
}
