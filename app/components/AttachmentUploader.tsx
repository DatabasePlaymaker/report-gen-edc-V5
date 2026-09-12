"use client";

import { useRef, useState } from "react";
import type { AttachmentItem } from "@/lib/types";
import { resizeImage } from "@/lib/imageResize";
import { fileToDataUrl, pdfFirstPageThumb } from "@/lib/pdfUtils";
import { applyScanFilter, type ScanMode } from "@/lib/scanFilter";

let attIdCounter = 0;
const nextId = () => `a_${Date.now()}_${attIdCounter++}`;

const SCAN_LABELS: Record<ScanMode, string> = {
  none: "Asli",
  grayscale: "Abu",
  bw: "B&W",
  clean: "Bersih",
};

export function AttachmentUploader({
  attachments,
  onChange,
}: {
  attachments: AttachmentItem[];
  onChange: (a: AttachmentItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [defaultLabel, setDefaultLabel] = useState("FSE Report");
  const [filtering, setFiltering] = useState<string | null>(null);

  async function processOne(file: File): Promise<AttachmentItem> {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const dataUrl = await fileToDataUrl(file);
      let previewUrl: string | undefined;
      try {
        previewUrl = await pdfFirstPageThumb(file);
      } catch (e) {
        console.warn("Thumbnail PDF gagal (merge tetap jalan):", e);
        previewUrl = undefined;
      }
      return {
        id: nextId(),
        kind: "pdf",
        label: defaultLabel,
        dataUrl,
        previewUrl,
        fileName: file.name,
      };
    }

    const dataUrl = await resizeImage(file);
    return {
      id: nextId(),
      kind: "image",
      label: defaultLabel,
      dataUrl,
      previewUrl: dataUrl,
      originalDataUrl: dataUrl,
      scanMode: "none",
      fileName: file.name,
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const arr = Array.from(files);
      const items: AttachmentItem[] = [];
      for (const f of arr) {
        items.push(await processOne(f));
      }
      onChange([...attachments, ...items]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateItem(id: string, patch: Partial<AttachmentItem>) {
    onChange(attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function removeItem(id: string) {
    onChange(attachments.filter((a) => a.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const i = attachments.findIndex((a) => a.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= attachments.length) return;
    const copy = [...attachments];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }

  async function setScan(att: AttachmentItem, mode: ScanMode) {
    if (att.kind !== "image") return;
    const src = att.originalDataUrl || att.dataUrl;
    setFiltering(att.id);
    try {
      const filtered = await applyScanFilter(src, mode);
      updateItem(att.id, {
        dataUrl: filtered,
        previewUrl: filtered,
        scanMode: mode,
      });
    } catch (e) {
      console.error("Filter scan gagal:", e);
      alert("Gagal menerapkan filter. Coba lagi.");
    } finally {
      setFiltering(null);
    }
  }

  return (
    <div className="nb-card p-5">
      <h2 className="mb-2 text-xl font-black uppercase">
        <span className="bg-nb-yellow px-2 nb-border shadow-nb-sm">
          3. Lampiran
        </span>
      </h2>
      <p className="mb-4 font-semibold text-gray-600">
        Dokumen tambahan (FSE Report, Tanda Terima) — ditaruh di akhir laporan.
        Terima <strong>PDF</strong> (disisipkan utuh, semua halaman) maupun{" "}
        <strong>gambar</strong> (JPG/PNG, 1 halaman). Lampiran gambar bisa diberi
        efek <strong>scan</strong> (Abu / B&amp;W).
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase">Label default</span>
          <input
            className="nb-input"
            value={defaultLabel}
            onChange={(e) => setDefaultLabel(e.target.value)}
            placeholder="FSE Report"
          />
        </label>
        <button
          type="button"
          className="nb-btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Memproses…" : "+ Tambah Lampiran"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {attachments.length > 0 && (
          <span className="ml-auto nb-border bg-nb-cyan px-3 py-1 font-black shadow-nb-sm">
            {attachments.length} LAMPIRAN
          </span>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="nb-border border-dashed bg-white/50 p-8 text-center font-bold text-gray-500">
          Belum ada lampiran. Opsional — lewati jika tidak perlu.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {attachments.map((a, i) => (
            <div key={a.id} className="nb-border bg-white shadow-nb-sm">
              <div className="relative">
                {a.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.previewUrl}
                    alt={a.label}
                    className="h-32 w-full border-b-[3px] border-nb-ink bg-gray-100 object-contain"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center border-b-[3px] border-nb-ink bg-gray-100 text-center text-xs font-bold text-gray-500">
                    {a.fileName || "PDF"}
                  </div>
                )}
                {a.kind === "pdf" && (
                  <span className="absolute right-1 top-1 nb-border bg-brand-orange px-1.5 py-0.5 text-[10px] font-black text-white shadow-nb-sm">
                    PDF
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 p-2">
                <input
                  className="nb-border bg-white px-2 py-1 text-xs font-bold outline-none"
                  value={a.label}
                  onChange={(e) => updateItem(a.id, { label: e.target.value })}
                  placeholder="Label"
                />

                {a.kind === "image" && (
                  <div className="flex gap-1">
                    {(["none", "grayscale", "clean"] as ScanMode[]).map((mode) => {
                      const active = (a.scanMode || "none") === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          disabled={filtering === a.id}
                          onClick={() => setScan(a, mode)}
                          className={
                            "nb-border flex-1 py-1 text-[10px] font-black disabled:opacity-40 " +
                            (active ? "bg-nb-yellow" : "bg-white")
                          }
                        >
                          {filtering === a.id && active ? "…" : SCAN_LABELS[mode]}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-1">
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-cyan py-1 text-xs font-black disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(a.id, -1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-cyan py-1 text-xs font-black disabled:opacity-30"
                    disabled={i === attachments.length - 1}
                    onClick={() => move(a.id, 1)}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-pink py-1 text-xs font-black"
                    onClick={() => removeItem(a.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}