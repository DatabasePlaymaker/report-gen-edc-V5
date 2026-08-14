import type { ReportData } from "./types";

// Ubah data URL "data:...;base64,XXXX" jadi Uint8Array.
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Bangun PDF final:
// 1) render bagian foto lewat @react-pdf -> Blob
// 2) buka dengan pdf-lib
// 3) untuk tiap lampiran: kalau PDF, copy semua halamannya; kalau gambar,
//    buat 1 halaman A4 dan gambar di tengah.
// 4) kembalikan Blob gabungan.
export async function buildMergedPdf(data: ReportData): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  const { ReportPDF } = await import("./ReportPDF");
  const { PDFDocument } = await import("pdf-lib");

  // 1) PDF bagian foto
  const photoBlob = await pdf(<ReportPDF data={data} />).toBlob();
  const photoBytes = new Uint8Array(await photoBlob.arrayBuffer());

  // 2) dokumen utama
  const merged = await PDFDocument.load(photoBytes);

  // A4 dalam points (72 dpi): 595.28 x 841.89
  const A4 = { w: 595.28, h: 841.89 };
  const MARGIN = 24;

  // 3) proses lampiran berurutan
  for (const att of data.attachments) {
    if (att.kind === "pdf") {
      try {
        const srcBytes = dataUrlToBytes(att.dataUrl);
        const srcDoc = await PDFDocument.load(srcBytes);
        const pages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach((pg) => merged.addPage(pg));
      } catch (e) {
        console.error(`Lampiran PDF "${att.label}" gagal digabung:`, e);
        // lanjut ke lampiran berikutnya, jangan gagalkan seluruh proses
      }
    } else {
      // gambar -> 1 halaman A4, gambar diskalakan agar muat (contain)
      try {
        const bytes = dataUrlToBytes(att.dataUrl);
        const isPng = att.dataUrl.startsWith("data:image/png");
        const img = isPng
          ? await merged.embedPng(bytes)
          : await merged.embedJpg(bytes);

        const page = merged.addPage([A4.w, A4.h]);
        const maxW = A4.w - MARGIN * 2;
        const maxH = A4.h - MARGIN * 2;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, {
          x: (A4.w - w) / 2,
          y: (A4.h - h) / 2,
          width: w,
          height: h,
        });
      } catch (e) {
        console.error(`Lampiran gambar "${att.label}" gagal digabung:`, e);
      }
    }
  }

  const out = await merged.save();
  // Bungkus dalam ArrayBuffer baru agar tipe cocok dengan BlobPart.
  return new Blob([out.slice().buffer], { type: "application/pdf" });
}
