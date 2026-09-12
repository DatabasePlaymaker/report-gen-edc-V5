// Filter "scan dokumen" untuk lampiran gambar.
// Murni canvas, tanpa library. Empat mode:
//   none      -> gambar apa adanya
//   grayscale -> abu-abu, kontras dinaikkan sedikit
//   bw        -> hitam-putih tegas (ambang tunggal) — TIDAK dipakai di UI (rawan bayangan)
//   clean     -> "Bersih": grayscale + normalisasi latar (hilangkan bayangan gradual)

export type ScanMode = "none" | "grayscale" | "bw" | "clean";

async function loadBitmap(dataUrl: string): Promise<ImageBitmap> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function applyContrast(v: number, factor: number): number {
  return Math.max(0, Math.min(255, (v - 128) * factor + 128));
}

export async function applyScanFilter(
  dataUrl: string,
  mode: ScanMode
): Promise<string> {
  if (mode === "none") return dataUrl;

  const bitmap = await loadBitmap(dataUrl);
  const w = bitmap.width;
  const h = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  if (mode === "clean") {
    // === NORMALISASI LATAR (hilangkan bayangan) ===
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }

    const bg = estimateBackground(gray, w, h);

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const base = bg[p] < 1 ? 1 : bg[p];
      let v = (gray[p] / base) * 255;
      v = applyContrast(v, 1.15);
      v = v > 255 ? 255 : v < 0 ? 0 : v;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  } else if (mode === "grayscale") {
    const CONTRAST = 1.25;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = applyContrast(g, CONTRAST);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  } else {
    // bw (tidak dipakai di UI)
    let sum = 0;
    const gc = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      gc[p] = g;
      sum += g;
    }
    const threshold = (sum / (w * h)) * 0.92;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = gc[p] >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Estimasi latar: campur nilai terang & rata-rata per sel grid, di-smooth,
// lalu interpolasi balik ke ukuran penuh. Teks (gelap) "tertelan" kertas terang.
function estimateBackground(gray: Float32Array, w: number, h: number): Float32Array {
  const GRID = 24;
  const cellW = Math.max(1, Math.floor(w / GRID));
  const cellH = Math.max(1, Math.floor(h / GRID));
  const cols = Math.ceil(w / cellW);
  const rows = Math.ceil(h / cellH);
  const coarse = new Float32Array(cols * rows);

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const x0 = cx * cellW;
      const y0 = cy * cellH;
      const x1 = Math.min(w, x0 + cellW);
      const y1 = Math.min(h, y0 + cellH);
      let maxV = 0;
      let sum = 0;
      let cnt = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = gray[y * w + x];
          if (v > maxV) maxV = v;
          sum += v;
          cnt++;
        }
      }
      const mean = cnt ? sum / cnt : 255;
      coarse[cy * cols + cx] = mean * 0.4 + maxV * 0.6;
    }
  }

  const smooth = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = cy + dy;
          const nx = cx + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            s += coarse[ny * cols + nx];
            n++;
          }
        }
      }
      smooth[cy * cols + cx] = s / n;
    }
  }

  const bg = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = Math.min(rows - 1, y / cellH);
    const y0 = Math.floor(gy);
    const y1 = Math.min(rows - 1, y0 + 1);
    const fy = gy - y0;
    for (let x = 0; x < w; x++) {
      const gx = Math.min(cols - 1, x / cellW);
      const x0 = Math.floor(gx);
      const x1 = Math.min(cols - 1, x0 + 1);
      const fx = gx - x0;
      const v00 = smooth[y0 * cols + x0];
      const v10 = smooth[y0 * cols + x1];
      const v01 = smooth[y1 * cols + x0];
      const v11 = smooth[y1 * cols + x1];
      const top = v00 + (v10 - v00) * fx;
      const bot = v01 + (v11 - v01) * fx;
      bg[y * w + x] = top + (bot - top) * fy;
    }
  }
  return bg;
}