export const calculatePrice = (qYes: number, qNo: number, liquidity: number, outcome: 'YES' | 'NO'): number => {
  const q = outcome === 'YES' ? qYes : qNo;
  const total = qYes + qNo;
  
  if (total === 0) return 0.5;
  
  return q / total;
};

export const calculateCost = (
  qYes: number,
  qNo: number,
  liquidity: number,
  shares: number,
  outcome: 'YES' | 'NO'
): number => {
  const LN2 = 0.693147;
  const b = liquidity / LN2;
  
  const qCurrent = outcome === 'YES' ? qYes : qNo;
  const qOther = outcome === 'YES' ? qNo : qYes;
  
  const costBefore = b * Math.log(Math.exp(qCurrent / b) + Math.exp(qOther / b));
  const costAfter = b * Math.log(Math.exp((qCurrent + shares) / b) + Math.exp(qOther / b));
  
  return costAfter - costBefore;
};

export const calculateShares = (
  qYes: number,
  qNo: number,
  liquidity: number,
  cost: number,
  outcome: 'YES' | 'NO'
): number => {
  const LN2 = 0.693147;
  const b = liquidity / LN2;
  
  const qCurrent = outcome === 'YES' ? qYes : qNo;
  const qOther = outcome === 'YES' ? qNo : qYes;
  
  const costBefore = b * Math.log(Math.exp(qCurrent / b) + Math.exp(qOther / b));
  const targetCost = costBefore + cost;
  
  let shares = 0;
  let step = cost;
  
  for (let i = 0; i < 20; i++) {
    const testCost = b * Math.log(Math.exp((qCurrent + shares) / b) + Math.exp(qOther / b));
    const diff = targetCost - testCost;
    
    if (Math.abs(diff) < 0.01) break;
    
    shares += diff / b;
    step /= 2;
  }
  
  return Math.max(0, shares);
};
