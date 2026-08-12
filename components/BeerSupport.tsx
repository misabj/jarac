'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildIpsQrPayload } from '@/lib/ipsQr';

// Podaci za uplatu
const ACCOUNT = '115038164075729509';
const RECIPIENT = 'Miloš Nikolić';
const CITY = 'Beograd';
const PURPOSE = 'Casti pivo - KSC Jarac';

// Grupiše broj računa radi lakšeg čitanja: 3-13-2
function formatAccount(acc: string): string {
  if (acc.length !== 18) return acc;
  return `${acc.slice(0, 3)}-${acc.slice(3, 16)}-${acc.slice(16)}`;
}

const PRESETS = [
  { amount: 250, label: 'Jedno pivo', emoji: '🍺' },
  { amount: 600, label: 'Tura', emoji: '🍺🍺🍺' },
  { amount: 1200, label: 'Cela ekipa', emoji: '🍻' },
];

type PublicDonation = {
  id: number;
  donor_name: string;
  amount: number;
  message: string | null;
  donated_at: string;
};

function fmtRsd(amount: number): string {
  return new Intl.NumberFormat('sr-RS').format(Math.round(amount)) + ' RSD';
}

function fmtDay(value: string): string {
  const d = new Date(value.replace(' ', 'T'));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function BeerSupportButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'pay' | 'ledger'>('pay');
  const [amount, setAmount] = useState<number>(250);
  const [custom, setCustom] = useState('');
  const [qr, setQr] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll dok je modal otvoren
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Zatvaranje na Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Generisanje QR koda kad se promeni iznos ili se modal otvori
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setQr('');
    const payload = buildIpsQrPayload({
      account: ACCOUNT,
      name: RECIPIENT,
      amount: amount > 0 ? amount : undefined,
      purpose: PURPOSE,
    });

    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 260,
          color: { dark: '#0b1120', light: '#ffffff' },
        })
      )
      .then((value) => {
        if (!cancelled) setQr(value);
      })
      .catch(() => {
        if (!cancelled) setQr('');
      });

    return () => {
      cancelled = true;
    };
  }, [open, amount]);

  const selectPreset = (value: number) => {
    setAmount(value);
    setCustom('');
  };

  // Učitavanje transparentne kase tek kad se otvori tab "Kasa"
  useEffect(() => {
    if (!open || tab !== 'ledger' || ledgerLoaded || ledgerLoading) return;
    setLedgerLoading(true);
    fetch('/api/beer')
      .then((r) => r.json())
      .then((data: { total: number; donations: PublicDonation[] }) => {
        setDonations(Array.isArray(data.donations) ? data.donations : []);
        setLedgerTotal(Number(data.total) || 0);
        setLedgerLoaded(true);
      })
      .catch(() => setLedgerLoaded(true))
      .finally(() => setLedgerLoading(false));
  }, [open, tab, ledgerLoaded, ledgerLoading]);

  const onCustomChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    setCustom(cleaned);
    setAmount(cleaned ? parseInt(cleaned, 10) : 0);
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard nedostupan */
    }
  };

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              aria-label="Zatvori"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-background/85 backdrop-blur-xl animate-fade-in"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Časti ekipu pivo"
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card/95 border border-border/60 shadow-2xl animate-fade-up"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍺</span>
                  <div>
                    <div className="font-display font-bold text-base leading-tight">Časti ekipu pivo</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted">KSC Jarac</div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Zatvori"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-text hover:bg-card-hover transition"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>

              {/* Tabovi */}
              <div className="flex gap-1 px-5 pt-4">
                <button
                  type="button"
                  onClick={() => setTab('pay')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === 'pay'
                      ? 'bg-gradient-primary text-background shadow-glow-primary'
                      : 'bg-card/60 text-muted hover:text-text hover:bg-card-hover'
                  }`}
                >
                  🍺 Časti
                </button>
                <button
                  type="button"
                  onClick={() => setTab('ledger')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === 'ledger'
                      ? 'bg-gradient-primary text-background shadow-glow-primary'
                      : 'bg-card/60 text-muted hover:text-text hover:bg-card-hover'
                  }`}
                >
                  📋 Kasa
                </button>
              </div>

              <div className="px-5 py-5">
                {tab === 'pay' && (
                  <div className="space-y-5">
                <p className="text-sm text-muted">
                  Skeniraj QR kôd mobilnom aplikacijom svoje banke (IPS QR) i časti ekipu turom posle
                  meča. Hvala! 🙌
                </p>

                {/* Izbor iznosa */}
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => {
                    const active = !custom && amount === p.amount;
                    return (
                      <button
                        key={p.amount}
                        type="button"
                        onClick={() => selectPreset(p.amount)}
                        className={`rounded-xl border px-2 py-3 text-center transition-all ${
                          active
                            ? 'bg-gradient-primary text-background border-transparent shadow-glow-primary'
                            : 'border-border/60 bg-card/60 hover:bg-card-hover text-text'
                        }`}
                      >
                        <div className="text-base leading-none">{p.emoji}</div>
                        <div className="mt-1.5 text-xs font-semibold">{p.label}</div>
                        <div className={`text-[11px] ${active ? 'opacity-90' : 'text-muted'}`}>
                          {p.amount} RSD
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom iznos */}
                <div>
                  <label htmlFor="beer-custom" className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    Ili unesi iznos
                  </label>
                  <div className="mt-1.5 relative">
                    <input
                      id="beer-custom"
                      type="text"
                      inputMode="numeric"
                      value={custom}
                      onChange={(e) => onCustomChange(e.target.value)}
                      placeholder="npr. 1000"
                      className="w-full rounded-xl border border-border/80 bg-card/60 px-4 py-2.5 pr-14 text-text placeholder:text-muted focus:outline-none focus:border-primary/60 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">RSD</span>
                  </div>
                </div>

                {/* QR kôd */}
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-card">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="IPS QR kôd za uplatu" width={230} height={230} className="h-[230px] w-[230px]" />
                    ) : (
                      <div className="grid h-[230px] w-[230px] place-items-center text-sm text-muted">
                        Generisanje…
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted text-center">
                    {amount > 0 ? (
                      <>
                        Iznos: <span className="text-text font-semibold">{amount} RSD</span>
                      </>
                    ) : (
                      'Iznos unosiš u aplikaciji banke'
                    )}
                  </div>
                </div>

                {/* Podaci računa */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Broj računa</div>
                      <div className="font-mono text-text">{formatAccount(ACCOUNT)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={copyAccount}
                      className="shrink-0 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-card-hover hover:border-primary/40 transition"
                    >
                      {copied ? 'Kopirano ✓' : 'Kopiraj'}
                    </button>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Primalac</div>
                    <div className="text-text">
                      {RECIPIENT}, {CITY}
                    </div>
                  </div>
                </div>
                  </div>
                )}

                {tab === 'ledger' && (
                  <div className="space-y-4">
                    {/* Zbir kase */}
                    <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 text-center">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Ukupno u kasi</div>
                      <div className="mt-1 font-display text-3xl font-black text-primary">
                        {fmtRsd(ledgerTotal)}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {donations.length} {donations.length === 1 ? 'uplata' : 'uplata'} • hvala svima! 🙌
                      </div>
                    </div>

                    {/* Lista uplata */}
                    {ledgerLoading && !ledgerLoaded ? (
                      <div className="py-8 text-center text-sm text-muted">Učitavanje…</div>
                    ) : donations.length === 0 ? (
                      <div className="rounded-xl border border-border/60 bg-background/40 py-8 text-center text-sm text-muted">
                        Još niko nije častio — budi prvi! 🍺
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/40">
                        {donations.map((d) => (
                          <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-text">{d.donor_name}</div>
                              <div className="truncate text-xs text-muted">
                                {fmtDay(d.donated_at)}
                                {d.message ? ` • ${d.message}` : ''}
                              </div>
                            </div>
                            <div className="shrink-0 font-mono text-sm text-primary">{fmtRsd(d.amount)}</div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-center text-[11px] text-muted">
                      Uplate ručno unosi ekipa nakon što stignu na račun — potpuno transparentno.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Časti ekipu pivo"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/80 bg-card/60 px-2.5 sm:px-4 text-sm font-medium text-text hover:bg-card-hover hover:border-primary/40 transition"
      >
        <span className="text-base leading-none">🍺</span>
        <span className="hidden sm:inline">Časti ekipu pivo</span>
      </button>
      {modal}
    </>
  );
}
