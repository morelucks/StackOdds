import { beforeEach, describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Trading Fee Tests", () => {
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
          Cl.stringAscii("Fee market"),
          Cl.stringAscii("fee-1")
        ],
        deployer
      );
    }
  };

  beforeEach(() => {
    ensureMarket();
  });

  it("should set trading fee rate", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "set-trading-fee-rate",
      [Cl.uint(20000)], // 2%
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should collect fees on buy transactions", () => {
    const feesBefore = simnet.callReadOnlyFn("contract", "get-protocol-fees", [], deployer);
    
    simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(1000), Cl.stringAscii("US")],
      user1
    );

    const feesAfter = simnet.callReadOnlyFn("contract", "get-protocol-fees", [], deployer);
    expect(feesAfter).toBeGreaterThan(feesBefore);
  });

  it("should allow owner to withdraw protocol fees", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "withdraw-protocol-fees",
      [Cl.uint(100)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should prevent non-owner from withdrawing fees", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "withdraw-protocol-fees",
      [Cl.uint(100)],
      user1
    );
    expect(result).toBeErr(Cl.uint(2001)); // ERR_UNAUTHORIZED
  });
});
