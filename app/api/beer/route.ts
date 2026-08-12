import { NextResponse } from 'next/server';
import { getPublicBeerDonations, getBeerDonationsSummary } from '@/lib/queries';

export const dynamic = 'force-dynamic';

// Javni, read-only endpoint za "Kasu za pivo" — koristi ga popup na sajtu.
export async function GET() {
  try {
    const [donations, summary] = await Promise.all([
      getPublicBeerDonations(100),
      getBeerDonationsSummary(),
    ]);

    return NextResponse.json({
      total: summary.total,
      count: summary.count,
      donations: donations.map((d) => ({
        id: d.id,
        donor_name: d.donor_name,
        amount: Number(d.amount),
        message: d.message,
        donated_at: d.donated_at,
      })),
    });
  } catch {
    return NextResponse.json({ total: 0, count: 0, donations: [] }, { status: 200 });
  }
}
