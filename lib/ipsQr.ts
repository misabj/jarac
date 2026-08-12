// Generator za NBS IPS QR kôd (nacionalni standard za instant plaćanja u Srbiji).
// Rezultujući string se enkodira u QR kôd koji korisnik skenira mobilnom bankom.
// Specifikacija: NBS IPS QR (polja odvojena znakom "|").

export type IpsQrData = {
  /** Broj računa primaoca (18 cifara, bez crtica i razmaka). */
  account: string;
  /** Naziv primaoca (do 70 karaktera). */
  name: string;
  /** Iznos u dinarima. Ako je 0 ili undefined, platilac sam unosi iznos. */
  amount?: number;
  /** Šifra plaćanja (3 cifre). Podrazumevano 289 (ostalo/građani). */
  paymentCode?: string;
  /** Svrha plaćanja. */
  purpose?: string;
};

/** Formatira iznos u NBS zapis: "RSD" + iznos sa zarezom kao decimalnim znakom. */
function formatAmount(amount: number): string {
  const value = amount.toFixed(2).replace('.', ',');
  return `RSD${value}`;
}

/** Sklapa NBS IPS QR payload string spreman za enkodiranje u QR kôd. */
export function buildIpsQrPayload(data: IpsQrData): string {
  const account = data.account.replace(/\D/g, '');
  const parts = ['K:PR', 'V:01', 'C:1', `R:${account}`, `N:${data.name}`];

  if (data.amount && data.amount > 0) {
    parts.push(`I:${formatAmount(data.amount)}`);
  }

  parts.push(`SF:${data.paymentCode ?? '289'}`);

  if (data.purpose) {
    parts.push(`S:${data.purpose}`);
  }

  return parts.join('|');
}
