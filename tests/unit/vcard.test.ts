import test from "node:test";
import assert from "node:assert/strict";
import { buildVCard } from "../../src/lib/vcard";
import { groupNumberButtons, resolveButtons, type CardButton } from "../../src/lib/card";

// Fictional numbers in the reserved 0000000 pattern.
const buttons: CardButton[] = [
  { kind: "phone", label: "Pakistani", value: "+92 300 0000001" },
  { kind: "phone", label: "Spanish", value: "+34 600 000 002" },
  { kind: "whatsapp", label: "Pakistan", value: "+92 300 0000001" },
  // Same digits as the Spanish phone: saved once, not twice.
  { kind: "whatsapp", label: "Spain", value: "+34 600 000 002" },
  // WhatsApp-only: the case that used to be dropped from the vCard entirely.
  { kind: "whatsapp", label: "UAE", value: "+971 50 000 0003" },
  { kind: "email", label: "Email", value: "test@example.com" },
  { kind: "email", label: "Sales", value: "sales@example.com" },
  { kind: "instagram", label: "Instagram", value: "https://instagram.com/example" },
];
const card = {
  username: "testperson",
  full_name: "Test Person",
  headline: "Tester",
  company: "Example Co",
  // Mirrors of the first phone / WhatsApp / email, as the editor saves them.
  phone: "+92 300 0000001",
  whatsapp: "+92 300 0000001",
  email: "test@example.com",
  buttons,
};

/** The vCard with folded lines joined back up, so long values match whole. */
const vcard = () => buildVCard(card, "https://example.test").replace(/\r\n /g, "");

test("every phone number is exported", () => {
  const v = vcard();
  assert.match(v, /TEL;TYPE=CELL:\+92 300 0000001/);
  assert.match(v, /TEL:\+34 600 000 002/);
});

test("every WhatsApp number is exported, not only the first", () => {
  const v = vcard();
  assert.match(v, /item0\.TEL;TYPE=CELL,VOICE:\+923000000001/);
  // A WhatsApp-only number reaches the contact, labelled.
  assert.match(v, /TEL;TYPE=CELL,VOICE:\+971500000003/);
  assert.match(v, /X-ABLabel:WhatsApp UAE/);
  // A WhatsApp number that is also a phone number is kept once (as the phone).
  assert.doesNotMatch(v, /TEL;TYPE=CELL,VOICE:\+34600000002/);
});

test("emails, the card link and core fields are exported", () => {
  const v = vcard();
  assert.match(v, /EMAIL;TYPE=INTERNET:test@example\.com/);
  assert.match(v, /EMAIL:sales@example\.com/);
  assert.match(v, /URL:https:\/\/example\.test\/u\/testperson/);
  assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0/);
  assert.match(v, /FN:Test Person/);
  assert.match(v, /ORG:Example Co/);
  assert.match(v, /END:VCARD$/);
});

test("no number appears more than its call + WhatsApp pair", () => {
  const tels = vcard()
    .split("\r\n")
    .filter((l) => /TEL/.test(l))
    .map((l) => (l.split(":").pop() ?? "").replace(/\D/g, ""));
  const counts: Record<string, number> = {};
  for (const d of tels) counts[d] = (counts[d] ?? 0) + 1;
  for (const n of Object.values(counts)) assert.ok(n <= 2, `a number appears ${n} times`);
});

test("display grouping never changes what is saved", () => {
  const before = JSON.stringify(buttons);
  const grouped = groupNumberButtons(resolveButtons(buttons));
  assert.equal(JSON.stringify(buttons), before, "stored buttons untouched");
  // One Call and one WhatsApp button on screen...
  assert.equal(grouped.filter((b) => b.kind === "phone").length, 1);
  assert.equal(grouped.filter((b) => b.kind === "whatsapp").length, 1);
  // ...but the vCard still carries every distinct number.
  const v = vcard();
  assert.match(v, /\+92 300 0000001/);
  assert.match(v, /\+34 600 000 002/);
  assert.match(v, /\+971500000003/);
});

test("local-format numbers (leading 0) are exported and normalised for WhatsApp", () => {
  const v = buildVCard(
    {
      username: "localtest",
      full_name: "Local Test",
      phone: "0300 0000004",
      whatsapp: "0300 0000004",
      buttons: [
        { kind: "phone", label: "Office", value: "0300 0000004" },
        { kind: "whatsapp", label: "Personal", value: "0300 0000004" },
        // WhatsApp-only, local format: must become +92..., not be dropped.
        { kind: "whatsapp", label: "Shop", value: "0300 0000005" },
      ],
    },
    "https://example.test"
  ).replace(/\r\n /g, "");
  assert.match(v, /TEL;TYPE=CELL:0300 0000004/);
  assert.match(v, /item0\.TEL;TYPE=CELL,VOICE:\+923000000004/);
  assert.match(v, /TEL;TYPE=CELL,VOICE:\+923000000005/);
  assert.match(v, /X-ABLabel:WhatsApp Shop/);
  // The same local number as phone + WhatsApp is not exported a third time.
  assert.equal((v.match(/0000004/g) ?? []).length, 2);
});

test("a single-WhatsApp card's numbers are exactly as before the change", () => {
  const v = buildVCard(
    {
      username: "single",
      full_name: "Single Test",
      phone: "+92 300 0000006",
      whatsapp: "+92 300 0000006",
      buttons: [
        { kind: "phone", label: "Call", value: "+92 300 0000006" },
        { kind: "whatsapp", label: "WhatsApp", value: "+92 300 0000006" },
      ],
    },
    "https://example.test"
  );
  const tels = v.split("\r\n").filter((l) => /TEL|X-ABLabel:WhatsApp/.test(l));
  assert.deepEqual(tels, ["TEL;TYPE=CELL:+92 300 0000006", "item0.TEL;TYPE=CELL,VOICE:+923000000006", "item0.X-ABLabel:WhatsApp"]);
});
