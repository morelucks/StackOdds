import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const trader1 = accounts.get("wallet_1")!;
const trader2 = accounts.get("wallet_2")!;

describe("Integration Tests", () => {
  it("should handle complete market lifecycle", () => {
    // Create market
    const createResult = simnet.callPublicFn(
      "contract",
      "create-market",
      [
        Cl.uint(1000),
        Cl.uint(100),
        Cl.uint(1000),
        Cl.stringAscii("Integration test market"),
        Cl.stringAscii("int-1")
      ],
      deployer
    );
    expect(createResult.result).toBeOk();

    // Buy YES shares
    const buyYes = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(500), Cl.stringAscii("US")],
      trader1
    );
    expect(buyYes.result).toBeOk();

    // Buy NO shares
    const buyNo = simnet.callPublicFn(
      "contract",
      "buy-no",
      [Cl.uint(1), Cl.uint(300), Cl.stringAscii("US")],
      trader2
    );
    expect(buyNo.result).toBeOk();

    // Advance time and resolve
    simnet.mineEmptyBlocks(1200);
    const resolve = simnet.callPublicFn(
      "contract",
      "resolve-market",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(resolve.result).toBeOk(Cl.bool(true));

    // Claim winnings
    const claim = simnet.callPublicFn(
      "contract",
      "claim",
      [Cl.uint(1)],
      trader1
    );
    expect(claim.result).toBeOk();
  });
});
