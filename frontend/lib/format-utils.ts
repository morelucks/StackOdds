export const formatUSDCx = (amount: number): string => {
  return `${amount.toFixed(2)} USDCx`;
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatShares = (shares: number): string => {
  return shares.toFixed(4);
};

export const truncateAddress = (address: string): string => {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
