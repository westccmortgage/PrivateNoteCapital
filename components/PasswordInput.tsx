"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordInputType } from "@/lib/auth-reset";

// Accessible password field with a show/hide toggle. The toggle is a real
// <button type="button"> so it never submits the form, keeps the entered value,
// and exposes "Show password" / "Hide password" to assistive tech. The password
// is never logged or persisted anywhere by this component.
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  className = "",
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={passwordInputType(visible)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-hairlineStrong bg-canvas py-2.5 pl-3 pr-11 text-[15px] text-navy placeholder:text-navy-muted focus:border-accent focus:bg-surface ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-navy-muted hover:text-navy focus-visible:text-accent"
        tabIndex={0}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
