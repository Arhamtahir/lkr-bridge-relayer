import Web3 from 'web3';

import {
  ERC_BRIDGE,
  BEP_BRIDGE,
  MAT_BRIDGE,
  TOKEN_ERC,
  TOKEN_BEP,
  TOKEN_MAT,
  BRIDGE_ABI,
} from '../utils/constant';

export const getWithDrawEvents = async (bridge) => {
  let allEvents = [];
  let ethNewBlockClaim;
  let bnbNewBlockClaim;
  let matNewBlockClaim;

  const randomNumber = Math.floor(Math.random() * 5) + 1;

  if (ERC_BRIDGE && TOKEN_ERC) {
    const web3 = new Web3(process.env[`ETH_URL${randomNumber}`]);

    if (bridge.ethBlockClaim) {
      // @ts-ignore
      let contract = new web3.eth.Contract(BRIDGE_ABI, ERC_BRIDGE);

      const currentBlock = await web3.eth.getBlockNumber();
      let toBlock = currentBlock;
      if (currentBlock - bridge.ethBlockClaim > 5000) {
        toBlock = bridge.ethBlockClaim + 5000;
      }

      const events = await contract.getPastEvents('Withdraw', {
        fromBlock: bridge.ethBlockClaim,
        toBlock,
      });
      if (events && events.length !== 0) {
        allEvents = allEvents.concat(events);
      }
      ethNewBlockClaim = toBlock + 1;
    } else {
      ethNewBlockClaim = await web3.eth.getBlockNumber();
    }
  }

  if (BEP_BRIDGE && TOKEN_BEP) {
    const web3 = new Web3(process.env[`BSC_URL${randomNumber}`]);
    if (bridge.bnbBlockClaim) {
      // @ts-ignore
      let contract = new web3.eth.Contract(BRIDGE_ABI, BEP_BRIDGE);

      const currentBlock = await web3.eth.getBlockNumber();
      let toBlock = currentBlock;
      if (currentBlock - bridge.bnbBlockClaim > 5000) {
        toBlock = bridge.bnbBlockClaim + 5000;
      }

      const events = await contract.getPastEvents('Withdraw', {
        fromBlock: bridge.bnbBlockClaim,
        toBlock,
      });
      if (events && events.length !== 0) {
        allEvents = allEvents.concat(events);
      }
      bnbNewBlockClaim = toBlock + 1;
    } else {
      bnbNewBlockClaim = await web3.eth.getBlockNumber();
    }
  }

  if (MAT_BRIDGE && TOKEN_MAT) {
    const web3 = new Web3(process.env[`MAT_URL${randomNumber}`]);
    if (bridge.matBlockClaim) {
      // @ts-ignore
      let contract = new web3.eth.Contract(BRIDGE_ABI, MAT_BRIDGE);

      const currentBlock = await web3.eth.getBlockNumber();
      let toBlock = currentBlock;
      if (currentBlock - bridge.matBlockClaim > 5000) {
        toBlock = bridge.matBlockClaim + 5000;
      }

      const events = await contract.getPastEvents('Withdraw', {
        fromBlock: bridge.matBlockClaim,
        toBlock,
      });
      if (events && events.length !== 0) {
        allEvents = allEvents.concat(events);
      }
      matNewBlockClaim = toBlock + 1;
    } else {
      matNewBlockClaim = await web3.eth.getBlockNumber();
    }
  }
  return {
    events: allEvents,
    ethNewBlockClaim,
    bnbNewBlockClaim,
    matNewBlockClaim,
  };
};
