import { ETH_NETWORK, BSC_NETWORK, MAT_NETWORK } from '../utils/constant';
import axios from 'axios';
const Web3 = require('web3');
import { chainMap } from '../utils/chainMap';

let databaseABI: any = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'bridgeContract',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'bridgeOwner',
        type: 'address',
      },
    ],
    name: 'BridgEdit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'bridgeContract',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'bridgeOwner',
        type: 'address',
      },
    ],
    name: 'addBridge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getOwnerFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPolkaLokrFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRecepient',
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
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_ownerFee',
        type: 'uint256',
      },
    ],
    name: 'setOwnerFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_polkaFee',
        type: 'uint256',
      },
    ],
    name: 'setPolkaLokrFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_recepient',
        type: 'address',
      },
    ],
    name: 'setRecepient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const databaseAddress = {
  4: '0xA22eBEd76BFdE7c642c818f13159945305E20Eb3',
  97: '0x422a8d3Ddbf9197a1659A116971D1C81F2c2208B',
  80001: '0x49E9Ae2009Bb76532C71a16cd0F1d61B430C238a',
};

export const transferFees = async (chainId, amount) => {
  // const web3 = new Web3(provider);

  // const contract = new web3.eth.Contract(
  //   ERC_CHAIN ? BEPtoERC_ABI : BEP_CHAIN ? ERCtoBEP_ABI : "",
  //   ERC_CHAIN ? BEPtoERC : BEP_CHAIN ? ERCtoBEP : ""
  // );
  let finalTransactionFees = 0;

  if (chainId == ETH_NETWORK) {
    //CHANGED: Replaced "chainId == BEP_CHAIN_TEST" to this condition

    let gasPrice = await getCurrentGasPrices();

    let txFees = (
      ((gasPrice.high * Math.pow(10, 9)) / Math.pow(10, 18)) *
      120000
    ).toString();

    let txFeesInUsd = await ETHtoUSD(txFees);
    let txFeesInLKR = await USDtoLKR(txFeesInUsd);
    finalTransactionFees = txFeesInLKR;
  }

  if (chainId == BSC_NETWORK) {
    //CHANGED: Replaced "chainId == ERC_CHAIN_TEST" to this condition "chainId == BEP_CHAIN_MAIN || chainId == BEP_CHAIN_TEST" and then to "chainMap[chainId]?.name == "BEP20
    let txFees = (
      ((5 * Math.pow(10, 9)) / Math.pow(10, 18)) *
      120000
    ).toString();

    let txFeesInUsd = await BNBtoUSD(txFees);
    let txFeesInLKR = await USDtoLKR(txFeesInUsd);
    finalTransactionFees = txFeesInLKR;
  }

  if (chainId == MAT_NETWORK) {
    let txFees = (
      ((5 * Math.pow(10, 9)) / Math.pow(10, 18)) *
      120000
    ).toString();

    let txFeesInUsd = await MATtoUSD(txFees);
    let txFeesInLKR = await USDtoLKR(txFeesInUsd);
    finalTransactionFees = txFeesInLKR;
  }

  let web3 = new Web3(chainMap[chainId].rpc);

  let contract = new web3.eth.Contract(databaseABI, databaseAddress[chainId]);

  let ownerFeePercentage = await contract.methods.getOwnerFee().call();

  let ownerFee =
    Number(amount) * (Number(web3.utils.fromWei(ownerFeePercentage)) / 100);

  finalTransactionFees = finalTransactionFees;

  return finalTransactionFees;
};

const ETHtoUSD = async (amount) => {
  let response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  );

  console.log('eth to usd ==>>', response.data);

  let Token = response.data.ethereum.usd;
  // console.log(Token, "token");
  return amount * Token;
};

const BNBtoUSD = async (amount) => {
  let response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
  );

  console.log('bnb to usd ==>>', response.data);

  let Token = response.data.binancecoin.usd;
  // console.log(Token, "token");
  return amount * Token;
};

const MATtoUSD = async (amount) => {
  let response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd',
  );

  // console.log('mat to usd ==>>', response.data);

  let Token = response.data['matic-network'].usd;
  // console.log(Token, "token");
  return amount * Token;
};
const USDtoLKR = async (amount) => {
  let response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x80ce3027a70e0a928d9268994e9b85d03bd4cdcf&vs_currencies=USD',
  );

  let Token = response.data['0x80ce3027a70e0a928d9268994e9b85d03bd4cdcf'].usd;
  // console.log(Token, "token");
  return amount / Token;
};

const getCurrentGasPrices = async () => {
  try {
    const res = await axios.get(
      'https://ethgasstation.info/json/ethgasAPI.json',
    );
    const response = res.data;

    // console.log('response gas price', response);
    let prices = {
      low: response.safeLow / 10,
      medium: response.average / 10,
      high: response.fast / 10,
    };
    return prices;
  } catch (e) {
    console.log(e);
  }
};
