"use client";

import { useState } from "react";
import type { ReportMeta, PhotoItem, AttachmentItem } from "@/lib/types";
import { MetaForm } from "./components/MetaForm";
import { PhotoUploader } from "./components/PhotoUploader";
import { AttachmentUploader } from "./components/AttachmentUploader";
import { ExportButton } from "./components/ExportButton";

const DEFAULT_META: ReportMeta = {
  title: "Report 180 SPM AEON BSD",
  merchant: "180 SPM AEON BSD",
  mid: "100130000006",
  location: "Kabupaten Tangerang, Banten",
  reportDate: "11 Agustus 2026",
  engineer: "Ichsan",
  ticketNumber: "2026-08110039",
};

export default function Home() {
  const [meta, setMeta] = useState<ReportMeta>(DEFAULT_META);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  // Caption default dipegang di sini agar bisa dipakai PhotoUploader (kolom input)
  // DAN diteruskan ke PDF sebagai fallback untuk foto yang caption-nya kosong.
  const [defaultCaption, setDefaultCaption] = useState("EDC BARU");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="inline-block nb-border bg-nb-yellow px-6 py-4 shadow-nb-lg">
          <h1 className="text-3xl font-black uppercase leading-none tracking-tighter sm:text-4xl">
            Report Generator
          </h1>
          <p className="mt-1 font-bold">Laporan Foto Lapangan → PDF · PT CSI</p>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <MetaForm meta={meta} onChange={setMeta} />
        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          defaultCaption={defaultCaption}
          onDefaultCaptionChange={setDefaultCaption}
        />
        <AttachmentUploader attachments={attachments} onChange={setAttachments} />

        <div className="nb-card flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
          <div>
            <h2 className="text-xl font-black uppercase">
              <span className="bg-nb-cyan px-2 nb-border shadow-nb-sm">
                4. Export
              </span>
            </h2>
            <p className="mt-2 font-semibold text-gray-600">
              PDF dibuat di browser. Foto & lampiran otomatis dikompres.
            </p>
          </div>
          <ExportButton data={{ meta, photos, attachments, defaultCaption }} />
        </div>
      </div>

      <footer className="mt-10 text-center text-xs font-bold text-gray-500">
        UI neo-brutalist · Output PDF formal · Next.js + @react-pdf/renderer
      </footer>
    </main>
  );
}