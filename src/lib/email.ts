import nodemailer from "nodemailer";

/**
 * Outbound mail for admin-composed campaigns.
 *
 * Separate from Supabase Auth's mailer, which only ever sends its own fixed
 * transactional templates (confirm, reset, invite) and has no way to send an
 * arbitrary message. Same SMTP account either way, so anything that hurts
 * reputation here also hurts sign-in mail — see the throttle below.
 */
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_NAME = process.env.SMTP_FROM_NAME ?? "ScorlynTap";
/**
 * The visible sender. Deliberately not SMTP_USER: with Resend the SMTP
 * username is the literal string "resend", so building the From header out of
 * it would produce `ScorlynTap <resend>` and every message would bounce.
 */
const FROM_EMAIL = process.env.SMTP_FROM ?? "noreply@scorlyn.com";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tap.scorlyn.com";

export function mailerConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}

function transport() {
  if (!mailerConfigured()) {
    throw new Error(
      "Email is not configured. Set SMTP_USER and SMTP_PASS in the environment."
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    // 587 is STARTTLS, 465 is implicit TLS. Getting this pair wrong is what
    // makes the connection fail with an unhelpful timeout.
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Wraps body text in the same shell as the auth emails.
 *
 * The shape matters as much as the origin: filters score a bare heading over a
 * naked link as phishing, so every message names the sender, shows its link as
 * readable text, and says why it arrived.
 */
export function renderCampaign(bodyText: string, ctaUrl?: string): string {
  const paragraphs = bodyText
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.6;margin:0 0 18px">${escapeHtml(p).replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");

  const cta = ctaUrl
    ? `<p style="margin:4px 0 22px">
<a href="${ctaUrl}" style="display:inline-block;background:#0A0A0A;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px">Open ScorlynTap</a></p>
<p style="font-size:13px;line-height:1.6;color:#555555;margin:0 0 8px">If the button does not work, copy this address into your browser:</p>
<p style="font-size:13px;line-height:1.6;color:#555555;word-break:break-all;margin:0 0 4px">${ctaUrl}</p>`
    : "";

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
<p style="font-size:17px;font-weight:700;letter-spacing:-0.01em;margin:0 0 28px">ScorlynTap</p>
${paragraphs}${cta}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:30px 0 18px">
<p style="font-size:12px;line-height:1.6;color:#777777;margin:0 0 6px">You are receiving this because you have a ScorlynTap account at tap.scorlyn.com.</p>
<p style="font-size:12px;line-height:1.6;color:#777777;margin:0">ScorlynTap &mdash; NFC digital business cards. tap.scorlyn.com</p>
</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type Recipient = { email: string; refCode?: string | null };

/**
 * Sends one message per recipient, sequentially.
 *
 * One at a time with a gap, rather than a single mail with everyone in the To
 * line: recipients must never see each other's addresses, and a burst of
 * simultaneous connections is exactly the pattern that gets an SMTP account
 * rate-limited or suspended.
 */
export async function sendCampaign(
  recipients: Recipient[],
  subject: string,
  bodyText: string
): Promise<{ sent: number; failed: { email: string; error: string }[] }> {
  const tx = transport();
  const failed: { email: string; error: string }[] = [];
  let sent = 0;

  for (const person of recipients) {
    // {{link}} becomes that person's own referral URL, so the same body can be
    // written once and still carry per-recipient attribution.
    const link = person.refCode
      ? `${SITE_URL}/signup?ref=${encodeURIComponent(person.refCode)}&next=%2Fdashboard%2Forders`
      : `${SITE_URL}/dashboard`;
    const text = bodyText.replaceAll("{{link}}", link);

    try {
      await tx.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: person.email,
        subject,
        text: `${text}\n\n--\nScorlynTap — NFC digital business cards\ntap.scorlyn.com`,
        html: renderCampaign(text, link),
        headers: {
          // Required by Gmail and Outlook for anything promotional; without it
          // the only way to stop the mail is to report it as spam.
          "List-Unsubscribe": `<mailto:${FROM_EMAIL}?subject=unsubscribe>`,
        },
      });
      sent += 1;
    } catch (e) {
      failed.push({ email: person.email, error: e instanceof Error ? e.message : String(e) });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  tx.close();
  return { sent, failed };
}
