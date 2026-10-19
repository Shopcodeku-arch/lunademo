/**
 * Client-side Image Optimization Utility for Luna AI & Firebase
 * Compresses and scales images down to ideal resolution (~1024px, ~80-150KB)
 * for instant AI vision inference and fast Firebase Firestore/Storage persistence.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  blob?: Blob;
  name: string;
  width: number;
  height: number;
  size: number;
}

export interface OptimizeOptions {
  maxDimension?: number; // default 1024px (standard optimal for GPT-4o / Gemini vision)
  quality?: number; // default 0.82
  fileName?: string;
}

/**
 * Optimizes an image File, Blob, or Data URL.
 */
export async function optimizeImage(
  source: File | Blob | string,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const maxDimension = options.maxDimension || 1024;
  const quality = options.quality ?? 0.82;
  const defaultName = options.fileName || (source instanceof File ? source.name : 'image.jpg');

  // Convert source to Data URL string first if File/Blob
  let rawDataUrl: string;
  if (typeof source === 'string') {
    rawDataUrl = source;
  } else {
    rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca data gambar'));
      reader.readAsDataURL(source);
    });
  }

  // Load into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Format gambar tidak dapat diproses'));
    image.src = rawDataUrl;
  });

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // Calculate target dimension maintaining aspect ratio
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // If already small and under maxDimension and source is JPEG/PNG with small size, return
  if (
    origWidth <= maxDimension &&
    origHeight <= maxDimension &&
    source instanceof File &&
    source.size < 180 * 1024
  ) {
    return {
      dataUrl: rawDataUrl,
      blob: source,
      name: defaultName,
      width: origWidth,
      height: origHeight,
      size: source.size,
    };
  }

  // Draw onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      dataUrl: rawDataUrl,
      name: defaultName,
      width: origWidth,
      height: origHeight,
      size: rawDataUrl.length,
    };
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw white background if converting PNG to JPEG to avoid black transparent backgrounds
  const isPng = defaultName.toLowerCase().endsWith('.png') || rawDataUrl.startsWith('data:image/png');
  const targetMime = isPng ? 'image/png' : 'image/jpeg';

  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Export compressed data URL
  let optimizedDataUrl = canvas.toDataURL(targetMime, quality);

  // If PNG export is still huge (> 300KB), fallback to high-quality JPEG
  if (isPng && optimizedDataUrl.length > 400 * 1024) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  }

  // Convert to Blob for upload
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || undefined),
      optimizedDataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
      quality
    );
  });

  return {
    dataUrl: optimizedDataUrl,
    blob,
    name: defaultName.replace(/\.[^/.]+$/, '') + '.jpg',
    width: targetWidth,
    height: targetHeight,
    size: blob ? blob.size : Math.round(optimizedDataUrl.length * 0.75),
  };
}
