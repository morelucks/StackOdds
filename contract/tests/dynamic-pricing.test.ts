import { beforeEach, describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Dynamic Pricing Tests", () => {
  const ensureMarket = () => {
    const countResult = simnet.callReadOnlyFn("contract", "get-market-count", [], deployer);
    const count = Number((countResult.result as any).value.value);
    if (count === 0) {
      const currentBlock = simnet.blockHeight;
      simnet.callPublicFn(
        "contract",
        "create-market",
        [
          Cl.uint(1000),
          Cl.uint(currentBlock + 10),
          Cl.uint(currentBlock + 100),
          Cl.stringAscii("Dynamic pricing market"),
          Cl.stringAscii("dyn-1")
        ],
        deployer
      );
    }
  };

  beforeEach(() => {
    ensureMarket();
  });

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
    const priceYesValue = Number((priceYes.result as any).value.value);
    const priceNoValue = Number((priceNo.result as any).value.value);
    const sum = priceYesValue + priceNoValue;
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

    const beforeValue = Number((priceBefore.result as any).value.value);
    const afterValue = Number((priceAfter.result as any).value.value);
    expect(afterValue).toBeGreaterThan(beforeValue);
  });
});
