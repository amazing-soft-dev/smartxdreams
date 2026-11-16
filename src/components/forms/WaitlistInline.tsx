"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

/**
 * Inline email field for the closing call to action. Until the waitlist API lands (issues #52 and #53),
 * submitting does not send anything: it says so plainly and points to the product pages, where each
 * product will have its own waitlist.
 */
export function WaitlistInline() {
  const inputId = useId();
  const statusId = useId();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-md text-left" aria-describedby={statusId}>
      <label htmlFor={inputId} className="text-label font-medium text-white">
        Email address
      </label>
      <div className="mt-2 flex gap-2 rounded-[18px] bg-white/10 p-1.5 ring-1 ring-white/15 focus-within:ring-violet-300">
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 bg-transparent px-3 text-body text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-[14px] bg-coral-500 px-5 text-label font-medium text-ink transition-colors hover:bg-coral-400"
        >
          Notify me
        </button>
      </div>
      <p id={statusId} role="status" className="mt-3 min-h-6 text-label text-white/65">
        {submitted ? (
          <>
            Sign-up is not open here yet, so nothing was sent.{" "}
            <Link href="/products" className="text-violet-300 underline underline-offset-4">
              Choose a product
            </Link>{" "}
            to join its waitlist.
          </>
        ) : null}
      </p>
    </form>
  );
}
