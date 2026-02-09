import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("Market Duration Tests", () => {
  it("should enforce maximum market duration", () => {
    const startTime = 1000;
    const endTime = startTime + 100000; // Exceeds default max

    const { result } = simnet.callPublicFn(
      "contract",
      "create-market",
      [
        Cl.uint(1000),
        Cl.uint(startTime),
        Cl.uint(endTime),
        Cl.stringAscii("Will it happen?"),
        Cl.stringAscii("market-1")
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(2015)); // ERR_DURATION_EXCEEDED
  });

  it("should allow market within duration limit", () => {
    const startTime = 1000;
    const endTime = startTime + 10000; // Within limit

    const { result } = simnet.callPublicFn(
      "contract",
      "create-market",
      [
        Cl.uint(1000),
        Cl.uint(startTime),
        Cl.uint(endTime),
        Cl.stringAscii("Will it happen?"),
        Cl.stringAscii("market-2")
      ],
      deployer
    );
    expect(result).toBeOk();
  });
});
