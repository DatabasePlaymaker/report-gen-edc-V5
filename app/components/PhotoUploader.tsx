"use client";

import { useRef, useState } from "react";
import type { PhotoItem } from "@/lib/types";
import { resizeMany } from "@/lib/imageResize";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

let idCounter = 0;
const nextId = () => `p_${Date.now()}_${idCounter++}`;

// ---- Kartu foto tunggal (sortable) ----
function PhotoCard({
  photo,
  defaultCaption,
  onUpdate,
  onRemove,
}: {
  photo: PhotoItem;
  defaultCaption: string;
  onUpdate: (patch: Partial<PhotoItem>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="nb-border bg-white shadow-nb-sm"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.dataUrl}
          alt={photo.caption}
          className="h-32 w-full border-b-[3px] border-nb-ink object-cover"
        />
        {/* Handle drag: HANYA elemen ini yang memicu drag, supaya input tetap bisa diedit */}
        <button
          type="button"
          className="absolute left-1 top-1 cursor-grab nb-border bg-nb-yellow px-2 py-0.5 text-sm font-black leading-none shadow-nb-sm active:cursor-grabbing"
          title="Tahan & seret untuk memindahkan"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <input
          className="nb-border bg-white px-2 py-1 text-xs font-bold outline-none"
          value={photo.caption}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          /* Kosong = ikut caption default. Placeholder menunjukkan nilai yang akan dipakai. */
          placeholder={defaultCaption || "Caption"}
        />
        <input
          className="nb-border bg-white px-2 py-1 text-[10px] font-semibold outline-none"
          value={photo.indexNumber || ""}
          onChange={(e) => onUpdate({ indexNumber: e.target.value })}
          placeholder="Index no. (opsional)"
        />
        <button
          type="button"
          className="nb-border bg-nb-pink py-1 text-xs font-black"
          onClick={onRemove}
        >
          ✕ Hapus
        </button>
      </div>
    </div>
  );
}

export function PhotoUploader({
  photos,
  onChange,
  defaultCaption,
  onDefaultCaptionChange,
}: {
  photos: PhotoItem[];
  onChange: (p: PhotoItem[]) => void;
  defaultCaption: string;
  onDefaultCaptionChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(photos, oldIndex, newIndex));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const arr = Array.from(files);
    try {
      const dataUrls = await resizeMany(arr, (done, total) =>
        setProgress({ done, total })
      );
      // Caption sengaja dikosongkan; PDF akan memakai caption default sebagai fallback.
      const newItems: PhotoItem[] = dataUrls.map((dataUrl) => ({
        id: nextId(),
        dataUrl,
        caption: "",
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
            value={defaultCaption}
            onChange={(e) => onDefaultCaptionChange(e.target.value)}
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

      {photos.length > 0 && (
        <p className="mb-3 text-xs font-bold text-gray-500">
          Kolom caption kosong akan memakai caption default. Seret ikon ⠿ untuk mengubah urutan.
        </p>
      )}

      {photos.length === 0 ? (
        <div className="nb-border border-dashed bg-white/50 p-10 text-center font-bold text-gray-500">
          Belum ada foto. Klik “Tambah Foto”.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => (
                <PhotoCard
                  key={p.id}
                  photo={p}
                  defaultCaption={defaultCaption}
                  onUpdate={(patch) => updateItem(p.id, patch)}
                  onRemove={() => removeItem(p.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}