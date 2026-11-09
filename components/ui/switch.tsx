"use client";

type SwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="fc-switch"
      onClick={() => onChange(!checked)}
    />
  );
}
