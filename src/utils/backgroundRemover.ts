/**
 * Intelligent client-side background removal utility.
 * Extracts foreground subjects by sampling edge boundary backgrounds,
 * applying flood-fill connectivity masks, color-distance segmentation,
 * and edge anti-aliasing to produce transparent PNG images.
 */

export async function removeImageBackground(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Cap dimensions for snappy performance and clean edges
        const maxDim = 1200;
        let targetW = width;
        let targetH = height;
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxDim) / targetW);
            targetW = maxDim;
          } else {
            targetW = Math.round((targetW * maxDim) / targetH);
            targetH = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // 1. Sample boundary pixels to determine dominant background color
        const cornerSamples: Array<[number, number, number]> = [];
        const stepX = Math.max(1, Math.floor(targetW / 40));
        const stepY = Math.max(1, Math.floor(targetH / 40));

        // Sample top and bottom rows
        for (let x = 0; x < targetW; x += stepX) {
          const topIdx = (0 * targetW + x) * 4;
          const botIdx = ((targetH - 1) * targetW + x) * 4;
          cornerSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
          cornerSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
        }
        // Sample left and right columns
        for (let y = 0; y < targetH; y += stepY) {
          const leftIdx = (y * targetW + 0) * 4;
          const rightIdx = (y * targetW + (targetW - 1)) * 4;
          cornerSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
          cornerSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
        }

        // Calculate average background color
        let bgR = 0;
        let bgG = 0;
        let bgB = 0;
        for (const [r, g, b] of cornerSamples) {
          bgR += r;
          bgG += g;
          bgB += b;
        }
        bgR = Math.round(bgR / cornerSamples.length);
        bgG = Math.round(bgG / cornerSamples.length);
        bgB = Math.round(bgB / cornerSamples.length);

        // 2. Flood-fill connectivity mask from border to identify outer background
        const visited = new Uint8Array(targetW * targetH);
        const isBackground = new Uint8Array(targetW * targetH);
        const queue: number[] = [];

        // Color distance function
        const getColorDist = (idx: number, r2: number, g2: number, b2: number) => {
          const r1 = data[idx];
          const g1 = data[idx + 1];
          const b1 = data[idx + 2];
          return Math.sqrt(
            0.3 * (r1 - r2) * (r1 - r2) +
            0.59 * (g1 - g2) * (g1 - g2) +
            0.11 * (b1 - b2) * (b1 - b2)
          );
        };

        // Tolerance for flood-fill background connectivity
        const bgTolerance = 48;

        // Seed outer edges into queue
        for (let x = 0; x < targetW; x++) {
          const topP = 0 * targetW + x;
          const botP = (targetH - 1) * targetW + x;
          if (getColorDist(topP * 4, bgR, bgG, bgB) < bgTolerance + 15) {
            queue.push(topP);
            visited[topP] = 1;
            isBackground[topP] = 1;
          }
          if (getColorDist(botP * 4, bgR, bgG, bgB) < bgTolerance + 15) {
            queue.push(botP);
            visited[botP] = 1;
            isBackground[botP] = 1;
          }
        }
        for (let y = 0; y < targetH; y++) {
          const leftP = y * targetW + 0;
          const rightP = y * targetW + (targetW - 1);
          if (!visited[leftP] && getColorDist(leftP * 4, bgR, bgG, bgB) < bgTolerance + 15) {
            queue.push(leftP);
            visited[leftP] = 1;
            isBackground[leftP] = 1;
          }
          if (!visited[rightP] && getColorDist(rightP * 4, bgR, bgG, bgB) < bgTolerance + 15) {
            queue.push(rightP);
            visited[rightP] = 1;
            isBackground[rightP] = 1;
          }
        }

        // BFS flood fill
        let head = 0;
        while (head < queue.length) {
          const p = queue[head++];
          const px = p % targetW;
          const py = Math.floor(p / targetW);

          // Check 4 neighbors
          const neighbors = [
            px > 0 ? p - 1 : -1,
            px < targetW - 1 ? p + 1 : -1,
            py > 0 ? p - targetW : -1,
            py < targetH - 1 ? p + targetW : -1,
          ];

          for (const np of neighbors) {
            if (np !== -1 && !visited[np]) {
              visited[np] = 1;
              const dist = getColorDist(np * 4, bgR, bgG, bgB);
              if (dist <= bgTolerance) {
                isBackground[np] = 1;
                queue.push(np);
              }
            }
          }
        }

        // 3. Apply alpha segmentation and smooth feathering
        const thresholdLow = 22;
        const thresholdHigh = 55;

        for (let i = 0; i < targetW * targetH; i++) {
          const pixelIdx = i * 4;
          const dist = getColorDist(pixelIdx, bgR, bgG, bgB);

          if (isBackground[i]) {
            // Connected background: make fully transparent
            data[pixelIdx + 3] = 0;
          } else if (dist < thresholdLow) {
            // Very close to background color: transparent
            data[pixelIdx + 3] = 0;
          } else if (dist < thresholdHigh) {
            // Soft feathered boundary
            const alphaFactor = (dist - thresholdLow) / (thresholdHigh - thresholdLow);
            data[pixelIdx + 3] = Math.round(data[pixelIdx + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentPng = canvas.toDataURL('image/png');
        resolve(transparentPng);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk proses hapus latar belakang'));
    img.src = imageSrc;
  });
}
