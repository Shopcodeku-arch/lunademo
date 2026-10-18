/**
 * Background removal utility using canvas-based edge-connected floodfill segmentation
 * and anti-aliased alpha feathering to produce clean transparent PNGs.
 */

export interface RemoveBackgroundResult {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

export async function removeBackground(
  imageSource: string | File
): Promise<RemoveBackgroundResult> {
  let dataUrlInput = '';

  if (typeof imageSource === 'string') {
    dataUrlInput = imageSource;
  } else {
    dataUrlInput = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    });
  }

  // Load image into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + String(err)));
    el.src = dataUrlInput;
  });

  // Scale down if extremely large to maintain smooth browser performance
  const maxDim = 1200;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Sample border pixels to detect dominant background color
  const samplePoints: [number, number, number][] = [];
  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a > 20) {
      samplePoints.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  };

  // Sample perimeter pixels
  const stepX = Math.max(1, Math.floor(width / 40));
  const stepY = Math.max(1, Math.floor(height / 40));
  for (let x = 0; x < width; x += stepX) {
    samplePixel(x, 0);
    samplePixel(x, height - 1);
  }
  for (let y = 0; y < height; y += stepY) {
    samplePixel(0, y);
    samplePixel(width - 1, y);
  }

  if (samplePoints.length === 0) {
    // Already transparent
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width,
      height,
      size: Math.round((dataUrlInput.length * 3) / 4),
    };
  }

  // Calculate average border color
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  for (const p of samplePoints) {
    totalR += p[0];
    totalG += p[1];
    totalB += p[2];
  }
  const bgR = Math.round(totalR / samplePoints.length);
  const bgG = Math.round(totalG / samplePoints.length);
  const bgB = Math.round(totalB / samplePoints.length);

  // Measure color variance to auto-tune tolerance
  let totalDev = 0;
  for (const p of samplePoints) {
    const dist = colorDist(p[0], p[1], p[2], bgR, bgG, bgB);
    totalDev += dist;
  }
  const avgDev = totalDev / samplePoints.length;
  // Adaptive tolerance based on background complexity
  const tolerance = Math.max(28, Math.min(65, avgDev * 2.2 + 25));
  const featherRange = 18;

  // 2. Connected-component flood fill starting from perimeter
  // Uses a 1-bit visited/background mask
  const totalPixels = width * height;
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const pushBg = (x: number, y: number) => {
    const pos = y * width + x;
    if (isBg[pos] !== 0) return;
    const idx = pos * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a < 30) {
      isBg[pos] = 2; // already transparent
      queue[qTail++] = pos;
      return;
    }

    const dist = colorDist(r, g, b, bgR, bgG, bgB);
    if (dist <= tolerance + featherRange) {
      isBg[pos] = dist <= tolerance ? 2 : 1; // 2: fully bg, 1: feather zone
      queue[qTail++] = pos;
    }
  };

  // Seed borders into queue
  for (let x = 0; x < width; x++) {
    pushBg(x, 0);
    pushBg(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushBg(0, y);
    pushBg(width - 1, y);
  }

  // BFS expansion
  while (qHead < qTail) {
    const pos = queue[qHead++];
    const x = pos % width;
    const y = (pos / width) | 0;

    // 4-neighbor expansion
    if (x > 0) expandNeighbor(x - 1, y);
    if (x < width - 1) expandNeighbor(x + 1, y);
    if (y > 0) expandNeighbor(x, y - 1);
    if (y < height - 1) expandNeighbor(x, y + 1);
  }

  function expandNeighbor(nx: number, ny: number) {
    const nPos = ny * width + nx;
    if (isBg[nPos] !== 0) return;

    const idx = nPos * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a < 30) {
      isBg[nPos] = 2;
      queue[qTail++] = nPos;
      return;
    }

    const dist = colorDist(r, g, b, bgR, bgG, bgB);
    if (dist <= tolerance + featherRange) {
      isBg[nPos] = dist <= tolerance ? 2 : 1;
      queue[qTail++] = nPos;
    }
  }

  // 3. Apply alpha mask with smooth edge feathering
  for (let i = 0; i < totalPixels; i++) {
    const mask = isBg[i];
    if (mask === 2) {
      data[i * 4 + 3] = 0; // Fully transparent
    } else if (mask === 1) {
      const idx = i * 4;
      const dist = colorDist(data[idx], data[idx + 1], data[idx + 2], bgR, bgG, bgB);
      const factor = Math.max(0, Math.min(1, (dist - tolerance) / featherRange));
      data[idx + 3] = Math.round(data[idx + 3] * factor);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const resultDataUrl = canvas.toDataURL('image/png');
  const sizeEstimate = Math.round((resultDataUrl.length * 3) / 4);

  return {
    dataUrl: resultDataUrl,
    width,
    height,
    size: sizeEstimate,
  };
}

// Perceptually weighted color distance
function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rMean = (r1 + r2) / 2;
  const dR = r1 - r2;
  const dG = g1 - g2;
  const dB = b1 - b2;
  return Math.sqrt((((512 + rMean) * dR * dR) >> 8) + 4 * dG * dG + (((767 - rMean) * dB * dB) >> 8));
}
