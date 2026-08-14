// Resize + kompres gambar di browser SEBELUM di-embed ke PDF.
// Ini krusial: tanpa ini, 40 foto @ 4MB = PDF ratusan MB & generate lambat/crash.
// Target: sisi terpanjang <= 1400px, JPEG quality 0.72 — cukup tajam untuk cetak A4,
// tapi ukuran turun drastis.

const MAX_EDGE = 1400;
const QUALITY = 0.72;

export async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > height && width > MAX_EDGE) {
    height = Math.round((height * MAX_EDGE) / width);
    width = MAX_EDGE;
  } else if (height >= width && height > MAX_EDGE) {
    width = Math.round((width * MAX_EDGE) / height);
    height = MAX_EDGE;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  // Latar putih supaya PNG transparan tidak jadi hitam saat dikonversi ke JPEG.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}

// Resize banyak file secara paralel-terbatas supaya browser tidak kehabisan memori.
export async function resizeMany(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  const BATCH = 4; // proses 4 sekaligus
  for (let i = 0; i < files.length; i += BATCH) {
    const chunk = files.slice(i, i + BATCH);
    const done = await Promise.all(chunk.map((f) => resizeImage(f)));
    results.push(...done);
    onProgress?.(Math.min(i + BATCH, files.length), files.length);
  }
  return results;
}
