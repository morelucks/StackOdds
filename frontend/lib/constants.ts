// Stacks contract addresses
export const CONTRACT_ADDRESS = "SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.stackodds-market-v1"
export const TOKEN_CONTRACT_ADDRESS = "SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.stackodds-token-v1"

// USDCx on Stacks (Circle xReserve)
// Mainnet: SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
// Testnet: ST2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx
export const USDCX_MAINNET = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx"
export const USDCX_TESTNET = "ST2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx"
export const USDCX_DECIMALS = 6;

// Helper function to get USDCx address based on network
export function getUSDCxAddress(isMainnet: boolean = false): string {
  return isMainnet ? USDCX_MAINNET : USDCX_TESTNET
}

// USDCx conversion utilities
export const toMicroUnits = (amount: number): number => {
  return Math.floor(amount * Math.pow(10, USDCX_DECIMALS));
};

export const fromMicroUnits = (amount: number): number => {
  return amount / Math.pow(10, USDCX_DECIMALS);
};

// Update these with your deployed contract addresses
export const DEPLOYER_ADDRESS = "SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB"