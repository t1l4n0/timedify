import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loader } from "../api.ping";
import { createHmac, randomUUID } from "node:crypto";
import { __resetValidateSessionTokenCache } from "~/utils/validateSessionToken.server";

const TEST_API_KEY = "testApiKey";
const TEST_API_SECRET = "testApiSecretKey";
const TEST_APP_URL = "https://my-test-app.myshopify.io";
const TEST_SHOP = "sample-shop.myshopify.com";

function base64UrlEncode(value: Record<string, unknown> | string) {
  const data = typeof value === "string" ? value : JSON.stringify(value);
  return Buffer.from(data).toString("base64url");
}

function createSessionToken(secret: string) {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode({
    iss: `https://${TEST_SHOP}/admin`,
    dest: `https://${TEST_SHOP}/admin`,
    aud: TEST_API_KEY,
    sub: TEST_SHOP,
    exp: now + 60,
    nbf: now - 10,
    iat: now - 10,
    jti: randomUUID(),
    sid: randomUUID(),
  });

  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SHOPIFY_API_KEY = TEST_API_KEY;
  process.env.SHOPIFY_API_SECRET = TEST_API_SECRET;
  process.env.SHOPIFY_APP_URL = TEST_APP_URL;
  process.env.SCOPES = "read_products";
  __resetValidateSessionTokenCache();
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
  __resetValidateSessionTokenCache();
});

describe("api.ping loader", () => {
  it("returns 200 for requests with a valid token", async () => {
    const token = createSessionToken(TEST_API_SECRET);
    const request = new Request("http://localhost/api/ping", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await loader({ request } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("throws 401 for requests without a token", async () => {
    const request = new Request("http://localhost/api/ping");

    await expect(loader({ request } as any)).rejects.toMatchObject({
      status: 401,
      statusText: "Unauthorized",
    });
  });
});
