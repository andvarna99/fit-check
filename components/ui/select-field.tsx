"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
};

/** Native select (iOS shows its own picker wheel), styled as an input. */
export function SelectField({ label, value, onChange, options, placeholder, disabled, className }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn("fc-field", className)}>
      <label htmlFor={id} className="fc-label">
        {label}
      </label>
      <select
        id={id}
        className={cn("fc-input fc-select", !value && "is-placeholder")}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
