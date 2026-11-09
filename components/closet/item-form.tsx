/* eslint-disable @next/next/no-img-element -- local preview blobs and private photo URLs */
"use client";

import { useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Chip, TagChip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { SelectField } from "@/components/ui/select-field";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { TextField } from "@/components/ui/text-field";
import type { SaveItemResult } from "@/app/(flow)/closet/actions";
import type { ItemFieldErrors } from "@/lib/closet/item-input";
import { normalizeTags } from "@/lib/closet/item-input";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  FORMALITY_ENDS,
  PATTERNS,
  SCALE,
  SEASON_LABEL,
  SEASONS,
  SUBCATEGORIES,
  WARMTH_ENDS,
  type Category,
  type Season,
} from "@/lib/closet/options";

export type ItemFormValues = {
  name: string;
  category: Category | null;
  subcategory: string;
  colors: string[];
  pattern: string;
  material: string;
  seasons: Season[];
  formality: number | null;
  warmth: number | null;
  brand: string;
  price: string;
  purchasedOn: string;
  tags: string[];
};

export const EMPTY_ITEM_VALUES: ItemFormValues = {
  name: "",
  category: null,
  subcategory: "",
  colors: [],
  pattern: "",
  material: "",
  seasons: [],
  formality: null,
  warmth: null,
  brand: "",
  price: "",
  purchasedOn: "",
  tags: [],
};

type ItemFormProps = {
  initial: ItemFormValues;
  photoSrc: string | null;
  /** Header row, e.g. back button + title + step counter. */
  header: ReactNode;
  /** Shown under the intro text, e.g. a "Change photo" link. */
  photoAction?: ReactNode;
  /** Receives the form's FormData (plus intent) and persists it. */
  submit: (formData: FormData) => Promise<SaveItemResult>;
  onSaved: (result: Extract<SaveItemResult, { ok: true }>) => void;
  /** Label for the draft button, or null to hide it (e.g. editing a finished item). */
  draftLabel?: string | null;
};

function toFormData(values: ItemFormValues, intent: "save" | "draft"): FormData {
  const fd = new FormData();
  fd.set("intent", intent);
  fd.set("name", values.name);
  fd.set("category", values.category ?? "");
  fd.set("subcategory", values.subcategory);
  values.colors.forEach((c) => fd.append("colors", c));
  fd.set("pattern", values.pattern);
  fd.set("material", values.material);
  values.seasons.forEach((s) => fd.append("seasons", s));
  fd.set("formality", values.formality?.toString() ?? "");
  fd.set("warmth", values.warmth?.toString() ?? "");
  fd.set("brand", values.brand);
  fd.set("price", values.price);
  fd.set("purchasedOn", values.purchasedOn);
  values.tags.forEach((t) => fd.append("tags", t));
  return fd;
}

const scaleOptions = SCALE.map((n) => ({ value: n, label: String(n) }));

