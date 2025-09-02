export interface Comment {
  commenter: string;
  content: string;
  timestamp: bigint;
  likes: bigint;
  side: number; // 1 for Viewpoint 1, 2 for Viewpoint 2
}

export interface Contract {
  topic: string;
  description: string;
  creator: string;
  partyA: string;
  partyB: string;
  totalPoolA: bigint;
  totalPoolB: bigint;
  bettingEndTime: bigint;
  status: number;
  winner: number;
  // Optional fields exposed by ABI but not always used in UI
  minBetAmount?: bigint;
  maxBetAmount?: bigint;
}
