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
} from '../utils/constant';

export const getPastEvents = async (latestBlocks) => {
  var allEvents = [];
  var ethNewBlock;
  var bnbNewBlock;
  var matNewBlock;

  if (latestBlocks) {
    var web3 = new Web3(ETH_URL);
    var contract = new web3.eth.Contract(BRIDGE_ABI, ERC_BRIDGE);
    await contract.getPastEvents(
      'Payback',
      {
        fromBlock: latestBlocks.ethBlock,
        toBlock: 'latest',
      },
      async (err, events) => {
        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = ETH_NETWORK;
          });
          allEvents = allEvents.concat(events);
          ethNewBlock = parseInt(events[0].blockNumber) + 1;
        }
      },
    );

    var web3 = new Web3(BSC_URL);
    var contract = new web3.eth.Contract(BRIDGE_ABI, BEP_BRIDGE);
    await contract.getPastEvents(
      'Payback',
      {
        fromBlock: latestBlocks.bnbBlock,
        toBlock: 'latest',
      },
      async (err, events) => {
        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = BSC_NETWORK;
          });
          allEvents = allEvents.concat(events);
          bnbNewBlock = parseInt(events[0].blockNumber) + 1;
        }
      },
    );

    var web3 = new Web3(MAT_URL);
    var contract = new web3.eth.Contract(BRIDGE_ABI, MAT_BRIDGE);
    await contract.getPastEvents(
      'Payback',
      {
        fromBlock: latestBlocks.matBlock,
        toBlock: 'latest',
      },
      async (err, events) => {
        if (events && events.length != 0) {
          events.forEach((event) => {
            event.sourceChain = MAT_NETWORK;
          });
          allEvents = allEvents.concat(events);
          matNewBlock = parseInt(events[0].blockNumber) + 1;
        }
      },
    );
  }
  return {
    events: allEvents,
    ethNewBlock: ethNewBlock ? ethNewBlock : latestBlocks.ethBlock,
    bnbNewBlock: bnbNewBlock ? bnbNewBlock : latestBlocks.bnbBlock,
    matNewBlock: matNewBlock ? matNewBlock : latestBlocks.matBlock,
  };
};
