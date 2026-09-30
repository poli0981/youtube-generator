import type { Env } from "./env";
import { handleRequest } from "./router";

/**
 * Cloudflare Worker entry for https://ytgenerator.stream — the Turnstile gate
 * and security headers in front of the static web build. Routing lives in
 * ./router.ts so it can be tested without the Workers runtime.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env, {
      now: () => Date.now(),
      fetch: (input, init) => fetch(input, init),
      randomId: () => crypto.randomUUID(),
    });
  },
};
