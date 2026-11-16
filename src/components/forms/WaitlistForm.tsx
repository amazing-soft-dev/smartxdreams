"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { FormResponse } from "@/lib/forms/response";
import { waitlistConsent } from "@/lib/forms/waitlist";

export type WaitlistProductOption = { slug: string; name: string };

type WaitlistFormProps = {
  /** The product this form signs up for. Omit to show a product select (the site-wide call to action). */
  product?: WaitlistProductOption;
  /** Options for the product select when no product is fixed. */
  products?: WaitlistProductOption[];
};

type Status =
  { kind: "idle" } | { kind: "submitting" } | { kind: "sent"; email: string; productName: string } | { kind: "failed"; message: string };

/**
 * Joins a product waitlist (POST /api/waitlist, double opt-in). Built for dark sections.
 *
 * States: idle, submitting (the button says so and ignores repeat presses), sent (the form is replaced by
 * "check your inbox", because the person is only on the list after confirming the email), and failed (the
 * server's message, with everything typed kept so they can try again).
 */
export function WaitlistForm({ product, products = [] }: WaitlistFormProps) {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "submitting") return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const slug = product?.slug ?? String(data.get("product") ?? "");
    const productName = product?.name ?? products.find((p) => p.slug === slug)?.name ?? "this product";

    setStatus({ kind: "submitting" });
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          product: slug,
          consent: data.get("consent") === "on",
          consentVersion: waitlistConsent.version,
          website: String(data.get("website") ?? ""),
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const body = (await response.json().catch(() => null)) as FormResponse | null;
      if (response.ok && body?.ok) {
        setStatus({ kind: "sent", email, productName });
        return;
      }
      setStatus({
        kind: "failed",
        message: body && !body.ok ? body.error.message : "We could not add you to the list. Please try again in a few minutes.",
      });
    } catch {
      setStatus({ kind: "failed", message: "We could not reach the server. Check your connection and try again." });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="mt-8 w-full max-w-md rounded-[22px] bg-white/10 px-6 py-5 text-left ring-1 ring-white/15">
        <p className="text-body-l font-medium text-white">Check your inbox</p>
        <p className="mt-2 text-body text-white/75">
          We sent a link to <span className="font-medium text-white">{status.email}</span>. Open it and press Confirm to join the{" "}
          {status.productName} waitlist. The link works for 7 days.
        </p>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  return (
    <form noValidate onSubmit={onSubmit} className="relative mt-8 flex w-full max-w-md flex-col gap-4 text-left">
      {product ? null : (
        <div className="flex flex-col">
          <label htmlFor={`${id}-product`} className="text-label font-medium text-white">
            Product
          </label>
          <select
            id={`${id}-product`}
            name="product"
            defaultValue=""
            className="mt-2 h-12 rounded-[14px] bg-white/10 px-4 text-body text-white ring-1 ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
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
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor={`${id}-email`} className="text-label font-medium text-white">
          Email address
        </label>
        <div className="mt-2 flex gap-2 rounded-[18px] bg-white/10 p-1.5 ring-1 ring-white/15 focus-within:ring-violet-300">
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="min-w-0 flex-1 bg-transparent px-3 text-body text-white placeholder:text-white/45 focus:outline-none"
          />
          <button
            type="submit"
            aria-disabled={submitting ? true : undefined}
            className="h-11 shrink-0 rounded-[14px] bg-coral-500 px-5 text-label font-medium text-ink transition-colors hover:bg-coral-400 aria-disabled:opacity-70"
          >
            {submitting ? "Joining…" : "Join the waitlist"}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <input id={`${id}-consent`} name="consent" type="checkbox" className="mt-1 size-5 shrink-0 accent-violet-300" />
        <label htmlFor={`${id}-consent`} className="text-label text-white/75">
          {waitlistConsent.text}{" "}
          <Link href="/privacy" className="text-white underline underline-offset-4">
            Privacy policy
          </Link>
        </label>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {status.kind === "failed" ? <p className="text-label font-medium text-coral-300">{status.message}</p> : null}
    </form>
  );
}
