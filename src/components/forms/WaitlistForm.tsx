"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { formsCanSend } from "@/lib/forms/availability";
import { fieldErrors } from "@/lib/forms/contact";
import type { FormResponse } from "@/lib/forms/response";
import { type WaitlistField, waitlistConsent, waitlistSchema } from "@/lib/forms/waitlist";

export type WaitlistProductOption = { slug: string; name: string };

type WaitlistFormProps = {
  /** The product this form signs up for. Omit to show a product select (the site-wide call to action). */
  product?: WaitlistProductOption;
  /** Options for the product select when no product is fixed. */
  products?: WaitlistProductOption[];
};

type Status =
  | { kind: "idle" }
  | { kind: "invalid"; count: number }
  | { kind: "submitting" }
  | { kind: "sent"; email: string; productName: string }
  | { kind: "failed"; message: string };

type Errors = Partial<Record<WaitlistField, string>>;

/** Field order on the page: the first field with an error gets focus. */
const order: WaitlistField[] = ["product", "email", "consent"];
const isField = (name: string): name is WaitlistField => (order as string[]).includes(name);

/** An error under a field, on the dark surface: coral-300 text (8:1 on ink) and an icon, not colour alone. */
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-label font-medium text-coral-300">
      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" className="mt-0.5 shrink-0" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5v4.25M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}

/**
 * Joins a product waitlist (POST /api/waitlist, double opt-in). Built for dark sections.
 *
 * States: idle, submitting (the button says so and ignores repeat presses), sent (the form is replaced by
 * "check your inbox", because the person is only on the list after confirming the email), and failed (the
 * server's message, with everything typed kept so they can try again).
 *
 * Errors: the form checks with the same schema as the API, shows each error under its field (aria-invalid
 * plus aria-describedby), moves focus to the first invalid field, and clears an error as soon as the field is
 * fixed. A polite live region announces every state change; the "check your inbox" panel takes focus.
 *
 * In the static export (no server) it shows a short note instead of a form that could only fail.
 */
