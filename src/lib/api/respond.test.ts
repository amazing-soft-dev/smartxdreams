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

  it("accepts application/json with parameters, in any letter case", async () => {
    for (const type of ["application/json; charset=utf-8", "application/json;charset=UTF-8", "Application/JSON", "application/json ; charset=utf-8"]) {
      expect(await status(post('{"email":"ann@example.com"}', type))).toBe(200);
    }
  });

  it("answers 415 for any other media type, even one that mentions application/json", async () => {
    const types = [
      "text/plain;application/json",
      "text/plain; charset=application/json",
      "application/jsonp",
      "application/json-seq",
      "x-application/json",
      "application/x-www-form-urlencoded",
      "",
    ];
    for (const type of types) {
      expect(await status(post('{"email":"ann@example.com"}', type))).toBe(415);
    }
    const untyped = new Request("http://localhost/api/x", { method: "POST", body: new Blob(['{"email":"ann@example.com"}']) });
    expect(untyped.headers.get("Content-Type")).toBeNull();
    expect(await status(untyped)).toBe(415);
  });

  it("measures the body limit in bytes, not characters", async () => {
    // "é" is one character and two bytes in UTF-8, so this body is over the limit in bytes but under it in
    // characters. These requests carry no Content-Length header, so the body itself is measured.
    const body = JSON.stringify({ email: "ann@example.com", note: "é".repeat(MAX_BODY_BYTES / 2) });
    expect(body.length).toBeLessThan(MAX_BODY_BYTES);
    expect(Buffer.byteLength(body)).toBeGreaterThan(MAX_BODY_BYTES);
    expect(post(body).headers.get("Content-Length")).toBeNull();
    expect(await status(post(body))).toBe(413);

    // The same number of ASCII characters fits.
    const ascii = JSON.stringify({ email: "ann@example.com", note: "e".repeat(MAX_BODY_BYTES / 2) });
    expect(ascii.length).toBe(body.length);
    expect(await status(post(ascii))).toBe(200);
  });

  it("accepts a body of exactly the limit and refuses one byte more", async () => {
    const sized = (bytes: number) => {
      const empty = JSON.stringify({ email: "ann@example.com", note: "" });
      return JSON.stringify({ email: "ann@example.com", note: "x".repeat(bytes - empty.length) });
    };
    expect(await status(post(sized(MAX_BODY_BYTES)))).toBe(200);
    expect(await status(post(sized(MAX_BODY_BYTES + 1)))).toBe(413);
  });

  it("returns field errors for invalid input", async () => {
    const result = await readJson(post('{"email":"nope"}'), schema);
    expect("response" in result && (await result.response.json())).toEqual({
      ok: false,
      error: { code: "invalid_input", message: "Some fields need attention.", fields: { email: "Enter an email address." } },
    });
  });
});
