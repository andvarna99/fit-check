"use client";

import { COLORS, type ColorName } from "@/lib/closet/options";

type SwatchPickerProps = {
  label: string;
  values: readonly string[];
  onChange: (values: ColorName[]) => void;
};

/** Multi-select color swatches from the closet palette. */
export function SwatchPicker({ label, values, onChange }: SwatchPickerProps) {
  return (
    <div role="group" aria-label={label} className="fc-swatches">
      {COLORS.map((c) => {
        const on = values.includes(c.name);
        return (
          <button
            key={c.name}
            type="button"
            className="fc-swatch"
            aria-pressed={on}
            aria-label={c.label}
            title={c.label}
            onClick={() =>
              onChange(
                (on ? values.filter((v) => v !== c.name) : [...values, c.name]) as ColorName[],
              )
            }
          >
            <span style={{ background: c.swatch }} />
          </button>
        );
      })}
    </div>
  );
}
