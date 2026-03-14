import { beforeEach, describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const lp1 = accounts.get("wallet_1")!;
const lp2 = accounts.get("wallet_2")!;

describe("Liquidity Provider Tests", () => {
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
          Cl.stringAscii("LP market"),
          Cl.stringAscii("lp-1")
        ],
        deployer
      );
    }
  };

  beforeEach(() => {
    ensureMarket();
  });

  it("should allow adding liquidity", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "add-liquidity",
      [Cl.uint(1), Cl.uint(1000)],
      lp1
    );
    expect(result).toBeOk();
  });

  it("should track LP shares correctly", () => {
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp1);

    const { result } = simnet.callReadOnlyFn(
      "contract",
      "get-lp-shares",
      [Cl.uint(1), Cl.principal(lp1)],
      lp1
    );
    expect(result).toBeOk(Cl.uint(1000));
  });

  it("should allow multiple LPs to add liquidity", () => {
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp1);
    const { result } = simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(500)], lp2);
    expect(result).toBeOk();
  });

  it("should calculate proportional LP shares", () => {
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp1);
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp2);

    const totalShares = simnet.callReadOnlyFn(
      "contract",
      "get-total-lp-shares",
      [Cl.uint(1)],
      deployer
    );
    expect(totalShares.result).toBeOk(Cl.uint(2000));
  });

  it("should allow removing liquidity", () => {
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp1);

    const { result } = simnet.callPublicFn(
      "contract",
      "remove-liquidity",
      [Cl.uint(1), Cl.uint(500)],
      lp1
    );
    expect(result).toBeOk();
  });

  it("should prevent removing more shares than owned", () => {
    simnet.callPublicFn("contract", "add-liquidity", [Cl.uint(1), Cl.uint(1000)], lp1);

    const { result } = simnet.callPublicFn(
      "contract",
      "remove-liquidity",
      [Cl.uint(1), Cl.uint(2000)],
      lp1
    );
    expect(result).toBeErr(Cl.uint(2006)); // ERR_INSUFFICIENT_SHARES
  });
});
