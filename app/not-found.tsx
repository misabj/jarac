import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="card p-8">
        <div className="font-display text-5xl font-black text-primary">404</div>
        <h1 className="mt-3 font-display text-2xl font-bold">Stranica nije pronađena</h1>
        <p className="mt-2 text-sm text-muted">
          Traženi sadržaj ne postoji ili je premešten.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            Početna
          </Link>
          <Link href="/matches" className="btn-ghost">
            Utakmice
          </Link>
        </div>
      </div>
    </div>
  );
}
