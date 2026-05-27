/**
 * Shared test utilities for StackOdds contract tests.
 * Centralizes error codes, helper functions, and common setup patterns.
 */
import { tx } from '@stacks/clarinet-sdk';
import { uintCV, principalCV, stringAsciiCV, boolCV } from '@stacks/transactions';

// ─── Error Codes ────────────────────────────────────────────────────────────

export const CONTRACT_ERRORS = {
  UNAUTHORIZED: 2001n,
  ZERO_LIQUIDITY: 2002n,
  ALREADY_RESOLVED: 2003n,
  MARKET_NOT_FOUND: 2005n,
  INVALID_PARAMS: 2008n,
  NOT_EXPIRED: 2010n,
} as const;

export const TOKEN_ERRORS = {
  UNAUTHORIZED: 1001n,
  ALREADY_INITIALIZED: 1002n,
  INSUFFICIENT_BALANCE: 1004n,
} as const;

// Keep legacy export for backward compatibility
export const ERRORS = {
  UNAUTHORIZED: CONTRACT_ERRORS.UNAUTHORIZED,
  ZERO_LIQUIDITY: CONTRACT_ERRORS.ZERO_LIQUIDITY,
};

// ─── Result Matchers ─────────────────────────────────────────────────────────

export const ok = (value: unknown) => ({ type: 'ok', value });
export const err = (code: bigint) => ({ type: 'err', value: { type: 'uint', value: code } });
export const okTrue = () => ok({ type: 'true' });
export const okUint = (n: bigint) => ok({ type: 'uint', value: n });

// ─── Account Helpers ─────────────────────────────────────────────────────────

export interface TestAccounts {
  deployer: string;
  user1: string;
  user2: string;
  user3: string;
}

export function getAccounts(simnet: any): TestAccounts {
  const accounts = simnet.getAccounts();
  return {
    deployer: accounts.get('deployer')!,
    user1: accounts.get('wallet_1')!,
    user2: accounts.get('wallet_2')!,
    user3: accounts.get('wallet_3')!,
  };
}

// ─── Contract Setup Helpers ──────────────────────────────────────────────────

/**
 * Initializes the token contract and sets the contract as its owner.
 */
export function setupToken(simnet: any, deployer: string) {
  const contractAddress = `${deployer}.contract`;
  simnet.mineBlock([
    tx.callPublicFn('token', 'mint', [uintCV(0), principalCV(deployer), uintCV(10_000_000_000n)], deployer),
    tx.callPublicFn('token', 'mint', [uintCV(0), principalCV(simnet.getAccounts().get('wallet_1')!), uintCV(10_000_000_000n)], deployer),
    tx.callPublicFn('token', 'initialize', [principalCV(contractAddress)], deployer),
  ]);
}

/**
 * Initializes the main prediction market contract.
 */
export function setupContract(simnet: any, deployer: string) {
  const collateralToken = `${deployer}.token`;
  simnet.mineBlock([
    tx.callPublicFn(
      'contract',
      'initialize',
      [principalCV(deployer), principalCV(collateralToken)],
      deployer,
    ),
  ]);
}

/**
 * Full setup: token + contract initialization.
 */
export function setupAll(simnet: any, deployer: string) {
  setupToken(simnet, deployer);
  setupContract(simnet, deployer);
}

// ─── Market Helpers ───────────────────────────────────────────────────────────

export interface MarketParams {
  liquidity?: bigint;
  startOffset?: number;
  endOffset?: number;
  question?: string;
  ipfsHash?: string;
}

/**
 * Creates a market with sensible defaults. Returns the market ID.
 */
export function createMarket(
  simnet: any,
  deployer: string,
  params: MarketParams = {},
): number {
  const {
    liquidity = 1_000_000n,
    startOffset = 10,
    endOffset = 100,
    question = 'Will BTC reach $100k?',
    ipfsHash = 'ipfs-hash-abc',
  } = params;

  const currentBlock = simnet.blockHeight;
  const result = simnet.mineBlock([
    tx.callPublicFn(
      'contract',
      'create-market',
      [
        uintCV(liquidity),
        uintCV(currentBlock + startOffset),
        uintCV(currentBlock + endOffset),
        stringAsciiCV(question),
        stringAsciiCV(ipfsHash),
      ],
      deployer,
    ),
  ]);

  const txResult = result[0].result as any;
  if (txResult.type !== 'ok') {
    throw new Error(`create-market failed: ${JSON.stringify(txResult)}`);
  }
  return Number(txResult.value.value);
}

/**
 * Mines `n` empty blocks to advance chain height.
 */
export function mineBlocks(simnet: any, n: number) {
  for (let i = 0; i < n; i++) {
    simnet.mineBlock([]);
  }
}

// ─── Token Setup Helpers ──────────────────────────────────────────────────────

export interface TokenParams {
  marketId: number;
  yesTokenId: number;
  noTokenId: number;
  yesName?: string;
  noName?: string;
  yesSymbol?: string;
  noSymbol?: string;
}

/**
 * Initializes a token pair for a market.
 */
export function initializeTokenPair(simnet: any, deployer: string, params: TokenParams) {
  const {
    marketId,
    yesTokenId,
    noTokenId,
    yesName = 'YES',
    noName = 'NO',
    yesSymbol = 'YES',
    noSymbol = 'NO',
  } = params;

  simnet.callPublicFn(
    'token',
    'initialize-token',
    [
      uintCV(marketId),
      uintCV(yesTokenId),
      uintCV(noTokenId),
      stringAsciiCV(yesName),
      stringAsciiCV(noName),
      stringAsciiCV(yesSymbol),
      stringAsciiCV(noSymbol),
    ],
    deployer,
  );
}

/**
 * Mints tokens to a recipient.
 */
export function mintTokens(
  simnet: any,
  deployer: string,
  tokenId: number,
  recipient: string,
  amount: bigint,
) {
  simnet.callPublicFn(
    'token',
    'mint',
    [uintCV(tokenId), principalCV(recipient), uintCV(amount)],
    deployer,
  );
}
