"use client";

import { useState } from "react";
import type { ReportData } from "@/lib/types";

export function ExportButton({ data }: { data: ReportData }) {
  const [busy, setBusy] = useState(false);
  const disabled = busy || data.photos.length === 0;

  async function handleExport() {
    setBusy(true);
    try {
      let blob: Blob;

      if (data.attachments.length === 0) {
        // Tanpa lampiran: jalur ringan react-pdf langsung.
        const { pdf } = await import("@react-pdf/renderer");
        const { ReportPDF } = await import("@/lib/ReportPDF");
        blob = await pdf(<ReportPDF data={data} />).toBlob();
      } else {
        // Ada lampiran: gabung foto + lampiran (PDF/gambar) via pdf-lib.
        const { buildMergedPdf } = await import("@/lib/buildMergedPdf");
        blob = await buildMergedPdf(data);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe =
        (data.meta.title || "laporan").replace(/[^\w\-]+/g, "_") || "laporan";
      a.href = url;
      a.download = `${safe}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat PDF. Cek console untuk detail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled}
      className="nb-border bg-brand-orange px-8 py-4 text-lg font-black uppercase tracking-tight text-white shadow-nb-lg transition-all
                 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-nb
                 active:translate-x-[10px] active:translate-y-[10px] active:shadow-none
                 disabled:opacity-40 disabled:pointer-events-none"
    >
      {busy ? "Membuat PDF…" : "\u2b07 Export PDF"}
    </button>
  );
}
