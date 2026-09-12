// Filter "scan dokumen" untuk lampiran gambar.
// Murni canvas, tanpa library. Tiga mode:
//   none      -> kembalikan gambar apa adanya
//   grayscale -> abu-abu, kontras dinaikkan sedikit, kertas diputihkan
//   bw        -> hitam-putih tegas (mendekati hasil scanner), via ambang adaptif

export type ScanMode = "none" | "grayscale" | "bw";

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

  if (mode === "grayscale") {
    const CONTRAST = 1.25;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = applyContrast(gray, CONTRAST);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  } else {
    let sum = 0;
    const grayCache = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      grayCache[p] = gray;
      sum += gray;
    }
    const mean = sum / (w * h);
    const threshold = mean * 0.92;

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = grayCache[p] >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}