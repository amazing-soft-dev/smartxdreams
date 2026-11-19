"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { currentProductSlug } from "@/content/products/retired";
import { formsCanSend } from "@/lib/forms/availability";
import type { FormResponse } from "@/lib/forms/response";
import { tokenFromLocation } from "@/lib/forms/waitlist-link";

type ProductName = { slug: string; name: string };

type State =
  | { kind: "ready" }
  | { kind: "sending" }
  | { kind: "confirmed" }
  | { kind: "expired"; message: string }
  | { kind: "failed"; message: string };

/**
 * The address's fragment (#token=…), which only the browser has: it is never sent to the server. Null means
 * "not known yet" (a server render, and the first pass of hydration), so the two never disagree.
 */
function useLocationHash(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash,
    () => null,
  );
}

/** Reads the product and address from the token so the page can say what is being confirmed. Not trusted: the API verifies the signature. */
function peek(token: string | null): { email: string; product: string } | null {
  const data = token?.split(".")[0];
  if (!data) return null;
  try {
    const json = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/"))) as { e?: unknown; p?: unknown };
    return typeof json.e === "string" && typeof json.p === "string" ? { email: json.e, product: json.p } : null;
  } catch {
    return null;
  }
}

/**
 * The confirm step of double opt-in. Nothing happens until the person presses Confirm, so a mail scanner
 * opening the link cannot sign anyone up. Every outcome is announced in a live region and focused.
 */
export function ConfirmWaitlist({ products }: { products: ProductName[] }) {
  // The link carries the token in the fragment; links emailed before that have it in the query string.
  const search = useSearchParams();
  const hash = useLocationHash();
  const token = hash === null ? null : tokenFromLocation(hash, search.toString());
  const info = peek(token);
  // Links emailed before a product was renamed carry its old slug.
  const product = info && products.find((p) => p.slug === currentProductSlug(info.product));
  const [state, setState] = useState<State>({ kind: "ready" });
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.kind !== "ready" && state.kind !== "sending") resultRef.current?.focus();
  }, [state.kind]);

  // Not known yet is not "incomplete": say nothing until the browser has read the address.
  if (hash === null) return null;

  if (!info || !product) {
    return (
      <Message title="This link is not complete">
        Open the whole link from the confirmation email, or join the waitlist again from a{" "}
        <Link href="/products" className="font-medium text-ink underline underline-offset-4">
          product page
        </Link>
        .
      </Message>
    );
  }

  if (!formsCanSend) {
    return (
      <Message title="Confirm on the live site">
        This is a static copy of the site, so it cannot confirm sign-ups. Open the link from your email on the live site.
      </Message>
    );
  }

  const confirm = async () => {
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/waitlist/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json().catch(() => null)) as FormResponse | null;
      if (response.ok && body?.ok) return setState({ kind: "confirmed" });
      const message = body && !body.ok ? body.error.message : "We could not confirm your place. Please try again in a few minutes.";
      setState(response.status === 410 ? { kind: "expired", message } : { kind: "failed", message });
    } catch {
      setState({ kind: "failed", message: "We could not reach the server. Check your connection and try again." });
    }
  };

  if (state.kind === "confirmed") {
    return (
      <Message ref={resultRef} title={`You are on the ${product.name} waitlist`}>
        We will email <span className="font-medium text-ink">{info.email}</span> when early access opens. Every email has a link to leave
        the list.
      </Message>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-h3">Confirm your place on the {product.name} waitlist</h1>
      <p className="mx-auto mt-4 max-w-md text-body-l text-ink/75">
        For <span className="font-medium text-ink">{info.email}</span>. Press the button to confirm. Until you do, you are not on the list.
      </p>
      <div className="mt-8 flex justify-center">
        <Button type="button" variant="ink" onClick={confirm} aria-disabled={state.kind === "sending" ? true : undefined}>
          {state.kind === "sending" ? "Confirming…" : "Confirm"}
        </Button>
      </div>
      <div ref={resultRef} tabIndex={-1} role="status" className="mt-6 min-h-6 text-label focus:outline-none">
        {state.kind === "expired" || state.kind === "failed" ? (
          <p className="font-medium text-coral-800">
            {state.message}{" "}
            {state.kind === "expired" ? (
              <Link href={`/products/${product.slug}`} className="text-ink underline underline-offset-4">
                Go to {product.name}
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Message({ title, children, ref }: { title: string; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} tabIndex={-1} role="status" className="text-center focus:outline-none">
      <h1 className="text-h3">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-body-l text-ink/75">{children}</p>
    </div>
  );
}
