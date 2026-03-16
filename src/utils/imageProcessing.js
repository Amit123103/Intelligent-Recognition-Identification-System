/**
 * Advanced image preprocessing for low-quality, night, and partial face detection.
 * All operations work on canvas ImageData / 2D context.
 */

/**
 * Apply adaptive histogram equalization (CLAHE-like) to boost contrast in dark images.
 * Works per-channel on RGB.
 */
export function enhanceContrast(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Compute per-channel histogram
  for (let ch = 0; ch < 3; ch++) {
    const hist = new Uint32Array(256);
    for (let i = ch; i < data.length; i += 4) hist[data[i]]++;

    // Cumulative distribution function
    const cdf = new Uint32Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];

    const cdfMin = cdf.find(v => v > 0);
    const totalPixels = width * height;
    const scale = 255 / (totalPixels - cdfMin);

    // Equalize
    for (let i = ch; i < data.length; i += 4) {
      data[i] = Math.round((cdf[data[i]] - cdfMin) * scale);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Sharpen image using unsharp mask approach.
 * Helps with blurry / low-quality camera feeds.
 */
export function sharpenImage(ctx, width, height, amount = 0.6) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  // Simple 3x3 sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 4 + (1 / amount), -1,
    0, -1, 0,
  ];
  const kSum = kernel.reduce((a, b) => a + b, 0) || 1;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let val = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + ch;
            val += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        data[(y * width + x) * 4 + ch] = Math.max(0, Math.min(255, val / kSum));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Denoise image using simple box blur averaging for noisy low-light footage.
 * radius = 1 means 3x3 neighborhood.
 */
export function denoiseImage(ctx, width, height, radius = 1) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  const size = (2 * radius + 1) ** 2;

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            sum += copy[((y + ky) * width + (x + kx)) * 4 + ch];
          }
        }
        data[(y * width + x) * 4 + ch] = Math.round(sum / size);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Advanced night enhancement: adaptive brightness + gamma correction + noise reduction.
 */
export function nightEnhance(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  const avgBright = totalBrightness / (width * height);

  // Adaptive gamma: darker images get stronger correction
  const gamma = avgBright < 40 ? 0.35 : avgBright < 80 ? 0.5 : avgBright < 120 ? 0.7 : 0.85;

  // Build lookup table
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(255 * Math.pow(i / 255, gamma));
  }

  // Apply gamma + stretch
  let minV = 255, maxV = 0;
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const v = lut[data[i + ch]];
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
      data[i + ch] = v;
    }
  }

  // Histogram stretch
  const range = maxV - minV || 1;
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      data[i + ch] = Math.round(((data[i + ch] - minV) / range) * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Upscale a small face region for better feature extraction.
 * Uses bilinear interpolation via canvas scaling.
 */
export function upscaleFaceRegion(sourceCanvas, box, targetSize = 224) {
  const { x, y, width, height } = box;
  const pad = Math.max(width, height) * 0.3;
  const sx = Math.max(0, Math.floor(x - pad));
  const sy = Math.max(0, Math.floor(y - pad));
  const sw = Math.min(sourceCanvas.width - sx, Math.floor(width + pad * 2));
  const sh = Math.min(sourceCanvas.height - sy, Math.floor(height + pad * 2));

  const upCanvas = document.createElement('canvas');
  upCanvas.width = targetSize;
  upCanvas.height = targetSize;
  const uctx = upCanvas.getContext('2d', { willReadFrequently: true });
  uctx.imageSmoothingEnabled = true;
  uctx.imageSmoothingQuality = 'high';
  uctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
  return upCanvas;
}

/**
 * Selectively brightens dark regions (shadows) using an inverse-square gain curve.
 * Helps reveal details in underexposed faces without blowing out highlights.
 */
export function shadowRecovery(ctx, width, height, amount = 0.5) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const v = data[i + ch] / 255;
      // Gain curve: boost lower values more aggressively
      const gain = 1.0 + amount * Math.pow(1.0 - v, 2);
      data[i + ch] = Math.max(0, Math.min(255, v * gain * 255));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Enhanced local contrast via High-Pass Sharpening on the luminance channel.
 * Makes facial features "pop" in grainy or low-resolution footage.
 */
export function localContrastEnhancement(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  // 5x5 High-pass kernel
  const kernel = [
    -1, -1, -1, -1, -1,
    -1,  2,  2,  2, -1,
    -1,  2,  8,  2, -1,
    -1,  2,  2,  2, -1,
    -1, -1, -1, -1, -1
  ];
  const weight = 20;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let val = 0;
        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            val += copy[((y + ky) * width + (x + kx)) * 4 + ch] * kernel[(ky + 2) * 5 + (kx + 2)];
          }
        }
        const original = copy[(y * width + x) * 4 + ch];
        data[(y * width + x) * 4 + ch] = Math.max(0, Math.min(255, original + (val / weight)));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Preprocess an image canvas optimally for face detection.
 * Applies: denoise → shadow recovery → night enhance → contrast boost → local contrast → sharpen.
 */
export function preprocessForDetection(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  // Measure brightness to decide processing
  const sample = ctx.getImageData(0, 0, w, h);
  let totalBright = 0, noiseEstimate = 0;
  const pixCount = w * h;

  for (let i = 0; i < sample.data.length; i += 4) {
    const gray = sample.data[i] * 0.299 + sample.data[i + 1] * 0.587 + sample.data[i + 2] * 0.114;
    totalBright += gray;
  }
  const avgBright = totalBright / pixCount;

  // Estimate noise
  const patchSize = Math.min(32, Math.floor(Math.min(w, h) / 4));
  const px = Math.floor((w - patchSize) / 2);
  const py = Math.floor((h - patchSize) / 2);
  const patch = ctx.getImageData(px, py, patchSize, patchSize);
  let patchMean = 0;
  for (let i = 0; i < patch.data.length; i += 4) patchMean += patch.data[i];
  patchMean /= (patchSize * patchSize);
  for (let i = 0; i < patch.data.length; i += 4) noiseEstimate += (patch.data[i] - patchMean) ** 2;
  noiseEstimate = Math.sqrt(noiseEstimate / (patchSize * patchSize));

  // Adaptive pipeline
  if (noiseEstimate > 20 || options.forceNoise) {
    denoiseImage(ctx, w, h, 1);
  }

  // Recover shadows if dark area detected or force enabled
  if (avgBright < 110 || options.nightMode) {
    shadowRecovery(ctx, w, h, avgBright < 50 ? 0.8 : 0.5);
    nightEnhance(ctx, w, h);
  } else if (avgBright < 160) {
    enhanceContrast(ctx, w, h);
  }

  // Local contrast boost for facial detail recovery
  if (options.lowQuality || avgBright < 80) {
    localContrastEnhancement(ctx, w, h);
  }

  // Always sharpen lightly for low-quality feeds
  if (options.lowQuality || w < 640 || noiseEstimate > 15) {
    sharpenImage(ctx, w, h, 0.6);
  }

  return { avgBright, noiseEstimate, enhanced: true };
}

/**
 * Multi-pass detection: runs multiple detection passes with different configs
 * to catch partial/small/low-quality faces that a single pass might miss.
 */
export async function multiPassDetect(canvas, faceapi, settings) {
  const passes = [
    // Primary pass — standard settings
    {
      detector: settings.detector === 'ssd'
        ? new faceapi.SsdMobilenetv1Options({ minConfidence: settings.scoreThreshold })
        : new faceapi.TinyFaceDetectorOptions({ inputSize: settings.inputSize, scoreThreshold: settings.scoreThreshold }),
    },
    // Second pass — lower threshold for partial/occluded faces
    {
      detector: new faceapi.TinyFaceDetectorOptions({
        inputSize: Math.max(160, settings.inputSize - 96),
        scoreThreshold: Math.max(0.15, settings.scoreThreshold - 0.2),
      }),
    },
    // Third pass — SSD for larger faces that TinyFace missed
    {
      detector: new faceapi.SsdMobilenetv1Options({
        minConfidence: Math.max(0.15, settings.scoreThreshold - 0.25),
      }),
    },
    // Fourth pass — "Deep Night" pass for extremely low lighting
    {
      detector: new faceapi.TinyFaceDetectorOptions({
        inputSize: 128,
        scoreThreshold: 0.1,
      }),
    },
  ];

  let allDetections = [];
  const seenBoxes = [];

  for (let i = 0; i < passes.length; i++) {
    const pass = passes[i];
    try {
      // For the deep night pass, we perform an extra on-the-fly boost if nothing was found yet
      if (i === 3 && allDetections.length === 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
        const tctx = tempCanvas.getContext('2d');
        tctx.filter = 'brightness(2.0) contrast(1.5)';
        tctx.drawImage(canvas, 0, 0);
        var searchCanvas = tempCanvas;
      } else {
        var searchCanvas = canvas;
      }

      const dets = await faceapi.detectAllFaces(searchCanvas, pass.detector)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (dets && dets.length > 0) {
        for (const det of dets) {
          const box = det.detection.box;
          // Check if this face was already detected (IoU > 0.5 = duplicate)
          const isDuplicate = seenBoxes.some(sb => {
            const interX = Math.max(0, Math.min(box.right, sb.right) - Math.max(box.x, sb.x));
            const interY = Math.max(0, Math.min(box.bottom, sb.bottom) - Math.max(box.y, sb.y));
            const inter = interX * interY;
            const union = box.area + sb.area - inter;
            return inter / union > 0.5;
          });

          if (!isDuplicate) {
            allDetections.push(det);
            seenBoxes.push(box);
          }
        }
      }
    } catch (e) {
      // Pass failed, continue with next
    }
  }

  return allDetections;
}

