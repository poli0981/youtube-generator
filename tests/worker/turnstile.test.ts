import { describe, it, expect, vi } from "vitest";
import { SITEVERIFY_URL } from "../../worker/env";
import { evaluateSiteverify, parseSiteverify, siteverify } from "../../worker/turnstile";

const NOW = Date.parse("2026-09-30T12:00:00Z");
const good = {
  success: true,
  hostname: "ytgenerator.stream",
  action: "enter",
  challengeTs: "2026-09-30T11:59:00Z",
  errorCodes: [],
  testing: false,
};

describe("evaluateSiteverify", () => {
  it("accepts a fresh token for this hostname and action", () => {
    expect(evaluateSiteverify(good, { hostname: "ytgenerator.stream", nowMs: NOW })).toEqual({
      ok: true,
    });
  });

  it.each([
    [{ ...good, success: false }, "not-success"],
    [{ ...good, hostname: "evil.example" }, "hostname-mismatch"],
    [{ ...good, action: "login" }, "action-mismatch"],
    [{ ...good, challengeTs: undefined }, "missing-timestamp"],
    [{ ...good, challengeTs: "2026-09-30T11:54:00Z" }, "token-too-old"],
  ] as const)("refuses %o with %s", (result, reason) => {
    expect(evaluateSiteverify(result, { hostname: "ytgenerator.stream", nowMs: NOW })).toEqual({
      ok: false,
      reason,
    });
  });
});

describe("test keys", () => {
  it("accepts Cloudflare's dummy answer only when it is flagged as a test result", () => {
    const dummy = parseSiteverify({
      success: true,
      hostname: "example.com",
      challenge_ts: "2026-09-30T11:59:50Z",
      "error-codes": [],
      metadata: { result_with_testing_key: true },
    });
    expect(dummy.testing).toBe(true);
    expect(evaluateSiteverify(dummy, { hostname: "localhost", nowMs: NOW })).toEqual({ ok: true });
    expect(
      evaluateSiteverify({ ...dummy, testing: false }, { hostname: "localhost", nowMs: NOW }),
    ).toEqual({ ok: false, reason: "hostname-mismatch" });
  });

  it("still refuses a failed or stale test result", () => {
    const base = {
      success: true,
      testing: true,
      errorCodes: [],
      challengeTs: "2026-09-30T11:00:00Z",
    };
    expect(evaluateSiteverify(base, { hostname: "x", nowMs: NOW })).toEqual({
      ok: false,
      reason: "token-too-old",
    });
    expect(evaluateSiteverify({ ...base, success: false }, { hostname: "x", nowMs: NOW })).toEqual({
      ok: false,
      reason: "not-success",
    });
  });
});

describe("parseSiteverify", () => {
  it("maps Cloudflare's field names", () => {
    expect(
      parseSiteverify({
        success: true,
        hostname: "h",
        action: "a",
        challenge_ts: "t",
        "error-codes": ["x", 1],
      }),
    ).toEqual({
      success: true,
      hostname: "h",
      action: "a",
      challengeTs: "t",
      errorCodes: ["x"],
      testing: false,
    });
  });

  it("never treats a malformed body as success", () => {
    expect(parseSiteverify(null).success).toBe(false);
    expect(parseSiteverify("yes").success).toBe(false);
    expect(parseSiteverify({ success: "true" }).success).toBe(false);
  });
});

describe("siteverify", () => {
  it("posts secret, token, remote IP and idempotency key", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true }));
    await siteverify(fetchMock as unknown as typeof fetch, {
      secret: "s3cret",
      token: "tok",
      remoteIp: "203.0.113.9",
      idempotencyKey: "idem",
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("s3cret");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.9");
    expect(body.get("idempotency_key")).toBe("idem");
  });

  it("turns HTTP and network failures into a refusal instead of throwing", async () => {
    const httpError = vi.fn(async () => new Response("down", { status: 503 }));
    const networkError = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const params = { secret: "s", token: "t", remoteIp: null, idempotencyKey: "i" };
    await expect(siteverify(httpError as unknown as typeof fetch, params)).resolves.toMatchObject({
      success: false,
      errorCodes: ["http-503"],
    });
    await expect(
      siteverify(networkError as unknown as typeof fetch, params),
    ).resolves.toMatchObject({ success: false, errorCodes: ["network-error"] });
  });
});
