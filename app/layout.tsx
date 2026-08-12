import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { MobileNavToggle } from '@/components/MobileNav';
import { BeerSupportButton } from '@/components/BeerSupport';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Jarac',
  description: 'Statistika, golovi, asistencije i MVP trka, KSC Jarac.',
  applicationName: 'Jarac',
  formatDetection: { telephone: false },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1120',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70 supports-[backdrop-filter]:bg-background/60">
      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <span className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-gradient-primary text-background font-black text-base sm:text-lg shadow-glow-primary group-hover:scale-110 transition-transform duration-300 shrink-0 overflow-hidden">
            <span className="absolute inset-0 rounded-xl opacity-50 group-hover:opacity-80 transition" />
            <img
              src="/images/jarac_logo.webp"
              alt="Jarac"
              width={40}
              height={40}
              className="relative h-full w-full object-contain"
            />
          </span>
          <div className="leading-tight min-w-0">
            <div className="font-display font-bold tracking-tight text-[14px] sm:text-[15px] truncate">Jarac</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-muted truncate">KSC Jarac </div>
          </div>
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-1 text-sm font-medium">
          <NavLink href="/standings">Tabela</NavLink>
          <NavLink href="/players">Igrači</NavLink>
          <NavLink href="/matches">Utakmice</NavLink>
          <NavLink href="/gallery">Galerija</NavLink>
          <NavLink href="/admin" className="text-muted">Admin</NavLink>
        </nav>
        <span className="absolute left-1/2 -translate-x-1/2 md:static md:ml-1 md:translate-x-0">
          <BeerSupportButton />
        </span>
        <MobileNavToggle />
      </div>
    </header>
  );
}

function NavLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-lg hover:bg-card-hover/80 hover:text-text transition-colors duration-200
        after:absolute after:left-3 after:right-3 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent
        after:scale-x-0 after:origin-center after:transition-transform after:duration-300 hover:after:scale-x-100 ${className}`}
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} • KSC Jarac
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased selection:bg-primary/30 selection:text-text">
        {/* Ambient gradient backdrop */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-primary/[0.08] blur-[120px]" />
          <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-secondary/[0.07] blur-[120px]" />
          <div className="absolute bottom-0 -left-40 h-[360px] w-[360px] rounded-full bg-warning/[0.05] blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
        </div>

        <Nav />
        <main className="flex-1 animate-page-in">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
