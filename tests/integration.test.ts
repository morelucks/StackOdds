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

  it("should handle LP and trading together", () => {
    // Add liquidity
    const addLiq = simnet.callPublicFn(
      "contract",
      "add-liquidity",
      [Cl.uint(1), Cl.uint(2000)],
      trader1
    );
    expect(addLiq.result).toBeOk();

    // Trade on market
    const trade = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(100), Cl.stringAscii("US")],
      trader2
    );
    expect(trade.result).toBeOk();

    // Remove liquidity
    const removeLiq = simnet.callPublicFn(
      "contract",
      "remove-liquidity",
      [Cl.uint(1), Cl.uint(1000)],
      trader1
    );
    expect(removeLiq.result).toBeOk();
  });

  it("should handle fees and pause together", () => {
    // Set fee rate
    simnet.callPublicFn("contract", "set-trading-fee-rate", [Cl.uint(50000)], deployer);

    // Trade to collect fees
    simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(1000), Cl.stringAscii("US")],
      trader1
    );

    // Check fees collected
    const fees = simnet.callReadOnlyFn("contract", "get-protocol-fees", [], deployer);
    expect(fees.result).toBeOk();

    // Pause market
    simnet.callPublicFn("contract", "set-market-pause", [Cl.uint(1), Cl.bool(true)], deployer);

    // Try to trade (should fail)
    const pausedTrade = simnet.callPublicFn(
      "contract",
      "buy-no",
      [Cl.uint(1), Cl.uint(100), Cl.stringAscii("US")],
      trader2
    );
    expect(pausedTrade.result).toBeErr(Cl.uint(2017));
  });
});