export function ItemForm({ initial, photoSrc, header, photoAction, submit, onSaved, draftLabel = "Save draft" }: ItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>(initial);
  const [errors, setErrors] = useState<ItemFieldErrors>({});
  const [pendingIntent, setPendingIntent] = useState<"save" | "draft" | null>(null);
  const [, startTransition] = useTransition();
  const [tagDraft, setTagDraft] = useState("");
  const categoryErrorId = useId();
  const categoryRef = useRef<HTMLFieldSetElement>(null);

  function set<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function chooseCategory(category: Category) {
    setValues((v) => ({
      ...v,
      category: v.category === category ? null : category,
      // Subcategories belong to a category; clear a stale one.
      subcategory: v.category === category ? v.subcategory : "",
    }));
    setErrors((e) => ({ ...e, category: undefined }));
  }

  function addTag(raw: string) {
    const next = normalizeTags([...values.tags, ...raw.split(",")]);
    set("tags", next);
    setTagDraft("");
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (tagDraft.trim()) addTag(tagDraft);
    } else if (event.key === "Backspace" && !tagDraft && values.tags.length) {
      set("tags", values.tags.slice(0, -1));
    }
  }

  function run(intent: "save" | "draft") {
    // Include a half-typed tag.
    const finalValues = tagDraft.trim() ? { ...values, tags: normalizeTags([...values.tags, tagDraft]) } : values;
    if (intent === "save" && !finalValues.category) {
      setErrors({ category: "Pick a category to save, or save it as a draft." });
      categoryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setPendingIntent(intent);
    setErrors({});
    startTransition(async () => {
      try {
        const result = await submit(toFormData(finalValues, intent));
        if (result.ok) onSaved(result);
        else setErrors(result.errors);
      } catch {
        setErrors({ form: "Couldn't reach Fit Check. Check your connection and try again." });
      } finally {
        setPendingIntent(null);
      }
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run("save");
  }

  const subcategoryOptions = values.category ? SUBCATEGORIES[values.category] : [];
  const busy = pendingIntent !== null;

  return (
    <form onSubmit={onSubmit} className="flex min-h-dvh flex-col" noValidate>
      {header}
      <div className="gutter flex flex-1 flex-col gap-5 pb-6">
        <div className="flex items-center gap-3">
          <span className="fc-thumb">
            {photoSrc ? <img src={photoSrc} alt="" /> : <Icon name="hanger" size={40} className="text-lavender-300" />}
          </span>
          <div className="min-w-0">
            <p className="type-body-strong">Only Category is required.</p>
            <p className="type-caption">Everything else helps the picker. Skip anything.</p>
            {photoAction}
          </div>
        </div>

        {errors.form ? <Banner tone="error">{errors.form}</Banner> : null}

        <TextField
          label="Name"
          optional
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Pink cropped jacket"
          maxLength={80}
          autoComplete="off"
        />

        <fieldset
          ref={categoryRef}
          className="fc-fieldset"
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? categoryErrorId : undefined}
        >
          <legend className="fc-label">
            Category <span className="fc-label__opt">· required</span>
          </legend>
          <div className="fc-chip-wrap">
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={values.category === c} onClick={() => chooseCategory(c)}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
          {errors.category ? (
            <p id={categoryErrorId} className="fc-error" role="alert">
              <Icon name="alert" size={16} />
              {errors.category}
            </p>
          ) : null}
        </fieldset>

        <SelectField
          label="Subcategory"
          value={values.subcategory}
          onChange={(v) => set("subcategory", v)}
          options={subcategoryOptions}
          placeholder={values.category ? "Choose one" : "Choose a category first"}
          disabled={!values.category}
        />

        <fieldset className="fc-fieldset">
          <legend className="fc-label">
            Colors <span className="fc-label__opt">· pick all that show</span>
          </legend>
          <SwatchPicker label="Colors" values={values.colors} onChange={(v) => set("colors", v)} />
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Pattern" value={values.pattern} onChange={(v) => set("pattern", v)} options={PATTERNS} placeholder="Choose" />
          <TextField label="Material" value={values.material} onChange={(e) => set("material", e.target.value)} maxLength={60} placeholder="Cotton" />
        </div>

        <fieldset className="fc-fieldset">
          <legend className="fc-label">Seasons</legend>
          <div className="fc-chip-wrap">
            {SEASONS.map((s) => (
              <Chip
                key={s}
                selected={values.seasons.includes(s)}
                onClick={() =>
                  set("seasons", values.seasons.includes(s) ? values.seasons.filter((x) => x !== s) : [...values.seasons, s])
                }
              >
                {SEASON_LABEL[s]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <ScaleField label="Formality" ends={FORMALITY_ENDS} value={values.formality} onChange={(v) => set("formality", v)} />
        <ScaleField label="Warmth" ends={WARMTH_ENDS} value={values.warmth} onChange={(v) => set("warmth", v)} />

        <TextField label="Brand" value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Add a brand" maxLength={60} />

        <div className="grid grid-cols-2 gap-3">
          <PriceField value={values.price} onChange={(v) => set("price", v)} error={errors.price} />
          <TextField label="Purchased" type="date" value={values.purchasedOn} onChange={(e) => set("purchasedOn", e.target.value)} />
        </div>

        <div className="fc-field">
          <label className="fc-label" htmlFor="item-tag-input">
            Tags
          </label>
          {values.tags.length ? (
            <div className="fc-chip-wrap">
              {values.tags.map((t) => (
                <TagChip key={t} onRemove={() => set("tags", values.tags.filter((x) => x !== t))}>
                  {t}
                </TagChip>
              ))}
            </div>
          ) : null}
          <input
            id="item-tag-input"
            className="fc-input"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={() => tagDraft.trim() && addTag(tagDraft)}
            placeholder="Add tag, then press return"
            enterKeyHint="done"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="fc-actionbar">
        {draftLabel ? (
          <Button variant="secondary" disabled={busy} loading={pendingIntent === "draft"} loadingLabel="Saving..." onClick={() => run("draft")}>
            {draftLabel}
          </Button>
        ) : null}
        <Button type="submit" disabled={busy} loading={pendingIntent === "save"} loadingLabel="Saving...">
          Save
        </Button>
      </div>
    </form>
  );
}

function ScaleField({
  label,
  ends,
  value,
  onChange,
}: {
  label: string;
  ends: readonly [string, string];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <fieldset className="fc-fieldset">
      <legend className="fc-label">{label}</legend>
      <Segmented label={`${label}, 1 ${ends[0]} to 5 ${ends[1]}`} options={scaleOptions} value={value} onChange={onChange} allowDeselect />
      <div className="fc-seg-ends" aria-hidden>
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </fieldset>
  );
}

function PriceField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const id = useId();
  const errId = useId();
  return (
    <div className="fc-field">
      <label htmlFor={id} className="fc-label">
        Price
      </label>
      <div className="fc-input-prefix">
        <span aria-hidden>$</span>
        <input
          id={id}
          className="fc-input"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          autoComplete="off"
        />
      </div>
      {error ? (
        <p id={errId} className="fc-error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}
    </div>
  );
}
