"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formsCanSend } from "@/lib/forms/availability";
import { type ContactField, contactFields, contactLimits, contactSchema, contactTopics, fieldErrors } from "@/lib/forms/contact";
import type { FormResponse } from "@/lib/forms/response";
import { SelectField, TextAreaField, TextField } from "./Field";

type Status =
  | { kind: "idle" }
  | { kind: "invalid"; count: number }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "failed"; message: string }
  | { kind: "unavailable" };

type Errors = Partial<Record<ContactField, string>>;

/** A product the message can be about: just what the select needs, so product copy stays out of the bundle. */
export type ProductOption = { slug: string; name: string };

type ContactFormProps = {
  products: ProductOption[];
  /** Preselects a product (from ?product= on the URL) and sets the topic to a product question. */
  defaultProduct?: string;
};

const isField = (name: string): name is ContactField => (contactFields as string[]).includes(name);

/**
 * The contact form. It validates on submit with the shared schema, shows each error under its field
 * (tied with aria-describedby and aria-invalid), moves focus to the first invalid field and announces a
 * summary in a polite live region. A fixed field re-checks as you type, so its error clears straight away.
 *
 * Spam guards travel with the message for the API to check: a honeypot field people never see, and how long
 * the form was open before sending. In the static export nothing is sent and the form says so.
 */
export function ContactForm({ products, defaultProduct }: ContactFormProps) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const startedAt = useRef(0);
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.kind === "sent") sentRef.current?.focus();
  }, [status.kind]);

  const fieldId = (field: string) => `${id}-${field}`;

  /** Re-check a field that already shows an error, so the message goes away once it is fixed. */
  const onChange = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement;
    if (!isField(target.name) || !errors[target.name]) return;
    const result = contactSchema.shape[target.name].safeParse(target.value);
    setErrors((prev) => ({ ...prev, [target.name]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "sending") return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const parsed = contactSchema.safeParse(data);

    if (!parsed.success) {
      const next = fieldErrors<ContactField>(parsed.error);
      setErrors(next);
      setStatus({ kind: "invalid", count: Object.keys(next).length });
      const first = contactFields.find((f) => next[f]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }

    setErrors({});
    if (!formsCanSend) {
      setStatus({ kind: "unavailable" });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          website: typeof data.website === "string" ? data.website : "",
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const body = (await response.json().catch(() => null)) as FormResponse | null;
      if (response.ok && body?.ok) {
        form.reset();
        setStatus({ kind: "sent", email: parsed.data.email });
        return;
      }
      const failure = body && !body.ok ? body.error : null;
      if (failure?.fields) setErrors(Object.fromEntries(Object.entries(failure.fields).filter(([k]) => isField(k))) as Errors);
      setStatus({
        kind: "failed",
        message: failure?.message ?? "We could not send your message. Please try again in a few minutes.",
      });
    } catch {
      setStatus({ kind: "failed", message: "We could not reach the server. Check your connection and try again." });
    }
  };

  if (status.kind === "sent") {
    return (
      <div ref={sentRef} tabIndex={-1} role="status" className="rounded-[22px] bg-canvas p-6 focus:outline-none md:p-8">
        <h3 className="text-h5">Thanks, your message is on its way.</h3>
        <p className="mt-3 text-body text-ink/75">
          A person will read it and reply to <span className="font-medium text-ink">{status.email}</span>.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 text-label font-medium text-ink underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  const live =
    status.kind === "invalid"
      ? `${status.count === 1 ? "One field needs" : `${status.count} fields need`} attention before the message can be sent.`
      : status.kind === "sending"
        ? "Sending your message…"
        : status.kind === "failed"
          ? status.message
          : status.kind === "unavailable"
            ? "Nothing was sent: this copy of the site cannot send messages."
            : "";

  return (
    <form noValidate onSubmit={onSubmit} onChange={onChange} aria-describedby={`${id}-status`} className="relative flex flex-col gap-6">
      {formsCanSend ? null : (
        <p className="rounded-[14px] bg-canvas px-4 py-3 text-label text-ink">
          This is a static copy of the site, so this form cannot send messages. You can still fill it in, but nothing will leave your
          browser.
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id={fieldId("name")}
          name="name"
          label="Your name"
          autoComplete="name"
          maxLength={contactLimits.name}
          error={errors.name}
        />
        <TextField
          id={fieldId("email")}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          hint="We reply to this address."
          error={errors.email}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField id={fieldId("topic")} name="topic" label="Topic" defaultValue={defaultProduct ? "product" : ""} error={errors.topic}>
          <option value="" disabled>
            Choose a topic
          </option>
          {contactTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          id={fieldId("product")}
          name="product"
          label="Product"
          optional
          defaultValue={defaultProduct ?? ""}
          error={errors.product}
        >
          <option value="">Not about one product</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        id={fieldId("message")}
        name="message"
        label="Message"
        maxLength={contactLimits.message}
        hint="Up to 5,000 characters. Please leave out passwords, card numbers and health details."
        error={errors.message}
      />

      {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={fieldId("website")}>Leave this field empty</label>
        <input id={fieldId("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-label text-ink/65">
          We use your details only to reply. See the{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
        <Button type="submit" variant="ink" aria-disabled={status.kind === "sending" ? true : undefined}>
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
      <p
        id={`${id}-status`}
        role="status"
        className={
          status.kind === "failed" || status.kind === "invalid" ? "text-label font-medium text-coral-800" : "text-label text-ink/75"
        }
      >
        {live}
      </p>
    </form>
  );
}
