"use client";

/**
 * Admin's own window into the card-scan pipeline — the same two engines
 * /templates/scan tries for a new signup (Claude Haiku first, tesseract.js
 * as the fallback), but with the working shown for BOTH rather than hidden
 * behind a clean review screen. Seeing only tesseract's raw output here
 * would be misleading — Claude is what a real user actually gets whenever
 * it's available, so that's what's shown by default.
 *
 * Three things this is for, matching what was asked:
 *   - upload: confirm the pipeline still behaves on a real card before
 *     pointing a customer at it, or build a card for someone from their photo
 *     the same way the public flow would.
 *   - test: see exactly what each engine read, side by side — Claude's
 *     verbatim per-line transcription and classified fields, and tesseract's
 *     line-by-line confidence/height, so a bad result can be traced to the
 *     engine that actually produced it.
 *   - compare: when Claude gets something wrong, tesseract's raw lines are
 *     right there to check whether the text was even legible at all.
 *
 * No account, draft or publish happens here unless "open in editor" (an
 * anonymous draft, same as the public flow) or "create their account" (a
 * real login, made on the spot — see createCustomer in ../actions.ts) is
 * pressed — everything above that is read-only inspection.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Copy, ExternalLink, Loader2, UserPlus, X } from "lucide-react";
import { KIND_LABELS, resolveButtonsForPreview, resolveGallery, type CardButton } from "@/lib/card";
import { EMPTY_CARD_FORM, draftToCardProfile, saveDraft, type CardForm } from "@/lib/card-draft";
import { downscale, toDataUrl } from "@/components/card-editor/ImagePicker";
import { extractPalette, suggestTemplate, type CardVibe } from "@/lib/card-scan-color";
import { scanCardText, type ScanFields, type ScanLine } from "@/lib/card-ocr";
import { scanCardWithClaude, cropLogo, type ClaudeScanFields } from "@/lib/card-scan-ai";
import { renderCardTemplate } from "@/components/card-templates";
import DevicePreview from "@/components/card-editor/DevicePreview";
import { EntryListField, EMPTY_ENTRY, type Entry } from "@/components/card-editor/ScanEntryList";
import { createCustomer } from "../actions";

function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** A starting suggestion for the account's handle, not a final answer — the
 *  admin can always edit it before creating the account. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 30);
}

export default function AdminScanTest() {
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const [fields, setFields] = useState<ScanFields | null>(null);
  const [vibe, setVibe] = useState<CardVibe | null>(null);
  const [template, setTemplate] = useState("minimal");

  const [claudeFields, setClaudeFields] = useState<ClaudeScanFields | null>(null);
  const [claudeMs, setClaudeMs] = useState<number | null>(null);
  const [claudeLogoUrl, setClaudeLogoUrl] = useState("");
  // Off by default — a detected logo is a suggestion, not something to put
  // on the card without confirming it first. manualLogoUrl (a file the
  // admin picks themselves) always wins over the detected one.
  const [useLogo, setUseLogo] = useState(false);
  const [manualLogoUrl, setManualLogoUrl] = useState("");
  const [tesseractMs, setTesseractMs] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phones, setPhones] = useState<Entry[]>(EMPTY_ENTRY);
  const [emails, setEmails] = useState<Entry[]>(EMPTY_ENTRY);
  const [website, setWebsite] = useState("");

  // "Open in editor" hands off an anonymous draft — good for previewing.
  // This is the other option: build a real, already-confirmed login right
  // now, for a customer standing in front of the admin, same as
  // admin/users/new does — just pre-filled from the scan instead of typed.
  const [accountEmail, setAccountEmail] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPublish, setAccountPublish] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
    username: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const pickFile = (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setFrontFile(file);
      setFrontPreview(url);
    } else {
      setBackFile(file);
      setBackPreview(url);
    }
  };

  const run = async () => {
    if (!frontFile) return;
    setBusy(true);
    setError(null);
    setFields(null);
    setVibe(null);
    setClaudeFields(null);
    setClaudeMs(null);
    setClaudeLogoUrl("");
    setUseLogo(false);
    setManualLogoUrl("");
    setTesseractMs(null);
    const started = performance.now();

    try {
      const frontBlob = await downscale(frontFile, "scan");
      const backBlob = backFile ? await downscale(backFile, "scan") : null;

      const frontBitmap = await createImageBitmap(frontBlob);
      const canvasVibe = extractPalette(frontBitmap);
      frontBitmap.close?.();

      // Run both engines — this is a diagnostic page, not the signup flow,
      // so unlike /templates/scan (which tries Claude, then only falls back
      // to tesseract if it fails) both results are wanted every time, to
      // compare them against each other.
      const frontUrl = await toDataUrl(frontBlob);
      const backUrl = backBlob ? await toDataUrl(backBlob) : null;
      const claudeStarted = performance.now();
      const claude = await scanCardWithClaude(backUrl ? [frontUrl, backUrl] : [frontUrl]);
      setClaudeMs(Math.round(performance.now() - claudeStarted));
      setClaudeFields(claude);

      const tessStarted = performance.now();
      const images = backBlob ? [frontBlob, backBlob] : [frontBlob];
      const extracted = await scanCardText(images);
      setTesseractMs(Math.round(performance.now() - tessStarted));
      setFields(extracted);

      // Default the editable fields to whichever engine a real user would
      // actually get: Claude when it's available, tesseract otherwise —
      // matching /templates/scan exactly, so this preview is honest.
      const derivedVibe: CardVibe =
        claude?.accent_color && claude.surface_color
          ? { accent: claude.accent_color, surface: claude.surface_color, dark: claude.dark, vivid: claude.vivid }
          : canvasVibe;
      setVibe(derivedVibe);
      setTemplate(suggestTemplate(derivedVibe));

      if (claude?.logo_box) {
        try {
          setClaudeLogoUrl(await cropLogo(frontBlob, claude.logo_box));
        } catch {
          // Non-fatal — the diagnostic view just won't show a crop preview.
        }
      }

      if (claude) {
        setName(claude.full_name);
        setHeadline(claude.headline);
        setCompany(claude.company);
        setTagline(claude.tagline);
        setAddress(claude.address);
        setPhones(
          claude.phones.length
            ? claude.phones.map((p) => ({ label: p.label, value: p.value, use: true }))
            : EMPTY_ENTRY
        );
        setEmails(
          claude.emails.length
            ? claude.emails.map((e) => ({ label: e.label, value: e.value, use: true }))
            : EMPTY_ENTRY
        );
        setWebsite(claude.website);
      } else {
        setTagline("");
        setAddress("");
        setName(extracted.full_name?.text ?? "");
        setHeadline(extracted.headline?.text ?? "");
        setCompany(extracted.company?.text ?? "");
        const tessPhone = extracted.phone?.text ?? "";
        const tessEmail = extracted.email?.text ?? "";
        setPhones(tessPhone ? [{ label: "", value: tessPhone, use: true }] : EMPTY_ENTRY);
        setEmails(tessEmail ? [{ label: "", value: tessEmail, use: true }] : EMPTY_ENTRY);
        setWebsite(extracted.website?.text ?? "");
      }

      if (!claude && !extracted.ok) {
        setError(
          "Both engines came back empty — Claude isn't configured or failed, and OCR reported a failure too. See console."
        );
      } else if (!claude) {
        setError("Claude didn't return a result (not configured, or the API call failed) — showing tesseract's read instead.");
      }

      // Fresh scan, fresh account panel — a previous "created" state
      // shouldn't linger over a different card's data.
      const scannedName = claude?.full_name || extracted.full_name?.text || "";
      const scannedEmail = claude?.emails[0]?.value || extracted.email?.text || "";
      setAccountEmail(scannedEmail);
      setAccountUsername(slugify(scannedName));
      setAccountPassword("");
      setAccountError(null);
      setCreatedAccount(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something threw during scanning — see console.");
    } finally {
      setElapsedMs(Math.round(performance.now() - started));
      setBusy(false);
    }
  };

  const buttons: CardButton[] = useMemo(() => {
    const list: CardButton[] = [];
    const usedPhones = phones.filter((p) => p.use && p.value.trim());
    usedPhones.forEach((p, i) => {
      const label = p.label || (usedPhones.length > 1 ? `Phone ${i + 1}` : KIND_LABELS.phone);
      list.push({ label, kind: "phone", value: p.value.trim() });
    });
    const usedEmails = emails.filter((e) => e.use && e.value.trim());
    usedEmails.forEach((e, i) => {
      const label = e.label || (usedEmails.length > 1 ? `Email ${i + 1}` : KIND_LABELS.email);
      list.push({ label, kind: "email", value: e.value.trim() });
    });
    if (website.trim()) list.push({ label: "Website", kind: "link", value: normalizeWebsite(website) });
    return list;
  }, [phones, emails, website]);

  const logoUrl = manualLogoUrl || (useLogo ? claudeLogoUrl : "");

  const form: CardForm = useMemo(
    () => ({
      ...EMPTY_CARD_FORM,
      full_name: name.trim(),
      headline: headline.trim(),
      company: company.trim(),
      bio: tagline.trim(),
      location: address.trim(),
      template,
      accent_color: vibe?.accent ?? EMPTY_CARD_FORM.accent_color,
      surface_color: vibe?.surface ?? "",
      logo_url: logoUrl,
    }),
    [name, headline, company, tagline, address, template, vibe, logoUrl]
  );

  const previewCard = useMemo(() => draftToCardProfile(form, buttons, resolveGallery([])), [form, buttons]);
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);

  const openInEditor = () => {
    saveDraft({ form, buttons, gallery: [], extras: {} });
    router.push(`/templates/${template}/edit`);
  };

  const createAccount = async () => {
    setCreatingAccount(true);
    setAccountError(null);
    const r = await createCustomer({
      email: accountEmail,
      password: accountPassword || undefined,
      fullName: name,
      username: accountUsername,
      headline,
      company,
      location: address,
      bio: tagline,
      template,
      accentColor: vibe?.accent,
      surfaceColor: vibe?.surface,
      logoUrl: logoUrl || undefined,
      buttons,
      publish: accountPublish,
    });
    setCreatingAccount(false);
    if (!r.ok) {
      setAccountError(r.error ?? "Could not create the account.");
      return;
    }
    setCreatedAccount(r.data ?? null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Scan test</h1>
        <p className="app-sub mt-1 max-w-2xl">
          Runs both engines a signup can hit — Claude Haiku (
          <code className="text-acid">/api/scan-card</code>) and the tesseract.js
          fallback (<code className="text-acid">src/lib/card-ocr.ts</code>) — side by
          side, with the raw detections shown rather than hidden. The editable fields
          below default to whichever one a real user would actually get. Nothing is
          saved unless you open the result in the editor.
        </p>
      </div>

      <div className="app-panel app-panel-pad space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoSlot
            label="front (required)"
            preview={frontPreview}
            onPick={(f) => pickFile(f, "front")}
            onClear={() => {
              setFrontFile(null);
              setFrontPreview("");
            }}
          />
          <PhotoSlot
            label="back (optional)"
            preview={backPreview}
            onPick={(f) => pickFile(f, "back")}
            onClear={() => {
              setBackFile(null);
              setBackPreview("");
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={run}
            disabled={!frontFile || busy}
            className="app-btn app-btn-primary disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {busy ? "scanning…" : "run scan"}
          </button>
          {elapsedMs !== null && (
            <span className="text-xs font-semibold text-sc-text-dimmer">{elapsedMs}ms total</span>
          )}
        </div>

        {error && (
          <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
            {error}
          </p>
        )}
      </div>

      {fields && vibe && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* What a real user actually gets — Claude, when it's available.
                The fields below default from this, not from tesseract. */}
            <div className="app-panel app-panel-pad">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-black text-sc-text">Claude Haiku read</p>
                <p className="text-xs font-semibold text-sc-text-dimmer">
                  {claudeFields ? `${claudeFields.lines.length} lines` : "no result"}
                  {claudeMs !== null && ` · ${claudeMs}ms`}
                </p>
              </div>
              {!claudeFields ? (
                <p className="mt-3 text-xs text-sc-text-dimmer">
                  No Claude result — either <code className="text-acid">ANTHROPIC_API_KEY</code> isn&apos;t set, or the call failed. Falling back to tesseract below.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {claudeFields.lines.map((line, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-sc-surface-2 px-2 py-1 font-mono text-[11px] text-sc-text"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                  <div className="grid gap-1.5 text-xs sm:grid-cols-2">
                    {claudeFields.phones.map((p, i) => (
                      <span key={`p${i}`} className="text-sc-text-dim">
                        <span className="text-acid">phone{p.label ? ` (${p.label})` : ""}:</span> {p.value}
                      </span>
                    ))}
                    {claudeFields.emails.map((e, i) => (
                      <span key={`e${i}`} className="text-sc-text-dim">
                        <span className="text-acid">email{e.label ? ` (${e.label})` : ""}:</span> {e.value}
                      </span>
                    ))}
                  </div>
                  {claudeLogoUrl && (
                    <div className="flex items-center gap-2 text-xs text-sc-text-dim">
                      <span>logo_box crop:</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={claudeLogoUrl}
                        alt=""
                        className="h-10 w-10 rounded-md border-2 border-sc-border-soft bg-sc-surface-2 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* The diagnostic view — every line tesseract found, what it was
                worth in height/confidence, and which field (if any) claimed
                it. Kept even when Claude succeeds, to compare against. */}
            <div className="app-panel app-panel-pad">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-black text-sc-text">Raw tesseract OCR lines</p>
                <p className="text-xs font-semibold text-sc-text-dimmer">
                  {fields.allLines.length} found
                  {tesseractMs !== null && ` · ${tesseractMs}ms`}
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {fields.allLines.length === 0 && (
                  <p className="text-xs text-sc-text-dimmer">Nothing detected.</p>
                )}
                {fields.allLines
                  .slice()
                  .sort((a, b) => b.height - a.height)
                  .map((line, i) => (
                    <LineRow key={i} line={line} tag={tagFor(line, fields)} />
                  ))}
              </div>
            </div>

            <div className="app-panel app-panel-pad">
              <p className="text-sm font-black text-sc-text">Derived colour</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-sc-text-dim">
                <Swatch label="accent" hex={vibe.accent} />
                <Swatch label="surface" hex={vibe.surface} />
                <span>{vibe.dark ? "dark" : "light"}</span>
                <span>{vibe.vivid ? "vivid" : "muted"}</span>
                <span>
                  → suggested{" "}
                  <span className="font-black text-acid">{template}</span>
                </span>
              </div>
            </div>

            <div className="app-panel app-panel-pad space-y-3">
              <p className="text-sm font-black text-sc-text">Fields (editable before opening)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="full name" value={name} onChange={setName} />
                <Field label="headline" value={headline} onChange={setHeadline} />
                <Field label="company" value={company} onChange={setCompany} />
                <Field label="tagline" value={tagline} onChange={setTagline} />
                <Field label="address" value={address} onChange={setAddress} />
                <Field label="website" value={website} onChange={setWebsite} />
              </div>
              <EntryListField label="phone" entries={phones} onChange={setPhones} type="tel" />
              <EntryListField label="email" entries={emails} onChange={setEmails} type="email" />

              {claudeLogoUrl ? (
                <label className="flex items-center gap-3 text-xs font-semibold text-sc-text-dim">
                  <input
                    type="checkbox"
                    checked={useLogo}
                    onChange={(e) => setUseLogo(e.target.checked)}
                    disabled={Boolean(manualLogoUrl)}
                    className="h-4 w-4 rounded border-2 border-sc-border accent-acid disabled:opacity-40"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={claudeLogoUrl}
                    alt=""
                    className="h-8 w-8 rounded-md border-2 border-sc-border-soft bg-sc-surface-2 object-contain"
                  />
                  Use the logo Claude found on the card
                </label>
              ) : (
                <p className="text-xs text-sc-text-dimmer">No logo detected — upload one manually below if the card has one.</p>
              )}
              <div className="flex items-center gap-3 text-xs font-semibold text-sc-text-dim">
                {manualLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={manualLogoUrl}
                    alt=""
                    className="h-8 w-8 rounded-md border-2 border-sc-border-soft bg-sc-surface-2 object-contain"
                  />
                )}
                <label className="cursor-pointer text-sc-text-dimmer underline decoration-dotted underline-offset-2 hover:text-sc-text-dim">
                  {manualLogoUrl ? "replace logo file" : "or upload a logo file"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const blob = await downscale(file, "avatar");
                      setManualLogoUrl(await toDataUrl(blob));
                    }}
                  />
                </label>
                {manualLogoUrl && (
                  <button type="button" onClick={() => setManualLogoUrl("")} className="text-sc-text-dimmer hover:text-sc-text-dim">
                    remove
                  </button>
                )}
              </div>

              <button
                onClick={openInEditor}
                disabled={!name.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                open in editor
              </button>
              <p className="text-xs text-sc-text-dimmer">
                An anonymous draft — for previewing, or handing to someone who&apos;ll
                sign up themselves later.
              </p>
            </div>

            <div className="app-panel app-panel-pad space-y-3">
              <p className="text-sm font-black text-sc-text">Create their account</p>
              <p className="text-xs text-sc-text-dimmer">
                Makes a real, already-confirmed login right now, pre-filled from the
                scan — for a customer standing here, same as{" "}
                <code className="text-acid">admin/users/new</code>.
              </p>

              {createdAccount ? (
                <div className="rounded-xl border-2 border-acid/40 bg-acid/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-acid">
                    <Check className="h-4 w-4" />
                    account created
                  </p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[13px] leading-relaxed text-sc-text">
                    {`Card: https://tap.scorlyn.com/u/${createdAccount.username}
Login: https://tap.scorlyn.com/login
Email: ${createdAccount.email}
Password: ${createdAccount.password}`}
                  </pre>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const lines = `Card: https://tap.scorlyn.com/u/${createdAccount.username}\nLogin: https://tap.scorlyn.com/login\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}`;
                        try {
                          await navigator.clipboard.writeText(lines);
                          setCopiedCreds(true);
                          window.setTimeout(() => setCopiedCreds(false), 2500);
                        } catch {
                          // Clipboard needs a secure context; the text is on screen either way.
                        }
                      }}
                      className="app-btn app-btn-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedCreds ? "Copied" : "Copy details"}
                    </button>
                    <a
                      href={`/u/${createdAccount.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="app-btn app-btn-ghost"
                    >
                      Open their card
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="their email (login)" value={accountEmail} onChange={setAccountEmail} />
                    <Field label="handle — tap.scorlyn.com/u/…" value={accountUsername} onChange={setAccountUsername} />
                    <Field
                      label="password (blank = generate)"
                      value={accountPassword}
                      onChange={setAccountPassword}
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sc-border-soft p-3.5">
                    <input
                      type="checkbox"
                      checked={accountPublish}
                      onChange={(e) => setAccountPublish(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-acid"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-sc-text">Publish immediately</span>
                      <span className="mt-0.5 block text-xs text-sc-text-dimmer">
                        Off by default — theirs to release once they&apos;ve checked it.
                      </span>
                    </span>
                  </label>
                  {accountError && (
                    <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm text-sc-error">{accountError}</p>
                  )}
                  <button
                    onClick={createAccount}
                    disabled={!name.trim() || !accountEmail.trim() || !accountUsername.trim() || creatingAccount}
                    className="app-btn app-btn-primary disabled:opacity-50"
                  >
                    {creatingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {creatingAccount ? "creating…" : "create account and card"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0 lg:sticky lg:top-6">
            <DevicePreview>{renderCardTemplate({ card: previewCard, buttons: previewButtons })}</DevicePreview>
          </div>
        </div>
      )}
    </div>
  );
}

/** Which field, if any, ended up with this exact line — read straight off
 *  the ScanFields result rather than re-guessing, so this can never disagree
 *  with what the pipeline actually decided. */
function tagFor(line: ScanLine, fields: ScanFields): string | null {
  if (fields.email === line) return "email";
  if (fields.phone === line) return "phone";
  if (fields.website === line) return "website";
  if (fields.full_name === line) return "name";
  if (fields.headline === line) return "headline";
  if (fields.company === line) return "company";
  return null;
}

function LineRow({ line, tag }: { line: ScanLine; tag: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-sc-surface-2 px-3 py-2 text-xs">
      <span className="min-w-0 flex-1 truncate font-semibold text-sc-text">{line.text}</span>
      <span className="shrink-0 font-mono text-sc-text-dimmer">h{Math.round(line.height)}</span>
      <span className="shrink-0 font-mono text-sc-text-dimmer">{Math.round(line.confidence)}%</span>
      {tag && (
        <span className="shrink-0 rounded-full bg-acid/15 px-2 py-0.5 font-black uppercase tracking-tight text-acid">
          {tag}
        </span>
      )}
    </div>
  );
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-4 w-4 rounded-full border border-sc-border" style={{ background: hex }} />
      {label} <span className="font-mono text-sc-text-dimmer">{hex}</span>
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="app-input" />
    </div>
  );
}

function PhotoSlot({
  label,
  preview,
  onPick,
  onClear,
}: {
  label: string;
  preview: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <label className="relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sc-border-soft bg-sc-surface-2 text-center transition-colors hover:border-acid/60">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-sc-text"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <Camera className="h-6 w-6 text-sc-text-dimmer" />
          <span className="text-xs font-black uppercase tracking-widest text-sc-text-dimmer">{label}</span>
        </>
      )}
    </label>
  );
}
