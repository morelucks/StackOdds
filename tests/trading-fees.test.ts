import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Trading Fee Tests", () => {
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
});
