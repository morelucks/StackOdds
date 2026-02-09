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
});
