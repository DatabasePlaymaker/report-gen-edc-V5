// Satu foto dalam laporan.
export interface PhotoItem {
  id: string;
  dataUrl: string;        // base64 hasil resize, siap di-embed ke PDF
  caption: string;        // mis. "EDC BARU", "EDC LAMA"
  indexNumber?: string;   // "Index number: 677" dari watermark GPS, opsional
}

// Metadata header laporan.
export interface ReportMeta {
  title: string;          // mis. "Report 180 SPM AEON BSD"
  merchant: string;       // "180 SPM AEON BSD"
  mid: string;            // "100130000006"
  location: string;       // "Kabupaten Tangerang, Banten"
  reportDate: string;     // "11 Agustus 2026"
  engineer: string;       // nama FSE
  ticketNumber: string;   // "2026-08110039"
}

// Lampiran = dokumen di akhir laporan (FSE Report, Tanda Terima).
// Bisa GAMBAR (jpg/png) atau PDF. PDF akan digabung utuh via pdf-lib;
// gambar dirender jadi 1 halaman via @react-pdf.
export interface AttachmentItem {
  id: string;
  kind: "image" | "pdf";
  label: string;
  dataUrl: string;      // untuk image: base64 hasil resize. untuk pdf: base64 file PDF asli
  previewUrl?: string;  // thumbnail (halaman pertama pdf, atau sama dgn dataUrl utk image)
  fileName?: string;    // nama file asli, untuk ditampilkan di kartu PDF
  originalDataUrl?: string; // gambar asli sebelum filter scan
  scanMode?: "none" | "grayscale" | "bw"; // filter scan aktif (hanya untuk kind "image")
}

export interface ReportData {
  meta: ReportMeta;
  photos: PhotoItem[];
  attachments: AttachmentItem[];
  defaultCaption: string;
}
