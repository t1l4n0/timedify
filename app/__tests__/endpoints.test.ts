import type { LoaderFunctionArgs } from "@remix-run/node";
import { createStaticHandler } from "@remix-run/router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateAdminMock = vi.fn();

vi.mock("~/shopify.server", () => ({
  authenticate: {
    admin: authenticateAdminMock,
  },
}));

type Loader = (args: LoaderFunctionArgs) => Promise<Response> | Response;

async function invokeLoader(path: string, loader: Loader) {
  const normalizedPath = path.replace(/^\//, "");
  const routeId = `test:${normalizedPath}`;
  const handler = createStaticHandler([
    {
      id: routeId,
      path: normalizedPath,
      loader,
    },
  ]);

  const request = new Request(`http://localhost${path}`);
  const result = await handler.queryRoute(request, { routeId });
  if (result instanceof Response) {
    return result;
  }

  return Response.json(result);
}

describe("Core Endpoints", () => {
  beforeEach(() => {
    authenticateAdminMock.mockClear();
    authenticateAdminMock.mockResolvedValue(undefined);
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
    const response = await invokeLoader("/api/ping", pingLoader);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({ ok: true });
    expect(typeof data.ts).toBe("number");
    expect(authenticateAdminMock).toHaveBeenCalled();
  });
});
