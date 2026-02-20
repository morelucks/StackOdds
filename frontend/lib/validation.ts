export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateQuestion = (question: string): boolean => {
  return question.length >= 10 && question.length <= 256;
};

export const validateLiquidity = (liquidity: string, balance: number): boolean => {
  const num = parseFloat(liquidity);
  return !isNaN(num) && num > 0 && num <= balance;
};

export const validateEndTime = (endTime: string): boolean => {
  const timestamp = new Date(endTime).getTime();
  const now = Date.now();
  return timestamp > now;
};
