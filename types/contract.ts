export interface Comment {
  commenter: string;
  content: string;
  timestamp: bigint;
  likes: bigint;
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
}