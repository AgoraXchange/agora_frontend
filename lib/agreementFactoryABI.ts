import { baseSepolia } from "wagmi/chains";
import { monadTestnet } from "./utils/customChains";

// Chain-specific contract addresses
export const getAgreementFactoryAddress = (chainId?: number): string => {
  if (!chainId) {
    throw new Error("Chain ID is required to get contract address");
  }

  switch (chainId) {
    case baseSepolia.id:
      return process.env.NEXT_PUBLIC_AGREEMENT_FACTORY_ADDRESS as string;
    case monadTestnet.id:
      return process.env.NEXT_PUBLIC_AGREEMENT_FACTORY_ADDRESS_MONAD as string;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

// Legacy export for backward compatibility
export const AGREEMENT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_AGREEMENT_FACTORY_ADDRESS as string;

export const AGREEMENT_FACTORY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_oracle",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "MAX_BETS_PER_PAGE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PARTY_REWARD_PERCENTAGE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "addComment",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_content",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "canBet",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancelContract",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimReward",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "closeBetting",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "commentLikes",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractBets",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "bettor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "choice",
        "type": "uint8",
        "internalType": "enum ABBetting.Choice"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "claimed",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractComments",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "commenter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "content",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "likes",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractCounter",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contracts",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "creator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "topic",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "partyA",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "partyB",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bettingEndTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum ABBetting.ContractStatus"
      },
      {
        "name": "winner",
        "type": "uint8",
        "internalType": "enum ABBetting.Choice"
      },
      {
        "name": "totalPoolA",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalPoolB",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "partyRewardPercentage",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBettors",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalComments",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createContract",
    "inputs": [
      {
        "name": "_topic",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_partyA",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_partyB",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_bettingDurationInMinutes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_minBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_maxBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "declareWinner",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_winner",
        "type": "uint8",
        "internalType": "enum ABBetting.Choice"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "defaultMaxBet",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "defaultMinBet",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "distributeRewards",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "feeRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getComments",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "comments",
        "type": "tuple[]",
        "internalType": "struct ABBetting.Comment[]",
        "components": [
          {
            "name": "commenter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "content",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "likes",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "totalComments",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContract",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ABBetting.Contract",
        "components": [
          {
            "name": "creator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "topic",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "description",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "partyA",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "partyB",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "bettingEndTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "status",
            "type": "uint8",
            "internalType": "enum ABBetting.ContractStatus"
          },
          {
            "name": "winner",
            "type": "uint8",
            "internalType": "enum ABBetting.Choice"
          },
          {
            "name": "totalPoolA",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalPoolB",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "partyRewardPercentage",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "minBetAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maxBetAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalBettors",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalComments",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractBasic",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "creator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "topic",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "partyA",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "partyB",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bettingEndTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum ABBetting.ContractStatus"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractBetting",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "winner",
        "type": "uint8",
        "internalType": "enum ABBetting.Choice"
      },
      {
        "name": "totalPoolA",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalPoolB",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "partyRewardPercentage",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxBetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBettors",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractStats",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "totalBets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalVolume",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBettorsA",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBettorsB",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "averageBetA",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "averageBetB",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPlatformStats",
    "inputs": [],
    "outputs": [
      {
        "name": "totalContracts",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalVolume",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalFeesCollected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBetsPaginated",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "choices",
        "type": "uint8[]",
        "internalType": "enum ABBetting.Choice[]"
      },
      {
        "name": "claimed",
        "type": "bool[]",
        "internalType": "bool[]"
      },
      {
        "name": "totalBets",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasUserBet",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "likeComment",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_commentId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "oracle",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "paused",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformFeePercentage",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformStats",
    "inputs": [],
    "outputs": [
      {
        "name": "totalContracts",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalVolume",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalFeesCollected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDefaultBetLimits",
    "inputs": [
      {
        "name": "_minBet",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_maxBet",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFeeRecipient",
    "inputs": [
      {
        "name": "_newRecipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setOracle",
    "inputs": [
      {
        "name": "_newOracle",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPlatformFee",
    "inputs": [
      {
        "name": "_newFeePercentage",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "simpleBet",
    "inputs": [
      {
        "name": "_contractId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_choice",
        "type": "uint8",
        "internalType": "enum ABBetting.Choice"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unpause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "BetPlaced",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "bettor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "choice",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ABBetting.Choice"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CommentAdded",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "commenter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "content",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CommentLiked",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "commentId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "liker",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ContractCancelled",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ContractCreated",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "creator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "topic",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "description",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "partyA",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "partyB",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "bettingEndTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DefaultBetLimitsUpdated",
    "inputs": [
      {
        "name": "newMinBet",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newMaxBet",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Paused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformFeeUpdated",
    "inputs": [
      {
        "name": "newFeePercentage",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardClaimed",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "bettor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardsDistributed",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "partyReward",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "platformFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalDistributed",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unpaused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WinnerDeclared",
    "inputs": [
      {
        "name": "contractId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "winner",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ABBetting.Choice"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "EnforcedPause",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExpectedPause",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
] as const;