export interface Market {
  id: number;
  question: string;
  liquidity: number;
  qYes: number;
  qNo: number;
  startTime: number;
  endTime: number;
  resolved: boolean;
  yesWon: boolean;
  metadataCid: string;
}

export interface MarketMetadata {
  description: string;
  category: string;
  imageUrl?: string;
  tags?: string[];
}

export interface UserPosition {
  marketId: number;
  yesShares: number;
  noShares: number;
}
