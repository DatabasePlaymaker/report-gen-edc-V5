"use client";

import type { ReportMeta } from "@/lib/types";

const FIELDS: { key: keyof ReportMeta; label: string; placeholder: string }[] = [
  { key: "title", label: "Judul Laporan", placeholder: "Report 180 SPM AEON BSD" },
  { key: "merchant", label: "Merchant", placeholder: "180 SPM AEON BSD" },
  { key: "mid", label: "MID", placeholder: "100130000006" },
  { key: "ticketNumber", label: "No. Tiket", placeholder: "2026-08110039" },
  { key: "location", label: "Lokasi", placeholder: "Kab. Tangerang, Banten" },
  { key: "reportDate", label: "Tanggal", placeholder: "11 Agustus 2026" },
  { key: "engineer", label: "Engineer", placeholder: "Ichsan" },
];

export function MetaForm({
  meta,
  onChange,
}: {
  meta: ReportMeta;
  onChange: (m: ReportMeta) => void;
}) {
  return (
    <div className="nb-card p-5">
      <h2 className="mb-4 text-xl font-black uppercase">
        <span className="bg-nb-cyan px-2 nb-border shadow-nb-sm">1. Info Laporan</span>
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase tracking-wide">
              {f.label}
            </span>
            <input
              className="nb-input"
              value={meta[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...meta, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
