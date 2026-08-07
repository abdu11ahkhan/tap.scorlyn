/**
 * Pull bank details out of a block of pasted text.
 *
 * People copy the whole thing out of a banking app or a WhatsApp message —
 * "Meezan Bank / Ayesha Siddiqui / 02340112924467 / PK34MEZN..." — and then
 * retype it field by field. Retyping an account number is precisely how money
 * reaches the wrong person, so it's better to read it once and split it.
 *
 * Deliberately conservative: anything it isn't sure about is left alone rather
 * than guessed at, because a confidently wrong account number is worse than an
 * empty field.
 */
export type ParsedBank = {
  label?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
};

/** PK IBANs are PK + 2 check digits + 4 bank letters + 16 alphanumerics. */
const IBAN = /\b([A-Z]{2}\d{2}[A-Z0-9]{11,26})\b/;

/** A bare account number: 8-20 digits, allowing the dashes people type. */
const ACCOUNT = /\b(\d[\d-]{6,24}\d)\b/;

// Order matters: "Account Title" has to be tried before "Account", or the
// number matcher eats the name. The number and IBAN patterns also require what
// follows to actually look like one, so a label alone can't capture prose.
const LABELLED = [
  { key: "iban", re: /\biban\b\s*[:\-]?\s*([A-Z0-9 ]{15,40})/i },
  { key: "accountName", re: /\b(?:account\s*title|a\/c\s*title|title|holder|name)\b\s*[:\-]?\s*([^\d,;|]{2,60})/i },
  { key: "accountNumber", re: /\b(?:account\s*(?:no|number|#)|a\/c|acct|account)\b\s*[:\-]?\s*([\d][\d\- ]{5,24})/i },
  { key: "label", re: /\b(?:bank|branch)\s*(?:name)?\s*[:\-]\s*([^\d,;|]{2,40})/i },
] as const;

export function parseBankPaste(raw: string): ParsedBank {
  const text = raw.replace(/ /g, " ").trim();
  if (!text) return {};

  const out: ParsedBank = {};
  // Newlines, but also the separators people use when they paste it as one
  // line: "Meezan Bank, Ayesha Siddiqui, 0234..." is just as common as four rows.
  const lines = text
    .split(/[\n\r|]+|,(?=\s)/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Labelled lines first — if someone wrote "IBAN: ..." they mean it, and that
  // beats any pattern match.
  for (const line of lines) {
    for (const { key, re } of LABELLED) {
      const m = line.match(re);
      if (m && !out[key]) {
        const value = m[1].trim();
        if (value) out[key] = value;
      }
    }
  }

  const flat = text.replace(/\s+/g, " ");

  if (!out.iban) {
    const m = flat.toUpperCase().match(IBAN);
    // A bare 11-digit run isn't an IBAN; require the country-code shape.
    if (m && /^[A-Z]{2}\d{2}/.test(m[1]) && m[1].length >= 15) out.iban = m[1];
  }

  if (!out.accountNumber) {
    // Don't re-capture the digits inside an IBAN we already took.
    const withoutIban = out.iban ? flat.replace(new RegExp(out.iban, "i"), " ") : flat;
    const m = withoutIban.match(ACCOUNT);
    if (m) out.accountNumber = m[1];
  }

  if (!out.label) {
    // A line mentioning a bank, with no digits in it, is the bank's name.
    const named = lines.find(
      (l) => /bank|easypaisa|jazzcash|sadapay|nayapay/i.test(l) && !/\d{6}/.test(l)
    );
    if (named) out.label = named.replace(/[:\-]\s*$/, "").trim();
  }

  // Nothing below here is worth guessing unless we actually found an account.
  if (!out.accountNumber && !out.iban) return {};

  if (!out.accountName) {
    // A line that is words only, isn't the bank name, and reads like a person.
    const words = lines.find(
      (l) =>
        !/\d/.test(l) &&
        l !== out.label &&
        !/bank|easypaisa|jazzcash|sadapay|nayapay/i.test(l) &&
        l.split(/\s+/).length >= 2 &&
        l.length <= 60
    );
    if (words) out.accountName = words;
  }

  // Tidy: strip punctuation and stray spaces the copy picked up.
  for (const k of Object.keys(out) as (keyof ParsedBank)[]) {
    out[k] = out[k]?.replace(/[.,;:\-]+$/, "").trim() || undefined;
  }
  if (out.iban) out.iban = out.iban.replace(/\s+/g, "").toUpperCase();
  if (out.accountNumber) out.accountNumber = out.accountNumber.trim();

  return out;
}

/** True when there's enough to be worth filling in. */
export function hasBankData(p: ParsedBank): boolean {
  return Boolean(p.accountNumber || p.iban);
}
