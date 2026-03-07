import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Dynamic Pricing Tests", () => {
  it("should calculate buy cost using LMSR", () => {
    const { result } = simnet.callReadOnlyFn(
      "contract",
      "get-buy-cost",
      [Cl.uint(1), Cl.uint(1), Cl.uint(100)],
      user1
    );
    expect(result).toBeOk();
  });

  it("should calculate sell payout using LMSR", () => {
    const { result } = simnet.callReadOnlyFn(
      "contract",
      "get-sell-payout",
      [Cl.uint(1), Cl.uint(1), Cl.uint(50)],
      user1
    );
    expect(result).toBeOk();
  });

  it("should calculate market prices", () => {
    const priceYes = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(1)],
      user1
    );
    expect(priceYes.result).toBeOk();

    const priceNo = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(0)],
      user1
    );
    expect(priceNo.result).toBeOk();
  });

  it("should have prices sum to approximately 1", () => {
    const priceYes = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(1)],
      user1
    );
    const priceNo = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(0)],
      user1
    );
    
    // Prices should sum to ~1000000 (scaled by 1e6)
    const sum = priceYes.result + priceNo.result;
    expect(sum).toBeCloseTo(1000000, 1000);
  });

  it("should increase price when buying", () => {
    const priceBefore = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(1)],
      user1
    );

    simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(1000), Cl.stringAscii("US")],
      user1
    );

    const priceAfter = simnet.callReadOnlyFn(
      "contract",
      "get-price",
      [Cl.uint(1), Cl.uint(1)],
      user1
    );

    expect(priceAfter.result).toBeGreaterThan(priceBefore.result);
  });
});
