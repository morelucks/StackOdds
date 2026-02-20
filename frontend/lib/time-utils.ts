export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const isMarketActive = (startTime: number, endTime: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now >= startTime && now < endTime;
};

export const isMarketExpired = (endTime: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now >= endTime;
};

export const getTimeRemaining = (endTime: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
