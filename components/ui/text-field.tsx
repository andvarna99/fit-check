"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { IconButton } from "./button";
import { Icon } from "./icon";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
};

export function TextField({ label, optional, error, hint, className, type = "text", ...rest }: TextFieldProps) {
  const id = useId();
  const messageId = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  const input = (
    <input
      id={id}
      type={isPassword && revealed ? "text" : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={error || hint ? messageId : undefined}
      className="fc-input"
      {...rest}
    />
  );

  return (
    <div className={cn("fc-field", className)}>
      <label htmlFor={id} className="fc-label">
        {label}
        {optional ? <span className="fc-label__opt"> optional</span> : null}
      </label>
      {isPassword ? (
        <div className="fc-input-wrap">
          {input}
          <IconButton
            icon={revealed ? "eye-off" : "eye"}
            label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((r) => !r)}
          />
        </div>
      ) : (
        input
      )}
      {error ? (
        <p id={messageId} className="fc-error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="type-caption">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
