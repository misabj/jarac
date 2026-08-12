'use client';

import { useRef, useState, useTransition } from 'react';
import { createBeerDonationAction, deleteBeerDonationAction } from '@/app/admin/actions';
import { fmtDate } from '@/lib/format';
import type { BeerDonation } from '@/lib/types';

function fmtRsd(amount: number): string {
  return new Intl.NumberFormat('sr-RS').format(amount) + ' RSD';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminBeerManager({ donations }: { donations: BeerDonation[] }) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  function handleSubmit(formData: FormData) {
    start(async () => {
      await createBeerDonationAction(formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-8">
      {/* Unos nove uplate */}
      <form ref={formRef} action={handleSubmit} className="card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="stat-label">Ko je častio</label>
            <input name="donor_name" className="input mt-1" placeholder="npr. Pera Perić" required />
          </div>
          <div>
            <label className="stat-label">Iznos (RSD)</label>
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="input mt-1"
              placeholder="npr. 1000"
              required
            />
          </div>
          <div>
            <label className="stat-label">Datum uplate</label>
            <input name="donated_at" type="date" className="input mt-1" defaultValue={today()} required />
          </div>
          <div>
            <label className="stat-label">Poruka (opciono)</label>
            <input name="message" className="input mt-1" placeholder="npr. Za pobedu! 🍺" maxLength={255} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="is_public" defaultChecked className="h-4 w-4 accent-primary" />
          Prikaži javno na sajtu (u „Kasi za pivo")
        </label>

        <button className="btn-primary" disabled={pending}>
          {pending ? 'Čuvam…' : 'Dodaj uplatu'}
        </button>
      </form>

      {/* Lista uplata */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Uplate</h2>
          <span className="text-sm text-muted">
            {donations.length} uplata • ukupno <span className="font-semibold text-primary">{fmtRsd(total)}</span>
          </span>
        </div>

        {donations.length === 0 ? (
          <div className="card p-8 text-center text-muted">Još nema unetih uplata.</div>
        ) : (
          <div className="card divide-y divide-border/60">
            {donations.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{d.donor_name}</span>
                    {d.is_public ? null : (
                      <span className="rounded bg-card-hover px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        skriveno
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {fmtDate(d.donated_at)}
                    {d.message ? ` • ${d.message}` : ''}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm text-primary">{fmtRsd(Number(d.amount))}</div>
                <form action={deleteBeerDonationAction} className="shrink-0">
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-xs text-danger hover:underline">Obriši</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
