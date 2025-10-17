import type { LoaderFunction } from "@remix-run/node";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateAdminMock = vi.fn();
const validateSessionTokenMock = vi.fn();

vi.mock("~/shopify.server", () => ({
  authenticate: {
    admin: authenticateAdminMock,
  },
}));

vi.mock("~/utils/validateSessionToken.server", () => ({
  validateSessionToken: validateSessionTokenMock,
}));

async function invokeLoader(path: string, loader: LoaderFunction, init?: RequestInit) {
  const request = new Request(`http://localhost${path}`, init);
  const result = await loader({
    request,
    params: {},
    context: undefined as never,
  });

  if (result instanceof Response) {
    return result;
  }

  return Response.json(result);
}

describe("Core Endpoints", () => {
  beforeEach(() => {
    authenticateAdminMock.mockClear();
    authenticateAdminMock.mockResolvedValue(undefined);
    validateSessionTokenMock.mockClear();
    validateSessionTokenMock.mockResolvedValue({});
  });

  it("health loader returns ok response", async () => {
    const { loader: healthLoader } = await import("~/routes/health");
    const response = await invokeLoader("/health", healthLoader);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({ status: "ok" });
    expect(typeof data.timestamp).toBe("string");
    expect(() => new Date(data.timestamp).toISOString()).not.toThrow();
  });

  it("api ping loader returns ok payload", async () => {
    const { loader: pingLoader } = await import("~/routes/api.ping");
    const response = await invokeLoader("/api/ping", pingLoader, {
      headers: {
        Authorization: "Bearer test-token",
      },
    });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({ ok: true });
    expect(typeof data.ts).toBe("number");
    expect(validateSessionTokenMock).toHaveBeenCalledWith(expect.any(Request));
  });
});
