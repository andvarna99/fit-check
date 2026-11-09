"use client";

import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { CATEGORIES, CATEGORY_LABEL, SCALE, SEASON_LABEL, SEASONS, type Category, type ColorName, type Season } from "@/lib/closet/options";

const scaleOptions = SCALE.map((n) => ({ value: n, label: String(n) }));

type TagFieldsProps = {
  category: Category | null;
  onCategory: (c: Category | null) => void;
  colors: string[];
  onColors: (c: ColorName[]) => void;
  /** e.g. "· adds to each item" for quick-tag. */
  colorsHint?: string;
  seasons: Season[];
  onSeasons: (s: Season[]) => void;
  formality: number | null;
  onFormality: (n: number | null) => void;
  warmth: number | null;
  onWarmth: (n: number | null) => void;
  categoryRequired?: boolean;
};

/** Compact tagging fields for bulk review (One-by-one) and Quick-tag. */
export function TagFields(props: TagFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="fc-fieldset">
        <legend className="fc-label">
          Category {props.categoryRequired ? <span className="fc-label__opt">· required</span> : null}
        </legend>
        <div className="fc-chip-wrap">
          {CATEGORIES.map((c) => (
            <Chip key={c} selected={props.category === c} onClick={() => props.onCategory(props.category === c ? null : c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="fc-fieldset">
        <legend className="fc-label">
          Colors {props.colorsHint ? <span className="fc-label__opt">{props.colorsHint}</span> : null}
        </legend>
        <SwatchPicker label="Colors" values={props.colors} onChange={props.onColors} />
      </fieldset>

      <fieldset className="fc-fieldset">
        <legend className="fc-label">Seasons</legend>
        <div className="fc-chip-wrap">
          {SEASONS.map((s) => (
            <Chip
              key={s}
              selected={props.seasons.includes(s)}
              onClick={() => props.onSeasons(props.seasons.includes(s) ? props.seasons.filter((x) => x !== s) : [...props.seasons, s])}
            >
              {SEASON_LABEL[s]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fc-fieldset">
          <legend className="fc-label">Formality</legend>
          <Segmented label="Formality, 1 casual to 5 formal" options={scaleOptions} value={props.formality} onChange={props.onFormality} allowDeselect className="[&_.fc-seg__btn]:px-0" />
        </fieldset>
        <fieldset className="fc-fieldset">
          <legend className="fc-label">Warmth</legend>
          <Segmented label="Warmth, 1 light to 5 toasty" options={scaleOptions} value={props.warmth} onChange={props.onWarmth} allowDeselect className="[&_.fc-seg__btn]:px-0" />
        </fieldset>
      </div>
    </div>
  );
}
