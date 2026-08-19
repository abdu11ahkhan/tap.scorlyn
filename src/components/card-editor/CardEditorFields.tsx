"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCENT_PRESETS,
  SURFACE_PRESETS,
  surfaceReadability,
  BUTTON_KIND_GROUPS,
  KIND_LABELS,
  KIND_PLACEHOLDERS,
  type ButtonKind,
  type CardButton,
  type GalleryItem,
} from "@/lib/card";
import { iconFor } from "@/components/card-templates/button-icons";
import type { CardForm } from "@/lib/card-draft";
import TemplatePicker from "./TemplatePicker";
import ImagePicker from "./ImagePicker";
import UsernameField from "./UsernameField";
import { detectKind } from "@/lib/detect-link";
import { TEMPLATE_TONE } from "@/components/card-templates";
import PaymentFields from "./PaymentFields";
import EditorSection from "./EditorSection";
import PasteLinks from "./PasteLinks";
import ProfileExtrasFields, { type ExtrasState } from "./ProfileExtrasFields";


const FONTS = [
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];

/** One field style for the whole editor, matching the site's sticker scheme. */
const FIELD =
  "border-2 border-sc-border bg-sc-surface-2 font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-sc-gold focus-visible:ring-0";

/**
 * Every field of a card, shared by the public editor and the dashboard editor
 * so the two can never drift apart.
 */
