import { describe, it, expect, vi } from "vitest";

var testShop: string;

var deleteManyMock: ReturnType<typeof vi.fn>;
var transactionMock: ReturnType<typeof vi.fn>;
vi.mock("../db.server", () => {
  deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
  transactionMock = vi.fn(async (operations: Promise<unknown>[]) => {
    // simulate prisma.$transaction by awaiting all provided promises
    await Promise.all(operations);
  });
  return {
    __esModule: true,
    default: {
      session: { deleteMany: deleteManyMock },
      $transaction: transactionMock,
    },
  };
});

vi.mock("../shopify.server", () => {
  testShop = "test-shop.myshopify.com";
  return {
    authenticate: {
      webhook: vi
        .fn()
        .mockResolvedValue({ topic: "APP_UNINSTALLED", shop: testShop }),
    },
  };
});

import { action } from "../routes/webhooks.app.uninstalled";

describe("webhooks.app.uninstalled", () => {
  it("cleans up shop data on uninstall", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ id: 123 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await action({ request } as any);

    expect(response.status).toBe(200);
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { shop: testShop } });
    expect(transactionMock).toHaveBeenCalledOnce();
  });
});

