import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;

describe("Security & Compliance Tests", () => {
  it("should blacklist user successfully", () => {
    const { result } = simnet.callPublicFn(
      "contract",
      "set-blacklist",
      [Cl.principal(user1), Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should prevent blacklisted user from trading", () => {
    simnet.callPublicFn(
      "contract",
      "set-blacklist",
      [Cl.principal(user1), Cl.bool(true)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "contract",
      "buy-yes",
      [Cl.uint(1), Cl.uint(100), Cl.stringAscii("US")],
      user1
    );
    expect(result).toBeErr(Cl.uint(2012)); // ERR_BLACKLISTED
  });
});
