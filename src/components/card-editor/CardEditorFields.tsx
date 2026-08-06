"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCENT_PRESETS,
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
import PaymentFields from "./PaymentFields";
import EditorSection from "./EditorSection";
import ProfileExtrasFields, { type ExtrasState } from "./ProfileExtrasFields";


const FONTS = [
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];

/** One field style for the whole editor, matching the site's sticker scheme. */
const FIELD =
  "border-2 border-white/15 bg-white/[0.04] font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:ring-0";

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
}) {
  // Shown on the collapsed section headers so it's obvious what's already
  // filled in without opening each one.
  const photoCount =
    (form.avatar_url ? 1 : 0) + (form.cover_url ? 1 : 0) + gallery.length;

  const updateButton = (index: number, patch: Partial<CardButton>) => {
    onButtonsChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
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

  return (
    <div className="min-w-0 space-y-3">
      <TemplatePicker
        value={form.template}
        accent={form.accent_color}
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
              className="h-10 w-14 cursor-pointer rounded-lg border-2 border-white/15 bg-white/[0.04]"
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
                    ? "border-acid"
                    : "border-white/20"
                }`}
                style={{ background: preset.value }}
              />
            ))}
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
                    ? "border-acid bg-acid text-ink"
                    : "border-white/15 bg-white/[0.04] text-white/60 hover:text-white"
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
            <Input
              id="username"
              value={form.username}
              onChange={(e) => onFormChange({ username: e.target.value })}
              placeholder="abdullah"
              className={FIELD}
            />
            <p className="text-xs text-slate-500">
              Your card will live at /u/{form.username || "username"}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => onFormChange({ full_name: e.target.value })}
            placeholder="Abdullah Khan"
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
            className="w-full rounded-lg border-2 border-white/15 bg-white/[0.04] px-3 py-2 text-base font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid sm:text-sm"
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
          <p className="mt-1 text-xs text-slate-500">
            Pick them from your phone. Templates use what they need — a profile
            photo everywhere, a cover on the ones with a hero, and the gallery
            on portfolio layouts.
          </p>
        </div>

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
            hint="Used by Poster, Showcase, Agency, App, Glass."
            value={form.cover_url}
            onChange={(url) => onFormChange({ cover_url: url })}
          />
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <Label>Gallery</Label>
          <p className="-mt-1 text-xs text-slate-500">
            For Grid, Reel and Agency. Ignored by the other templates.
          </p>

          {gallery.map((item, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col gap-2 rounded-xl border-2 border-white/12 bg-white/[0.03] p-3 sm:flex-row"
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
                className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-lg text-slate-500 transition-colors hover:text-red-400 sm:h-9 sm:w-9"
                aria-label="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onGalleryChange([...gallery, { url: "", caption: "" }])}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
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
        hint="WhatsApp, email, socials, bank details"
        badge={buttons.length ? `${buttons.length}` : undefined}
        defaultOpen
      >
      <section className="space-y-3">
        <div>
          <Label>Buttons</Label>
          <p className="text-xs text-slate-500 mt-1">Shown in this order on your card.</p>
        </div>

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
              className={`flex cursor-grab flex-col gap-2 rounded-xl border-2 bg-white/[0.03] p-3 transition-colors active:cursor-grabbing sm:flex-row min-w-0 ${
                dragOver === index && dragFrom !== index
                  ? "border-acid"
                  : dragFrom === index
                    ? "border-white/30 opacity-50"
                    : "border-white/12"
              }`}
            >
              <div
                className="flex justify-center text-white/40 sm:flex-col"
                title="Drag to reorder"
              >
                <button
                  type="button"
                  onClick={() => moveButton(index, -1)}
                  className="flex h-11 w-11 items-center justify-center rounded text-xs leading-none transition-colors hover:bg-white/10 hover:text-white sm:h-5 sm:w-5"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <GripVertical className="w-3.5 h-3.5 my-0.5 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => moveButton(index, 1)}
                  className="flex h-11 w-11 items-center justify-center rounded text-xs leading-none transition-colors hover:bg-white/10 hover:text-white sm:h-5 sm:w-5"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Icon preview beside the picker — with 26 kinds, seeing the
                  mark is faster than reading the name back. */}
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-white/15 bg-white/[0.04] text-white/80">
                  <KindIcon className="h-4 w-4" />
                </span>

                <select
                  value={button.kind}
                  onChange={(e) => updateButton(index, { kind: e.target.value as ButtonKind })}
                  className="h-11 flex-1 rounded-lg border-2 border-white/15 bg-ink px-2 text-base font-bold text-white sm:h-10 sm:w-36 sm:flex-none sm:text-sm"
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
                className={`${FIELD} sm:max-w-[140px]`}
              />

              <Input
                value={button.value}
                onChange={(e) => updateButton(index, { value: e.target.value })}
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
                  className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 ${
                    button.enabled === false
                      ? "text-white/25 hover:text-white/60"
                      : "text-acid hover:text-white"
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
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-red-400 sm:h-9 sm:w-9"
                  aria-label="Remove button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onButtonsChange([...buttons, { label: "", kind: "link", value: "" }])}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <Plus className="w-4 h-4" />
          Add button
        </button>

        {/* Bank details sit with the links because that's what they are: a
            thing someone taps on your card to act on. In "extras" nobody
            found them. */}
        <div className="mt-8 border-t-2 border-white/10 pt-7">
          <PaymentFields
            enabled={extras.payment_enabled}
            methods={extras.payment_methods ?? []}
            onChange={onExtrasChange}
          />
        </div>
      </section>

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
