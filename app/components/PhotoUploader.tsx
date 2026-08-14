"use client";

import { useRef, useState } from "react";
import type { PhotoItem } from "@/lib/types";
import { resizeMany } from "@/lib/imageResize";

let idCounter = 0;
const nextId = () => `p_${Date.now()}_${idCounter++}`;

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: PhotoItem[];
  onChange: (p: PhotoItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  // Caption default yang diterapkan ke semua foto baru saat diupload.
  const [batchCaption, setBatchCaption] = useState("EDC BARU");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const arr = Array.from(files);
    try {
      const dataUrls = await resizeMany(arr, (done, total) =>
        setProgress({ done, total })
      );
      const newItems: PhotoItem[] = dataUrls.map((dataUrl) => ({
        id: nextId(),
        dataUrl,
        caption: batchCaption,
        indexNumber: "",
      }));
      onChange([...photos, ...newItems]);
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateItem(id: string, patch: Partial<PhotoItem>) {
    onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeItem(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const i = photos.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= photos.length) return;
    const copy = [...photos];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }

  return (
    <div className="nb-card p-5">
      <h2 className="mb-4 text-xl font-black uppercase">
        <span className="bg-nb-pink px-2 nb-border shadow-nb-sm">2. Foto</span>
      </h2>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase">Caption default</span>
          <input
            className="nb-input"
            value={batchCaption}
            onChange={(e) => setBatchCaption(e.target.value)}
            placeholder="EDC BARU"
          />
        </label>
        <button
          type="button"
          className="nb-btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Memproses…" : "+ Tambah Foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {progress && (
          <span className="font-bold">
            {progress.done}/{progress.total} foto…
          </span>
        )}
        {photos.length > 0 && (
          <span className="ml-auto nb-border bg-nb-yellow px-3 py-1 font-black shadow-nb-sm">
            {photos.length} FOTO
          </span>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="nb-border border-dashed bg-white/50 p-10 text-center font-bold text-gray-500">
          Belum ada foto. Klik “Tambah Foto”.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.id} className="nb-border bg-white shadow-nb-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.caption}
                className="h-32 w-full border-b-[3px] border-nb-ink object-cover"
              />
              <div className="flex flex-col gap-1 p-2">
                <input
                  className="nb-border bg-white px-2 py-1 text-xs font-bold outline-none"
                  value={p.caption}
                  onChange={(e) => updateItem(p.id, { caption: e.target.value })}
                  placeholder="Caption"
                />
                <input
                  className="nb-border bg-white px-2 py-1 text-[10px] font-semibold outline-none"
                  value={p.indexNumber || ""}
                  onChange={(e) =>
                    updateItem(p.id, { indexNumber: e.target.value })
                  }
                  placeholder="Index no. (opsional)"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-cyan py-1 text-xs font-black disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(p.id, -1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-cyan py-1 text-xs font-black disabled:opacity-30"
                    disabled={i === photos.length - 1}
                    onClick={() => move(p.id, 1)}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="nb-border flex-1 bg-nb-pink py-1 text-xs font-black"
                    onClick={() => removeItem(p.id)}
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
