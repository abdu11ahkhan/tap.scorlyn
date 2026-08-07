/**
 * Ready-made messages, so sending one doesn't start from a blank box.
 *
 * `{{link}}` is replaced per recipient with that person's own referral URL —
 * write the body once, everyone gets a link that credits them.
 */
export type EmailPreset = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: "referral",
    name: "Referral offer",
    subject: "Your ScorlynTap referral link",
    body: `Your ScorlynTap card is live. Anyone who orders an NFC card through your link is credited to you.

Blank NFC card with your link — Rs.1,600
Your own design on the card — Rs.2,200
The web card itself stays free.

Order or share your link here:
{{link}}`,
  },
  {
    id: "launch",
    name: "New templates announcement",
    subject: "New card designs on ScorlynTap",
    body: `We've added new designs to ScorlynTap — including a lot more portfolio layouts for people who want their work on the card, not just their links.

Open your card, pick a template, and it updates instantly. Nothing to reprint: the NFC card points at the same link either way.

{{link}}`,
  },
  {
    id: "finish-card",
    name: "Nudge: card not finished",
    subject: "Your ScorlynTap card is almost ready",
    body: `You started a ScorlynTap card but haven't finished setting it up.

It takes about two minutes — add your name, a photo, and the links you want people to reach you on. The web card is free and stays free.

{{link}}`,
  },
  {
    id: "order-nfc",
    name: "Order a physical card",
    subject: "Put your card on an NFC tag",
    body: `Your ScorlynTap page works on its own, but the physical card is what makes people remember it — you tap it on a phone and your page opens, no app needed.

Blank card with your link — Rs.1,600
Your own design printed on it — Rs.2,200

Delivered across Pakistan. Order here:
{{link}}`,
  },
];
