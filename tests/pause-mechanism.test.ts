import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Pause Mechanism Tests", () => {
  it("should enable emergency pause", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "set-emergency-pause",
      [Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should block trading when emergency paused", () => {
    simnet.callPublicFn("contract", "set-emergency-pause", [Cl.bool(true)], deployer);

    const { result } = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(100), Cl.stringAscii("US")],
      user1
    );
    expect(result).toBeErr(Cl.uint(2017)); // ERR_MARKET_PAUSED
  });

  it("should pause individual market", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "set-market-pause",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should block trading on paused market only", () => {
    simnet.callPublicFn("contract", "set-market-pause", [Cl.uint(1), Cl.bool(true)], deployer);

    const result1 = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(100), Cl.stringAscii("US")],
      user1
    );
    expect(result1.result).toBeErr(Cl.uint(2017)); // ERR_MARKET_PAUSED

    const result2 = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(2), Cl.uint(100), Cl.stringAscii("US")],
      user1
    );
    expect(result2.result).toBeOk(); // Market 2 should work
  });
});
