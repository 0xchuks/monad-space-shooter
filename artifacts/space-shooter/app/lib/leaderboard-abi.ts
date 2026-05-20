export const leaderboardAbi = [
  {
    type: 'function',
    name: 'submitScore',
    inputs: [
      { name: 'score', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'bestScore',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'NewBestScore',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'score', type: 'uint256' },
    ],
  },
] as const;
