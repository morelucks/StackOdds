import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

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

  it("should enforce minimum resolution delay", () => {
    const marketId = 1;
    
    // Try to resolve immediately after end time
    const { result } = simnet.callPublicFn(
      "contract",
      "resolve-market",
      [Cl.uint(marketId), Cl.bool(true)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(2016)); // ERR_RESOLUTION_TOO_EARLY
  });

  it("should allow resolution after delay period", () => {
    const marketId = 1;
    
    // Advance blocks past end time + delay
    simnet.mineEmptyBlocks(200);

    const { result } = simnet.callPublicFn(
      "contract",
      "resolve-market",
      [Cl.uint(marketId), Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
