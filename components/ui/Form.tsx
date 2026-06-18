"use client";
import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";

/**
 * Form primitives. Every form input in the app composes these - no naked
 * <input> in pages. Each field associates its label, hint and error with the
 * input via `for`/`id`/`aria-describedby` for accessibility.
 *
 *   <Field label="Subject" hint="Prospective client name" error={errors.subject?.message} required>
 *     <Input value={subject} onChange={...} placeholder="e.g. Cresta Advisors" />
 *   </Field>
 */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldContext.Provider value={{ id, hasError: !!error, hintId: hint ? `${id}-hint` : undefined, errorId: error ? `${id}-err` : undefined }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={id} className="text-caption font-medium text-ink">
            {label}
            {required && <span className="text-danger-600 ms-0.5" aria-hidden>*</span>}
          </label>
        )}
        {children}
        {error ? (
          <p id={`${id}-err`} className="text-caption text-danger-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden /> {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-caption text-muted">{hint}</p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

import { createContext, useContext } from "react";
type FieldCtx = { id: string; hasError: boolean; hintId?: string; errorId?: string };
const FieldContext = createContext<FieldCtx | null>(null);
function useField() { return useContext(FieldContext); }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  const field = useField();
  return (
    <input
      ref={ref}
      id={field?.id}
      aria-invalid={field?.hasError || undefined}
      aria-describedby={[field?.errorId, field?.hintId].filter(Boolean).join(" ") || undefined}
      {...props}
      className={cn("input", field?.hasError && "border-danger-400 focus-visible:border-danger-500", props.className)}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  const field = useField();
  return (
    <textarea
      ref={ref}
      id={field?.id}
      aria-invalid={field?.hasError || undefined}
      aria-describedby={[field?.errorId, field?.hintId].filter(Boolean).join(" ") || undefined}
      {...props}
      className={cn("textarea min-h-[80px]", field?.hasError && "border-danger-400 focus-visible:border-danger-500", props.className)}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  const field = useField();
  return (
    <select
      ref={ref}
      id={field?.id}
      aria-invalid={field?.hasError || undefined}
      aria-describedby={[field?.errorId, field?.hintId].filter(Boolean).join(" ") || undefined}
      {...props}
      className={cn(
        "input pr-8 appearance-none bg-no-repeat bg-[right_0.625rem_center] bg-[length:14px]",
        field?.hasError && "border-danger-400 focus-visible:border-danger-500",
        props.className,
      )}
      style={{
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%2364748B' stroke-width='2' viewBox='0 0 24 24'><polyline points='6 9 12 15 18 9'/></svg>\")",
        ...props.style,
      }}
    >
      {props.children}
    </select>
  );
});

/** Checkbox row with label. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("inline-flex items-center gap-2 text-body-sm cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-200"
      />
      <span>{label}</span>
    </label>
  );
}