export default function CardEditorFields({
  form,
  onFormChange,
  buttons,
  onButtonsChange,
  gallery,
  onGalleryChange,
  extras,
  onExtrasChange,
  showUsername = true,
  lockUsername = false,
  ownHandle,
}: {
  form: CardForm;
  onFormChange: (patch: Partial<CardForm>) => void;
  buttons: CardButton[];
  onButtonsChange: (buttons: CardButton[]) => void;
  gallery: GalleryItem[];
  onGalleryChange: (gallery: GalleryItem[]) => void;
  extras: ExtrasState;
  onExtrasChange: (patch: Partial<ExtrasState>) => void;
  showUsername?: boolean;
  lockUsername?: boolean;
  ownHandle?: string;
}) {
  // Shown on the collapsed section headers so it's obvious what's already
  // filled in without opening each one.
  const photoCount =
    (form.avatar_url ? 1 : 0) +
    (form.cover_url ? 1 : 0) +
    (form.logo_url ? 1 : 0) +
    gallery.length;

  const updateButton = (index: number, patch: Partial<CardButton>) => {
    onButtonsChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  /**
   * Sets a button's value and works out what it is.
   *
   * Pasting a link left the kind on "Link", which decides the icon and the
   * default label — so a card ended up with six identical grey "Link" rows
   * because nobody went back to set each one.
   *
   * Only ever moves a button *off* the generic kind, and only while its label
   * is still empty or the previous kind's default. Someone who picked a kind
   * or typed their own label has said what they want, and a paste should not
   * argue with them.
   */
  const updateButtonValue = (index: number, value: string) => {
    const button = buttons[index];
    const detected = detectKind(value);

    const patch: Partial<CardButton> = { value };

    const untouched =
      !button.label.trim() || button.label.trim() === KIND_LABELS[button.kind];

    if (detected && detected !== button.kind && button.kind === "link" && untouched) {
      patch.kind = detected;
      patch.label = KIND_LABELS[detected];
    }

    updateButton(index, patch);
  };

  const moveButton = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= buttons.length) return;
    const next = [...buttons];
    [next[index], next[target]] = [next[target], next[index]];
    onButtonsChange(next);
  };

  // Native HTML5 drag rather than a drag library: reordering a short list is
  // the one thing the browser already does well, and a dnd package would be
  // ~30KB for this. The arrow buttons stay for keyboard and touch, where
  // HTML5 drag is unreliable.
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const drop = (to: number) => {
    if (dragFrom === null || dragFrom === to) {
      setDragFrom(null);
      setDragOver(null);
      return;
    }
    const next = [...buttons];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(to, 0, moved);
    onButtonsChange(next);
    setDragFrom(null);
    setDragOver(null);
  };

  // Read off the template's real background rather than a hand-kept list, so
  // a new template cannot be offered the wrong half of the palette.
  const tone = TEMPLATE_TONE[form.template] ?? "#ffffff";
  const surfaceFamily: "dark" | "light" = (() => {
    const h = tone.replace("#", "");
    if (h.length < 6) return "light";
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4 ? "dark" : "light";
  })();

  return (
    <div className="min-w-0 space-y-3">
      <TemplatePicker
        value={form.template}
        accent={form.accent_color}
        surface={form.surface_color}
        onChange={(template) => onFormChange({ template })}
      />

      {/* ---------------- Style ---------------- */}
      <EditorSection
        title="colour & font"
        hint="The accent used across your card"
        badge={form.font}
      >
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accent_color">Accent colour</Label>
          <div className="flex gap-2">
            <input
              id="accent_color"
              type="color"
              value={form.accent_color}
              onChange={(e) => onFormChange({ accent_color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border-2 border-sc-border bg-sc-surface-2"
            />
            <Input
              value={form.accent_color}
              onChange={(e) => onFormChange({ accent_color: e.target.value })}
              className={FIELD}
            />
          </div>

          {/* Presets: a colour picker is a poor way to land on something that
              actually works, and these are all tested against readableOn(). */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                onClick={() => onFormChange({ accent_color: preset.value })}
                className={`h-11 w-11 rounded-full border-2 transition-transform hover:scale-110 sm:h-7 sm:w-7 ${
                  form.accent_color.toLowerCase() === preset.value.toLowerCase()
                    ? "border-sc-gold"
                    : "border-sc-border"
                }`}
                style={{ background: preset.value }}
              />
            ))}
          </div>
        </div>

        {/* Background. Offered only in the template's own lightness family:
            every template hardcodes its text as white-on-dark or
            black-on-light, so crossing over would make text unreadable in
            places nobody would think to check. */}
        <div className="space-y-2">
          <Label>Background</Label>
          <p className="-mt-1 text-xs text-sc-text-dimmer">
            {surfaceFamily === "dark"
              ? "This template is a dark one, so these are the shades that keep its text readable."
              : "This template is a light one, so these are the shades that keep its text readable."}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onFormChange({ surface_color: "" })}
              className={`h-11 shrink-0 whitespace-nowrap rounded-full border-2 px-3 text-[11px] font-black lowercase transition-colors sm:h-7 ${
                !form.surface_color
                  ? "border-sc-gold text-sc-gold"
                  : "border-sc-border text-sc-text-dim hover:text-sc-text"
              }`}
            >
              as designed
            </button>
            {SURFACE_PRESETS[surfaceFamily].map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                onClick={() => onFormChange({ surface_color: preset.value })}
                className={`h-11 w-11 rounded-full border-2 transition-transform hover:scale-110 sm:h-7 sm:w-7 ${
                  form.surface_color.toLowerCase() === preset.value.toLowerCase()
                    ? "border-sc-gold"
                    : "border-sc-border"
                }`}
                style={{ background: preset.value }}
              />
            ))}
          </div>

          {/* Any colour, not just the safe ones — but the template's text is
              hardcoded light or dark, so a free pick can make it unreadable.
              Rather than forbidding it, say what the contrast actually is. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="color"
              aria-label="Pick any background colour"
              value={form.surface_color || (surfaceFamily === "dark" ? "#0A0A0A" : "#FFFFFF")}
              onChange={(e) => onFormChange({ surface_color: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-lg border-2 border-sc-border bg-transparent p-1 sm:h-9 sm:w-12"
            />
            <input
              value={form.surface_color}
              onChange={(e) => onFormChange({ surface_color: e.target.value })}
              placeholder="any hex, e.g. #123456"
              className="h-11 w-40 rounded-lg border-2 border-sc-border bg-sc-surface-2 px-3 text-sm font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-sc-gold focus-visible:outline-none sm:h-9"
            />
            {form.surface_color && (() => {
              const check = surfaceReadability(form.surface_color, surfaceFamily);
              return (
                <span
                  className={`text-xs font-bold ${check.ok ? "text-sc-success" : "text-sc-warning"}`}
                >
                  {check.ok
                    ? `text contrast ${check.ratio}:1 — readable`
                    : `text contrast ${check.ratio}:1 — too low, your text will be hard to read`}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Font</Label>
          <div className="flex gap-2">
            {FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onFormChange({ font: font.id })}
                className={`h-10 flex-1 rounded-lg border-2 text-sm font-black lowercase transition-colors ${
                  form.font === font.id
                    ? "border-sc-gold bg-sc-gold text-sc-gold-ink"
                    : "border-sc-border bg-sc-surface-2 text-sc-text-dim hover:text-sc-text"
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      </EditorSection>

      {/* ---------------- Identity ---------------- */}
      <EditorSection
        title="your details"
        hint="Name, role, company, bio"
        defaultOpen
      >
      <section className="space-y-5">
        {showUsername && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <UsernameField
              value={form.username}
              onChange={(username) => onFormChange({ username })}
              className={FIELD}
              locked={lockUsername}
              ownHandle={ownHandle}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => onFormChange({ full_name: e.target.value })}
            placeholder="Your full name"
            className={FIELD}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => onFormChange({ headline: e.target.value })}
              placeholder="Real Estate Consultant"
              className={FIELD}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => onFormChange({ company: e.target.value })}
              placeholder="Skyline Properties"
              className={FIELD}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => onFormChange({ location: e.target.value })}
            placeholder="Islamabad, Pakistan"
            className={FIELD}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Short bio</Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => onFormChange({ bio: e.target.value })}
            rows={3}
            placeholder="Helping families find homes in DHA and Bahria Town since 2018."
            // 16px on mobile: iOS Safari zooms the whole viewport when a
            // focused field is any smaller.
            className="w-full rounded-lg border-2 border-sc-border bg-sc-surface-2 px-3 py-2 text-base font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-sc-gold sm:text-sm"
          />
        </div>
      </section>

      </EditorSection>

      {/* ---------------- Photos ---------------- */}
      <EditorSection
        title="photos"
        hint="Profile picture, cover image, gallery"
        badge={photoCount ? `${photoCount}` : undefined}
      >
      <section className="space-y-5">
        <div>
          <Label>Photos</Label>
          <p className="mt-1 text-xs text-sc-text-dimmer">
            Pick them from your phone. Templates use what they need — a profile
            photo everywhere, a cover on the ones with a hero, and the gallery
            on portfolio layouts.
          </p>
        </div>

        {/* QR code */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sc-border p-3.5">
          <input
            type="checkbox"
            checked={form.show_qr !== false}
            onChange={(e) => onFormChange({ show_qr: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-sc-gold"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-sc-text">Show QR code</span>
            <span className="mt-0.5 block text-xs text-sc-text-dimmer">
              Adds a QR button to your card, so someone can scan it when tapping
              isn&apos;t an option. Opens their contacts too.
            </span>
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <ImagePicker
            kind="avatar"
            label="Profile photo"
            hint="Shown on every template."
            value={form.avatar_url}
            onChange={(url) => onFormChange({ avatar_url: url })}
          />
          <ImagePicker
            kind="cover"
            label="Cover / background"
            hint="Sits behind the top of your card. Works on every template."
            value={form.cover_url}
            onChange={(url) => onFormChange({ cover_url: url })}
          />
          <ImagePicker
            kind="avatar"
            label="Company logo"
            hint="Optional. Shown small in the corner of your card, over everything else."
            value={form.logo_url}
            onChange={(url) => onFormChange({ logo_url: url })}
          />
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <Label>Gallery</Label>
          <p className="-mt-1 text-xs text-sc-text-dimmer">
            For Grid, Reel and Agency. Ignored by the other templates.
          </p>

          {gallery.map((item, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col gap-2 rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 p-3 sm:flex-row"
            >
              <div className="min-w-0 flex-1">
                <ImagePicker
                  kind="gallery"
                  label={`Photo ${index + 1}`}
                  value={item.url}
                  onChange={(url) => {
                    const next = [...gallery];
                    next[index] = { ...next[index], url };
                    onGalleryChange(next);
                  }}
                />
              </div>

              <Input
                value={item.caption ?? ""}
                onChange={(e) => {
                  const next = [...gallery];
                  next[index] = { ...next[index], caption: e.target.value };
                  onGalleryChange(next);
                }}
                placeholder="Caption"
                className={`${FIELD} sm:max-w-[160px]`}
              />

              <button
                type="button"
                onClick={() => onGalleryChange(gallery.filter((_, i) => i !== index))}
                className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-lg text-sc-text-dimmer transition-colors hover:text-red-400 sm:h-9 sm:w-9"
                aria-label="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onGalleryChange([...gallery, { url: "", caption: "" }])}
            className="inline-flex items-center gap-2 rounded-full border-2 border-sc-border px-4 py-2.5 text-sm font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold"
          >
            <Plus className="h-4 w-4" />
            add photo
          </button>
        </div>
      </section>

      </EditorSection>

      {/* ---------------- Buttons ---------------- */}
      <EditorSection
        title="links"
        hint="WhatsApp, email, socials, anything"
        badge={buttons.length ? `${buttons.length}` : undefined}
        defaultOpen
      >
      <section className="space-y-3">
        {/* Before the list, not after: someone with links to add should see
            the fast way first rather than after typing three by hand. */}
        <PasteLinks buttons={buttons} onButtonsChange={onButtonsChange} />

        <div>
          <Label>Buttons</Label>
          <p className="text-xs text-sc-text-dimmer mt-1">Shown in this order on your card.</p>
        </div>

        {/* @container: each row's layout has to respond to the space this
            column actually has, not the viewport. The desktop editor sits in
            a two-column grid with a fixed-width preview panel, so at some
            viewport widths (1024px, notably) this column is narrower than a
            `sm:` breakpoint assumes — a viewport-relative row-vs-stack switch
            fired anyway and overlapped every field. Container queries fix
            that at the source instead of guessing viewport widths. */}
        <div className="@container">
          <div className="space-y-3">
            {buttons.map((button, index) => {
              const KindIcon = iconFor(button.kind);
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={() => setDragFrom(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(index);
                  }}
                  onDragLeave={() => setDragOver((v) => (v === index ? null : v))}
                  onDrop={() => drop(index)}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  className={`flex min-w-0 cursor-grab flex-col gap-2 rounded-xl border-2 bg-sc-surface-2 p-3 transition-colors active:cursor-grabbing @min-[420px]:flex-row ${
                    dragOver === index && dragFrom !== index
                      ? "border-sc-gold"
                      : dragFrom === index
                        ? "border-sc-border opacity-50"
                        : "border-sc-border-soft"
                  }`}
                >
                  <div
                    className="flex justify-center text-sc-text-dimmer @min-[420px]:flex-col"
                    title="Drag to reorder"
                  >
                    <button
                      type="button"
                      onClick={() => moveButton(index, -1)}
                      className="flex h-11 w-11 items-center justify-center rounded text-xs leading-none transition-colors hover:bg-sc-surface hover:text-sc-text @min-[420px]:h-5 @min-[420px]:w-5"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <GripVertical className="w-3.5 h-3.5 my-0.5 hidden @min-[420px]:block" />
                    <button
                      type="button"
                      onClick={() => moveButton(index, 1)}
                      className="flex h-11 w-11 items-center justify-center rounded text-xs leading-none transition-colors hover:bg-sc-surface hover:text-sc-text @min-[420px]:h-5 @min-[420px]:w-5"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Icon preview beside the picker — with 26 kinds, seeing the
                      mark is faster than reading the name back. */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-sc-border bg-sc-surface-2 text-sc-text-dim">
                      <KindIcon className="h-4 w-4" />
                    </span>

                    <select
                      value={button.kind}
                      onChange={(e) => updateButton(index, { kind: e.target.value as ButtonKind })}
                      className="h-11 flex-1 rounded-lg border-2 border-sc-border bg-sc-surface-2 px-2 text-base font-bold text-sc-text @min-[420px]:h-10 @min-[420px]:w-36 @min-[420px]:flex-none @min-[420px]:text-sm"
                    >
                      {BUTTON_KIND_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.kinds.map((k) => (
                            <option key={k} value={k}>
                              {KIND_LABELS[k]}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <Input
                    value={button.label}
                    onChange={(e) => updateButton(index, { label: e.target.value })}
                    placeholder={KIND_LABELS[button.kind]}
                    className={`${FIELD} @min-[420px]:max-w-[140px]`}
                  />

                  <Input
                    value={button.value}
                    onChange={(e) => updateButtonValue(index, e.target.value)}
                    placeholder={KIND_PLACEHOLDERS[button.kind]}
                    className={`${FIELD} flex-1`}
                  />

                  <div className="flex items-center gap-1 self-center">
                    {/* Hide without deleting — keeps the value for later. */}
                    <button
                      type="button"
                      onClick={() => updateButton(index, { enabled: button.enabled === false })}
                      aria-pressed={button.enabled !== false}
                      title={button.enabled === false ? "Hidden — click to show" : "Visible — click to hide"}
                      className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors @min-[420px]:h-9 @min-[420px]:w-9 ${
                        button.enabled === false
                          ? "text-sc-text-dimmer hover:text-sc-text-dim"
                          : "text-sc-gold hover:text-sc-text"
                      }`}
                    >
                      {button.enabled === false ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onButtonsChange(buttons.filter((_, i) => i !== index))}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-sc-text-dimmer transition-colors hover:text-red-400 @min-[420px]:h-9 @min-[420px]:w-9"
                      aria-label="Remove button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onButtonsChange([...buttons, { label: "", kind: "link", value: "" }])}
          className="inline-flex items-center gap-2 rounded-full border-2 border-sc-border px-4 py-2.5 text-sm font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold"
        >
          <Plus className="w-4 h-4" />
          Add button
        </button>

      </section>

      </EditorSection>

      {/* Its own section, not a rule inside links. Bank details are their own
          decision — worth opening deliberately, and worth being able to skip. */}
      <EditorSection
        title="payment details"
        hint="Bank, EasyPaisa or JazzCash for getting paid"
        badge={
          extras.payment_enabled && (extras.payment_methods?.length ?? 0) > 0
            ? `${extras.payment_methods.length}`
            : undefined
        }
      >
        <PaymentFields
          enabled={extras.payment_enabled}
          methods={extras.payment_methods ?? []}
          onChange={onExtrasChange}
        />
      </EditorSection>

      <EditorSection
        title="extras"
        hint="Availability, business hours, video"
      >
        <ProfileExtrasFields value={extras} onChange={onExtrasChange} />
      </EditorSection>
    </div>
  );
}
