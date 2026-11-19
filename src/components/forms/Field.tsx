import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/lib/cx";

type ShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
};

/**
 * Shared control styles. The resting outline is ink at 50%, 3.5:1 on white (WCAG 1.4.11 asks 3:1 of a
 * field's boundary). A 2 px coral-700 ring marks an invalid field, so colour is not the only signal.
 */
const control =
  "w-full rounded-[14px] bg-white px-4 text-body text-ink ring-1 ring-ink/50 transition-shadow placeholder:text-ink/45 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 aria-invalid:ring-2 aria-invalid:ring-coral-700";

/** Ids of the hint and error, for aria-describedby. The error is listed first so it is read first. */
function describedBy({ id, hint, error }: Pick<ShellProps, "id" | "hint" | "error">): string | undefined {
  return [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
}

/**
 * A field is required unless it is marked optional, and says so to assistive technology. aria-required, not
 * the native attribute: the forms check with their own schema (noValidate), and `required` would bring the
 * browser's validation into it.
 */
const required = (optional?: boolean) => (optional ? undefined : true);

/** A visible label, the control, an optional hint and the field's error message. */
function Shell({ id, label, hint, error, optional, className, children }: ShellProps & { children: ReactNode }) {
  return (
    <div className={cx("flex flex-col", className)}>
      <label htmlFor={id} className="text-label font-medium text-ink">
        {label}
        {optional ? <span className="font-normal text-ink/60"> (optional)</span> : null}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-label text-ink/65">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-label font-medium text-coral-800">
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" className="mt-0.5 shrink-0" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 4.5v4.25M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ShellProps & Omit<ComponentPropsWithoutRef<"input">, "id" | "className">;

export function TextField({ id, label, hint, error, optional, className, ...rest }: InputProps) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={id}
        aria-required={required(optional)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cx(control, "h-12")}
        {...rest}
      />
    </Shell>
  );
}

type TextAreaProps = ShellProps & Omit<ComponentPropsWithoutRef<"textarea">, "id" | "className">;

export function TextAreaField({ id, label, hint, error, optional, className, ...rest }: TextAreaProps) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        id={id}
        aria-required={required(optional)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cx(control, "min-h-40 resize-y py-3")}
        {...rest}
      />
    </Shell>
  );
}

type SelectProps = ShellProps & Omit<ComponentPropsWithoutRef<"select">, "id" | "className">;

export function SelectField({ id, label, hint, error, optional, className, children, ...rest }: SelectProps) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-required={required(optional)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, hint, error })}
          className={cx(control, "h-12 appearance-none pr-10")}
          {...rest}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink/60"
          fill="none"
        >
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Shell>
  );
}
