// Utilitas terkait PDF di sisi browser.
// - fileToDataUrl: baca file jadi base64 data URL (untuk pdf-lib nanti)
// - pdfFirstPageThumb: render halaman pertama PDF jadi PNG kecil untuk preview

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Gagal membaca file"));
    r.readAsDataURL(file);
  });
}

// Render halaman pertama PDF ke PNG kecil (thumbnail).
export async function pdfFirstPageThumb(
  file: File,
  maxWidth = 300
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  // Worker: Diarahkan ke CDN publik menggunakan versi yang sama dengan package yang terinstal.
  // Ini mencegah Next.js/Terser mencoba mem-parsing file worker saat proses build Vercel.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(1);

  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(scaled.width);
  canvas.height = Math.ceil(scaled.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context tidak tersedia");

  await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  return canvas.toDataURL("image/png");
}