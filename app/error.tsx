'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logovanje na server konzolu / monitoring (ostaje u browser konzoli).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="card p-8">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/15 text-danger text-2xl">
          !
        </div>
        <h1 className="font-display text-2xl font-bold">Nešto je pošlo naopako</h1>
        <p className="mt-2 text-sm text-muted">
          Došlo je do greške pri učitavanju. Pokušaj ponovo — ako se nastavi, osveži stranicu.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary">
            Pokušaj ponovo
          </button>
          <Link href="/" className="btn-ghost">
            Početna
          </Link>
        </div>
      </div>
    </div>
  );
}
