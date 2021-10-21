const Web3 = require('web3');

import {
  ERC_BRIDGE,
  BEP_BRIDGE,
  MAT_BRIDGE,
  BRIDGE_ABI,
  ETH_NETWORK,
  BSC_NETWORK,
  MAT_NETWORK,
  TOKEN_ERC,
  TOKEN_BEP,
  TOKEN_MAT,
} from '../utils/constant';

export const getPastEvents = async (bridge) => {
  let allEvents = [];
  let ethNewBlock;
  let bnbNewBlock;
  let matNewBlock;

  if (bridge) {
    const randomNumber = Math.floor(Math.random() * 5) + 1;

    if (ERC_BRIDGE && TOKEN_ERC) {
      let web3 = new Web3(process.env[`ETH_URL${randomNumber}`]);

      if (bridge.ethBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, ERC_BRIDGE);

        let events = await contract.getPastEvents('Payback', {
          fromBlock: bridge.ethBlock,
          toBlock: 'latest',
        });

        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = ETH_NETWORK;
          });
          allEvents = allEvents.concat(events);
          ethNewBlock = parseInt(events[0].blockNumber) + 1;
        } else {
          ethNewBlock = await web3.eth.getBlockNumber();
        }
      } else {
        ethNewBlock = await web3.eth.getBlockNumber();
      }
    }

    if (BEP_BRIDGE && TOKEN_BEP) {
      let web3 = new Web3(process.env[`BSC_URL${randomNumber}`]);

      if (bridge.bnbBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, BEP_BRIDGE);
        let events = await contract.getPastEvents('Payback', {
          fromBlock: bridge.bnbBlock,
          toBlock: 'latest',
        });

        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = BSC_NETWORK;
          });
          allEvents = allEvents.concat(events);
          bnbNewBlock = parseInt(events[0].blockNumber) + 1;
        } else {
          bnbNewBlock = await web3.eth.getBlockNumber();
        }
      } else {
        bnbNewBlock = await web3.eth.getBlockNumber();
      }
    }

    if (MAT_BRIDGE && TOKEN_MAT) {
      let web3 = new Web3(process.env[`MAT_URL${randomNumber}`]);

      if (bridge.matBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, MAT_BRIDGE);

        let events = await contract.getPastEvents('Payback', {
          fromBlock: bridge.matBlock,
          toBlock: 'latest',
        });

        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = MAT_NETWORK;
          });
          allEvents = allEvents.concat(events);
          matNewBlock = parseInt(events[0].blockNumber) + 1;
        } else {
          matNewBlock = await web3.eth.getBlockNumber();
        }
      } else {
        matNewBlock = await web3.eth.getBlockNumber();
      }
    }
  }

  return {
    events: allEvents,
    ethNewBlock: ethNewBlock,
    bnbNewBlock: bnbNewBlock,
    matNewBlock: matNewBlock,
  };
};
