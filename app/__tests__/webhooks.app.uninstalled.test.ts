import { describe, it, expect, vi, beforeEach } from "vitest";

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
      webhook: vi.fn().mockImplementation(async (request) => {
        // Simuliert echte Shopify-Authentifizierung
        const hmac = request.headers.get("X-Shopify-Hmac-Sha256");
        if (!hmac) {
          throw new Error("No HMAC header");
        }
        return { 
          topic: "APP/UNINSTALLED", 
          shop: testShop,
          payload: { id: 123 }
        };
      }),
    },
  };
});

import { action } from "../routes/webhooks.app.uninstalled";

describe("webhooks.app.uninstalled", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("cleans up shop data on uninstall", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ id: 123 }),
      headers: { 
        "Content-Type": "application/json",
        "X-Shopify-Hmac-Sha256": "test-hmac-signature" // Simuliert echten Shopify-Webhook
      },
    });

    const response = await action({ request } as any);

    expect(response.status).toBe(200);
    
    // Warte kurz, damit die asynchrone Verarbeitung abgeschlossen werden kann
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { shop: testShop } });
    expect(transactionMock).toHaveBeenCalledOnce();
  });

  it("returns 200 for test requests without HMAC", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ id: 123 }),
      headers: { "Content-Type": "application/json" },
      // Kein HMAC-Header = Test-Request
    });

    const response = await action({ request } as any);

    expect(response.status).toBe(200);
    // Bei Test-Requests ohne HMAC sollte keine Datenlöschung stattfinden
    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

