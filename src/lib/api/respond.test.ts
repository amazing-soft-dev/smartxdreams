import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MAX_BODY_BYTES, fail, ok, rateLimited, readJson } from "./respond";

const schema = z.object({ email: z.email("Enter an email address.") });
const post = (body: string, type = "application/json") =>
  new Request("http://localhost/api/x", { method: "POST", headers: { "Content-Type": type }, body });

describe("responses", () => {
  it("use one JSON shape and are never cached", async () => {
    const success = ok();
    expect(await success.json()).toEqual({ ok: true });
    expect(success.headers.get("Cache-Control")).toBe("no-store");
    const failure = fail(400, "invalid_input", "Some fields need attention.", { fields: { email: "Bad" } });
    expect(failure.status).toBe(400);
    expect(await failure.json()).toEqual({
      ok: false,
      error: { code: "invalid_input", message: "Some fields need attention.", fields: { email: "Bad" } },
    });
  });

  it("send Retry-After with 429", () => {
    const response = rateLimited(42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
  });
});

describe("readJson", () => {
  const status = async (request: Request) => {
    const result = await readJson(request, schema);
    return "response" in result ? result.response.status : 200;
  };

  it("returns the validated data", async () => {
    expect(await readJson(post('{"email":"ann@example.com"}'), schema)).toEqual({ data: { email: "ann@example.com" } });
  });

  it("answers 415, 400 and 413 for bodies it cannot use", async () => {
    expect(await status(post("email=x", "text/plain"))).toBe(415);
    expect(await status(post("{oops"))).toBe(400);
    expect(await status(post(JSON.stringify({ email: "x".repeat(MAX_BODY_BYTES) })))).toBe(413);
  });

  it("returns field errors for invalid input", async () => {
    const result = await readJson(post('{"email":"nope"}'), schema);
    expect("response" in result && (await result.response.json())).toEqual({
      ok: false,
      error: { code: "invalid_input", message: "Some fields need attention.", fields: { email: "Enter an email address." } },
    });
  });
});