/**
 * Generates a grid of overlapping tiles for a given resolution.
 * overlap: fraction of tile size to overlap (e.g. 0.2)
 */
export function generateTiles(width, height, cols = 3, rows = 2, overlap = 0.2) {
  const tiles = [];
  const tileW = Math.floor(width / (cols - (cols - 1) * overlap));
  const tileH = Math.floor(height / (rows - (rows - 1) * overlap));
  const stepX = Math.floor(tileW * (1 - overlap));
  const stepY = Math.floor(tileH * (1 - overlap));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        x: Math.min(c * stepX, width - tileW),
        y: Math.min(r * stepY, height - tileH),
        width: Math.min(tileW, width),
        height: Math.min(tileH, height)
      });
    }
  }
  return tiles;
}

/**
 * Tiled Multi-Pass Detection: Special mode for crowds and distance.
 * 1. Analyzes total frame for large faces.
 * 2. Analyzes grid tiles for tiny/distant faces.
 * 3. Deduplicates using IoU.
 */
export async function tiledMultiPassDetect(canvas, faceapi, settings) {
  const w = canvas.width;
  const h = canvas.height;
  
  // Pass 1: Global context (catch clear/large faces)
  let allDetections = await multiPassDetect(canvas, faceapi, settings);
  
  // Pass 2: Tiled analysis (catch small/distant faces)
  const tiles = generateTiles(w, h, settings.crowdTilingCols || 3, settings.crowdTilingRows || 2);
  
  // Process tiles in parallel for significant performance boost
  const tileResults = await Promise.all(tiles.map(async (tile) => {
    try {
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = 416;
      tileCanvas.height = 416;
      const tctx = tileCanvas.getContext('2d', { willReadFrequently: true });
      tctx.drawImage(canvas, tile.x, tile.y, tile.width, tile.height, 0, 0, 416, 416);
      
      const dets = await multiPassDetect(tileCanvas, faceapi, { 
        ...settings, 
        scoreThreshold: Math.max(0.1, settings.scoreThreshold - 0.1) 
      });
      return { dets, tile };
    } catch (e) {
      return { dets: [], tile };
    }
  }));

  for (const { dets, tile } of tileResults) {
    if (!dets || dets.length === 0) continue;

    const scaleX = tile.width / 416;
    const scaleY = tile.height / 416;

    for (const det of dets) {
      const b = det.detection.box;
      const globalBox = new faceapi.Box(
        b.x * scaleX + tile.x,
        b.y * scaleY + tile.y,
        b.width * scaleX,
        b.height * scaleY
      );

      // Deduplicate against already found faces
      const isDuplicate = allDetections.some(sb => {
        const box = sb.detection.box;
        const interX = Math.max(0, Math.min(globalBox.right, box.right) - Math.max(globalBox.x, box.x));
        const interY = Math.max(0, Math.min(globalBox.bottom, box.bottom) - Math.max(globalBox.y, box.y));
        const inter = interX * interY;
        const union = globalBox.area + box.area - inter;
        return inter / union > 0.4; // Slightly more lenient IoU for crowds
      });

      if (!isDuplicate) {
        det.detection._box = globalBox;
        det.landmarks._positions = det.landmarks.positions.map(p => ({
          x: p.x * scaleX + tile.x,
          y: p.y * scaleY + tile.y
        }));
        allDetections.push(det);
      }
    }
  }

  return allDetections;
}

/**
 * Enhanced descriptor matching with multiple distance metrics.
 * Combines Euclidean distance with cosine similarity for more robust matching.
 */
export function enhancedMatch(detDescriptor, enrolledDescriptor) {
  const a = detDescriptor instanceof Float32Array ? Array.from(detDescriptor) : detDescriptor;
  const b = enrolledDescriptor instanceof Float32Array ? Array.from(enrolledDescriptor) : enrolledDescriptor;

  // Euclidean distance
  let eucSum = 0;
  for (let i = 0; i < a.length; i++) eucSum += (a[i] - b[i]) ** 2;
  const eucDist = Math.sqrt(eucSum);

  // Cosine similarity
  let dotProd = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProd += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  const cosineSim = dotProd / (Math.sqrt(normA) * Math.sqrt(normB));
  const cosineDist = 1 - cosineSim;

  // Weighted combined distance (70% euclidean, 30% cosine for robustness)
  const combinedDist = eucDist * 0.7 + cosineDist * 0.3;

  return { eucDist, cosineDist, combinedDist, cosineSim };
}
