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
});
