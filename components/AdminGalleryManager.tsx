'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadGalleryImageAction, deleteGalleryImageAction } from '@/app/admin/actions';
import type { GalleryImage } from '@/lib/types';

export function AdminGalleryManager({ images }: { images: GalleryImage[] }) {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    setSelected(files);
  }

  function handleSubmit(formData: FormData) {
    start(async () => {
      await uploadGalleryImageAction(formData);
      setSelected([]);
      formRef.current?.reset();
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  return (
    <div className="space-y-8">
      {/* Upload forma */}
      <form ref={formRef} action={handleSubmit} className="card p-5 space-y-4">
        <div>
          <label className="stat-label">Naslov (opciono, važi za sve izabrane slike)</label>
          <input name="title" className="input mt-1" placeholder="npr. Utakmica 12.03." />
        </div>

        <div>
          <label className="stat-label">Slike</label>
          <input
            ref={fileRef}
            type="file"
            name="images"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={handleFiles}
            className="hidden"
            id="gallery_files_input"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost px-3 py-2 text-xs"
            >
              Izaberi slike…
            </button>
            <span className="text-xs text-muted">
              {selected.length > 0 ? `${selected.length} izabrano` : 'JPG, PNG, WEBP, GIF — do 8 MB po slici'}
            </span>
          </div>

          {selected.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {selected.map((file, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary" disabled={pending || selected.length === 0}>
          {pending ? 'Otpremam…' : 'Dodaj u galeriju'}
        </button>
      </form>

      {/* Postojeće slike */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Slike u galeriji</h2>
          <span className="text-xs text-muted">{images.length} slika</span>
        </div>

        {images.length === 0 ? (
          <div className="card p-8 text-center text-muted">Galerija je prazna.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="card overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-card-hover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title ?? 'Slika galerije'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs text-muted">{img.title ?? '—'}</span>
                  <form action={deleteGalleryImageAction}>
                    <input type="hidden" name="id" value={img.id} />
                    <button className="text-xs text-danger hover:underline">Obriši</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