export function WaitlistForm({ product, products = [] }: WaitlistFormProps) {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Errors>({});
  const startedAt = useRef(0);
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.kind === "sent") sentRef.current?.focus();
  }, [status.kind]);

  const fieldId = (field: string) => `${id}-${field}`;
  const describedBy = (field: WaitlistField, hint?: string) =>
    [errors[field] ? `${fieldId(field)}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;

  /** Values as the schema expects them; a fixed product comes from props, not the form. */
  const read = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return {
      email: String(data.get("email") ?? ""),
      product: product?.slug ?? String(data.get("product") ?? ""),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };
  };

  /** Re-checks a field that shows an error, so the message goes away once it is fixed. */
  const onChange = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name;
    if (!isField(name) || !errors[name]) return;
    const values = read(event.currentTarget);
    const result = waitlistSchema.shape[name].safeParse(values[name]);
    setErrors((prev) => ({ ...prev, [name]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "submitting") return;
    const values = read(event.currentTarget);
    const parsed = waitlistSchema.safeParse(values);
    if (!parsed.success) {
      const next = fieldErrors<WaitlistField>(parsed.error);
      setErrors(next);
      setStatus({ kind: "invalid", count: Object.keys(next).length });
      const first = order.find((f) => next[f] && (f !== "product" || !product));
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    setErrors({});
    const productName = product?.name ?? products.find((p) => p.slug === parsed.data.product)?.name ?? "this product";

    setStatus({ kind: "submitting" });
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          consentVersion: waitlistConsent.version,
          website: values.website,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const body = (await response.json().catch(() => null)) as FormResponse | null;
      if (response.ok && body?.ok) {
        setStatus({ kind: "sent", email: parsed.data.email, productName });
        return;
      }
      const failure = body && !body.ok ? body.error : null;
      // Field errors from the server go under their fields; anything else (e.g. a changed consent version) is the status message.
      const fields = Object.fromEntries(Object.entries(failure?.fields ?? {}).filter(([k]) => isField(k))) as Errors;
      setErrors(fields);
      const other = Object.entries(failure?.fields ?? {}).find(([k]) => !isField(k))?.[1];
      setStatus({
        kind: "failed",
        message: other ?? failure?.message ?? "We could not add you to the list. Please try again in a few minutes.",
      });
    } catch {
      setStatus({ kind: "failed", message: "We could not reach the server. Check your connection and try again." });
    }
  };

  // The static export has no server, so there is nothing to send to: say so plainly instead of a form that fails.
  if (!formsCanSend) {
    return (
      <div role="note" className="mt-8 w-full max-w-md rounded-[22px] bg-white/10 px-6 py-5 text-left ring-1 ring-white/15">
        <p className="text-body-l font-medium text-white">Sign-up is off on this copy of the site</p>
        <p className="mt-2 text-body text-white/75">
          This is a static copy without a server, so it cannot add anyone to a waitlist. Join{" "}
          {product ? `the ${product.name} waitlist` : "a waitlist"} on the live SmartxDreams site.
        </p>
      </div>
    );
  }

  if (status.kind === "sent") {
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className="mt-8 w-full max-w-md rounded-[22px] bg-white/10 px-6 py-5 text-left ring-1 ring-white/15 focus:outline-none"
      >
        <p className="text-body-l font-medium text-white">Check your inbox</p>
        <p className="mt-2 text-body text-white/75">
          We sent a link to <span className="font-medium text-white">{status.email}</span>. Open it and press Confirm to join the{" "}
          {status.productName} waitlist. The link works for 7 days.
        </p>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const live =
    status.kind === "invalid"
      ? `${status.count === 1 ? "One field needs" : `${status.count} fields need`} attention.`
      : status.kind === "submitting"
        ? "Joining the waitlist…"
        : status.kind === "failed"
          ? status.message
          : "";

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onChange={onChange}
      aria-describedby={`${id}-status`}
      className="relative mt-8 flex w-full max-w-md flex-col gap-4 text-left"
    >
      {product ? null : (
        <div className="flex flex-col">
          <label htmlFor={fieldId("product")} className="text-label font-medium text-white">
            Product
          </label>
          <select
            id={fieldId("product")}
            name="product"
            defaultValue=""
            aria-invalid={errors.product ? true : undefined}
            aria-describedby={describedBy("product")}
            className="mt-2 h-12 rounded-[14px] bg-white/10 px-4 text-body text-white ring-1 ring-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 aria-invalid:ring-2 aria-invalid:ring-coral-300"
          >
            <option value="" disabled className="text-ink">
              Choose a product
            </option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug} className="text-ink">
                {p.name}
              </option>
            ))}
          </select>
          {errors.product ? <FieldError id={`${fieldId("product")}-error`}>{errors.product}</FieldError> : null}
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor={fieldId("email")} className="text-label font-medium text-white">
          Email address
        </label>
        {/* The resting outline is white at 40%, 3.8:1 on ink. It is set only while the field is valid: beside
            ring-coral-300 it would win the cascade and hide the invalid colour. */}
        <div
          className={`mt-2 flex gap-2 rounded-[18px] bg-white/10 p-1.5 focus-within:ring-2 focus-within:ring-violet-300 ${errors.email ? "ring-2 ring-coral-300" : "ring-1 ring-white/40"}`}
        >
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            // Placeholder: white at 50% is 4.73:1 over the field's fill (white at 10% on ink).
            className="min-w-0 flex-1 bg-transparent px-3 text-body text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            aria-disabled={submitting ? true : undefined}
            className="h-11 shrink-0 rounded-[14px] bg-coral-500 px-5 text-label font-medium text-ink transition-colors hover:bg-coral-400 aria-disabled:opacity-70"
          >
            {submitting ? "Joining…" : "Join the waitlist"}
          </button>
        </div>
        {errors.email ? <FieldError id={`${fieldId("email")}-error`}>{errors.email}</FieldError> : null}
      </div>

      <div>
        <div className="flex gap-3">
          <input
            id={fieldId("consent")}
            name="consent"
            type="checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy("consent")}
            className="mt-1 size-5 shrink-0 accent-violet-300"
          />
          <label htmlFor={fieldId("consent")} className="text-label text-white/75">
            {waitlistConsent.text}{" "}
            <Link href="/privacy" className="text-white underline underline-offset-4">
              Privacy policy
            </Link>
          </label>
        </div>
        {errors.consent ? <FieldError id={`${fieldId("consent")}-error`}>{errors.consent}</FieldError> : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={fieldId("website")}>Leave this field empty</label>
        <input id={fieldId("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <p
        id={`${id}-status`}
        role="status"
        className={
          status.kind === "failed" || status.kind === "invalid" ? "text-label font-medium text-coral-300" : "text-label text-white/70"
        }
      >
        {live}
      </p>
    </form>
  );
}
