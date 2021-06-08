export const ETH_BNB_MAT_BLOCKS_DB_ID = '60af5f70ae8f97326c554f62'; //Test

export const ETH_NETWORK = 4; //Test
export const BSC_NETWORK = 97; //Test
export const MAT_NETWORK = 80001; //Test

export const ETH_URL =
  'https://rinkeby.infura.io/v3/c89f216154d84b83bb9344a7d0a91108'; //Test

export const BSC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545/'; //Test
export const MAT_URL = 'https://rpc-mumbai.matic.today'; //Test

//Token Addresses
export const polkaLokrERC = '0x87DA04c73109bCa7c7F6E095dDa3A4f6Ec898011'; //Test
export const polkalokrBEP = '0xFE153aDb3351b0899253CfF80c291Df4d0894d87'; //Test
export const polkaLokrMAT = '0xFa8AEaA41393B6baf9A699dAe3d91831dd0A9c11'; //Test

//Contract Addresses
export const ERC_BRIDGE = '0xc46932635cFe649a24cd3a6BAcb20753Eb61B2Bf'; //Test
export const BEP_BRIDGE = '0xC76a1d42322FD83551D41CaC7D680675E251241c'; //Test
export const MAT_BRIDGE = '0x49865a27913Cd1C18D0368a381583b81D8B3c127'; //Test

//ABIs
export const BRIDGE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_signer1',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_signer2',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnerChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'destinationChainID',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'migrationId',
        type: 'bytes32',
      },
    ],
    name: 'Payback',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldSigner1',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newSigner1',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'oldSigner2',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newSigner2',
        type: 'address',
      },
    ],
    name: 'SignerChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'paybackId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
    ],
    name: 'Withdraw',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newowner',
        type: 'address',
      },
    ],
    name: 'changeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_wallet1',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_wallet2',
        type: 'address',
      },
    ],
    name: 'changeSigner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'executedMap',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'isWhiteList',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_destinationChainID',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: '_migrationId',
        type: 'bytes32',
      },
    ],
    name: 'paybackTransit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'signWallet1',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'signWallet2',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_addresses',
        type: 'address[]',
      },
    ],
    name: 'toggleWhiteListAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'toggleWhiteListOnly',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'whiteListOn',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'withdrawTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: '_paybackId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_beneficiary',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_fee',
        type: 'uint256',
      },
    ],
    name: 'withdrawTransitToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
