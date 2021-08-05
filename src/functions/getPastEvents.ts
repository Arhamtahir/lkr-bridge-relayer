const Web3 = require('web3');

import {
  ETH_URL,
  BSC_URL,
  MAT_URL,
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
    if (ERC_BRIDGE && TOKEN_ERC) {
      let web3 = new Web3(ETH_URL);

      if (bridge.ethBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, ERC_BRIDGE);
        await contract.getPastEvents(
          'Payback',
          {
            fromBlock: bridge.ethBlock,
            toBlock: 'latest',
          },
          async (err, events) => {
            if (events && events.length != 0) {
              events.forEach((event) => {
                event.sourceChain = ETH_NETWORK;
              });
              allEvents = allEvents.concat(events);
              ethNewBlock = parseInt(events[0].blockNumber) + 1;
            } else {
              ethNewBlock = await web3.eth.getBlockNumber();
            }
          },
        );
      } else {
        ethNewBlock = await web3.eth.getBlockNumber();
      }
    }

    if (BEP_BRIDGE && TOKEN_BEP) {
      let web3 = new Web3(BSC_URL);

      if (bridge.bnbBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, BEP_BRIDGE);
        await contract.getPastEvents(
          'Payback',
          {
            fromBlock: bridge.bnbBlock,
            toBlock: 'latest',
          },
          async (err, events) => {
            if (events && events.length != 0) {
              events.forEach((event) => {
                event.sourceChain = BSC_NETWORK;
              });
              allEvents = allEvents.concat(events);
              bnbNewBlock = parseInt(events[0].blockNumber) + 1;
            } else {
              bnbNewBlock = await web3.eth.getBlockNumber();
            }
          },
        );
      } else {
        bnbNewBlock = await web3.eth.getBlockNumber();
      }
    }

    if (MAT_BRIDGE && TOKEN_MAT) {
      let web3 = new Web3(MAT_URL);

      if (bridge.matBlock) {
        let contract = new web3.eth.Contract(BRIDGE_ABI, MAT_BRIDGE);
        await contract.getPastEvents(
          'Payback',
          {
            fromBlock: bridge.matBlock,
            toBlock: 'latest',
          },
          async (err, events) => {
            if (events && events.length != 0) {
              events.forEach((event) => {
                event.sourceChain = MAT_NETWORK;
              });
              allEvents = allEvents.concat(events);
              matNewBlock = parseInt(events[0].blockNumber) + 1;
            } else {
              matNewBlock = await web3.eth.getBlockNumber();
            }
          },
        );
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
