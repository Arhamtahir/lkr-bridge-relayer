import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Migration, MigrationSchema } from './migration.model';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ETH_BNB_MAT_BLOCKS_DB_ID,
  ETH_NETWORK,
  BSC_NETWORK,
  ETH_URL,
  BSC_URL,
  polkaLokrERC,
  polkalokrBEP,
  polkaLokrMAT,
  ERC_BRIDGE,
  BEP_BRIDGE,
  MAT_BRIDGE,
  BRIDGE_ABI,
  MAT_URL,
  MAT_NETWORK,
} from 'src/blockchain/constant';
import { Blocks } from 'src/blocks/blocks.model';

import { chainMap } from '../utils/chainMap.js';

import axios from 'axios';

import { getVRS } from '../functions/getVRS';
import { transferFees } from '../functions/transferFees';

const {
  defaultAbiCoder,
  hexlify,
  keccak256,
  toUtf8Bytes,
  solidityPack,
} = require('ethers/lib/utils');
const { ecsign } = require('ethereumjs-util');
const Web3 = require('web3');

@Injectable()
export class MigrationService {
  constructor(
    @InjectModel('MigrationV3')
    private readonly migrationModel: Model<Migration>,
    @InjectModel('Blocks') private readonly blocksModel: Model<Blocks>,
  ) {}
  private readonly logger = new Logger('Migration');

  @Cron('*/15 * * * * *')
  async getEthEventsCron() {
    // this.logger.debug('getEthEventsCron called every 15 second');
    const web3 = new Web3(ETH_URL);
    const contract = new web3.eth.Contract(BRIDGE_ABI, ERC_BRIDGE);

    const latestBlocks = await this.blocksModel.findById(
      ETH_BNB_MAT_BLOCKS_DB_ID,
    );
    console.log('ethBlock', latestBlocks.ethBlock);

    if (latestBlocks != undefined) {
      await contract.getPastEvents(
        'Payback',
        {
          fromBlock: latestBlocks.ethBlock,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('err getEthEventsCron', err);
          }
          console.log('getEthEventsCron events', events);

          if (events != undefined && events.length != 0) {
            //eth block update
            await this.blocksModel.updateOne(
              { _id: ETH_BNB_MAT_BLOCKS_DB_ID },
              {
                $set: {
                  ethBlock: parseInt(events[0].blockNumber) + 1,
                },
              },
            );

            // store events in DB
            for (var i = 0; i < events.length; i++) {
              let amount = events[i].returnValues.amount;
              console.log('amount ==>>', amount);
              let account = events[i].returnValues.sender;
              let token =
                chainMap[events[i].returnValues.destinationChainID].token;
              let Id = keccak256(
                defaultAbiCoder.encode(
                  ['uint256', 'uint256'],
                  [events[i].blockNumber, events[i].transactionIndex],
                ),
              );
              let chainId = ETH_NETWORK;
              let destinationId = events[i].returnValues.destinationChainID;
              let isClaim = false;
              console.log(
                'new amount ==>>',
                Number(Web3.utils.fromWei(amount.toString())),
              );
              const { v, r, s } = await getVRS(
                Id,
                token,
                chainMap[events[i].returnValues.destinationChainID].bridge,
                Number(Web3.utils.fromWei(amount.toString())),
                account,
              );

              console.log(v, r, s, 'getVRS');

              let receiver = events[i].returnValues.from;

              const res = await this.migrationModel.findOneAndUpdate(
                { chainId: ETH_NETWORK, txn: Id },
                {
                  amount: web3.utils.fromWei(amount.toString()),
                  account,
                  receiver,
                  chainId,
                  destinationId,
                  v: parseInt(v),
                  r: r,
                  s: s,
                  txn: Id,
                  isClaim,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
              );

              console.log('res----------->', res);
            }
          }
        },
      );
    }
  }

  @Cron('*/15 * * * * *')
  async getBnbEventsCron() {
    // this.logger.debug('getEthEventsCron called every 15 second');
    const web3 = new Web3(BSC_URL);
    const contract = new web3.eth.Contract(BRIDGE_ABI, BEP_BRIDGE);

    const latestBlocks = await this.blocksModel.findById(
      ETH_BNB_MAT_BLOCKS_DB_ID,
    );
    console.log('bnbBlock', latestBlocks.bnbBlock);

    if (latestBlocks != undefined) {
      await contract.getPastEvents(
        'Payback',
        {
          fromBlock: latestBlocks.bnbBlock,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('err getBnbEventsCron', err);
          }
          console.log('getBnbEventsCron events', events);

          if (events != undefined && events.length != 0) {
            //eth block update
            await this.blocksModel.updateOne(
              { _id: ETH_BNB_MAT_BLOCKS_DB_ID },
              {
                $set: {
                  bnbBlock: parseInt(events[0].blockNumber) + 1,
                },
              },
            );

            // store events in DB
            for (var i = 0; i < events.length; i++) {
              let amount = events[i].returnValues.amount;
              console.log('amount ==>>', amount);
              let account = events[i].returnValues.sender;
              let token =
                chainMap[events[i].returnValues.destinationChainID].token;
              let Id = keccak256(
                defaultAbiCoder.encode(
                  ['uint256', 'uint256'],
                  [events[i].blockNumber, events[i].transactionIndex],
                ),
              );
              let chainId = BSC_NETWORK;
              let destinationId = events[i].returnValues.destinationChainID;
              let isClaim = false;
              console.log(
                'new amount ==>>',
                Number(Web3.utils.fromWei(amount.toString())),
              );
              const { v, r, s } = await getVRS(
                Id,
                token,
                chainMap[events[i].returnValues.destinationChainID].bridge,
                Number(Web3.utils.fromWei(amount.toString())),
                account,
              );

              console.log(v, r, s, 'getVRS');

              let receiver = events[i].returnValues.from;

              const res = await this.migrationModel.findOneAndUpdate(
                { chainId: BSC_NETWORK, txn: Id },
                {
                  amount: web3.utils.fromWei(amount.toString()),
                  account,
                  receiver,
                  chainId,
                  destinationId,
                  v: parseInt(v),
                  r: r,
                  s: s,
                  txn: Id,
                  isClaim,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
              );

              console.log('res----------->', res);
            }
          }
        },
      );
    }
  }

  @Cron('*/15 * * * * *')
  async getMatEventsCron() {
    // this.logger.debug('getEthEventsCron called every 15 second');
    const web3 = new Web3(MAT_URL);
    const contract = new web3.eth.Contract(BRIDGE_ABI, MAT_BRIDGE);

    const latestBlocks = await this.blocksModel.findById(
      ETH_BNB_MAT_BLOCKS_DB_ID,
    );
    console.log('matBlock', latestBlocks.matBlock);

    if (latestBlocks != undefined) {
      await contract.getPastEvents(
        'Payback',
        {
          fromBlock: latestBlocks.matBlock,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('err getMatEventsCron', err);
          }
          console.log('getMatEventsCron events', events);

          if (events != undefined && events.length != 0) {
            //eth block update
            await this.blocksModel.updateOne(
              { _id: ETH_BNB_MAT_BLOCKS_DB_ID },
              {
                $set: {
                  matBlock: parseInt(events[0].blockNumber) + 1,
                },
              },
            );

            // store events in DB
            for (var i = 0; i < events.length; i++) {
              let amount = events[i].returnValues.amount;
              console.log('amount ==>>', amount);
              let account = events[i].returnValues.sender;
              let token =
                chainMap[events[i].returnValues.destinationChainID].token;
              let Id = keccak256(
                defaultAbiCoder.encode(
                  ['uint256', 'uint256'],
                  [events[i].blockNumber, events[i].transactionIndex],
                ),
              );
              let chainId = MAT_NETWORK;
              let destinationId = events[i].returnValues.destinationChainID;
              let isClaim = false;
              console.log(
                'new amount ==>>',
                Number(Web3.utils.fromWei(amount.toString())),
              );
              const { v, r, s } = await getVRS(
                Id,
                token,
                chainMap[events[i].returnValues.destinationChainID].bridge,
                Number(Web3.utils.fromWei(amount.toString())),
                account,
              );

              console.log(v, r, s, 'getVRS');

              let receiver = events[i].returnValues.from;

              const res = await this.migrationModel.findOneAndUpdate(
                { chainId: MAT_NETWORK, txn: Id },
                {
                  amount: web3.utils.fromWei(amount.toString()),
                  account,
                  receiver,
                  chainId,
                  destinationId,
                  v: parseInt(v),
                  r: r,
                  s: s,
                  txn: Id,
                  isClaim,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
              );

              console.log('res----------->', res);
            }
          }
        },
      );
    }
  }

  @Cron('*/15 * * * * *')
  async claim() {
    const transactions = await this.migrationModel.find({
      isClaim: false,
    });

    const admin1 = '0xd6B6A95819F8152a302530AA7cAF52B5B9833bE4';
    const admin2 = '0x51a73C48c8A9Ef78323ae8dc0bc1908A1C49b6c6';

    for (let i = 0; i < transactions.length; i++) {
      console.log('RPC ==>>', chainMap[transactions[i].destinationId].rpc);
      const web3 = new Web3(chainMap[transactions[i].destinationId].rpc);
      const contract = new web3.eth.Contract(
        BRIDGE_ABI,
        chainMap[transactions[i].destinationId].bridge,
      );

      let fees = await transferFees(transactions[i].destinationId);
      this.ClaimBSC(
        web3,
        i % 2 == 0 ? admin1 : admin2,
        i % 2 == 0 ? process.env.PRIVATE_KEY1 : process.env.PRIVATE_KEY2,
        contract,
        transactions[i].v,
        transactions[i].r,
        transactions[i].s,
        transactions[i].txn,
        chainMap[transactions[i].destinationId].token,
        transactions[i].receiver,
        web3.utils.toWei(transactions[i].amount.toString()),
        web3.utils.toWei(fees.toString()),
        transactions[i].destinationId,
      );
    }
  }

  ClaimBSC = async (
    web3,
    admin,
    privateKey,
    contract,
    v,
    r,
    s,
    _transitId,
    _token,
    beneficiary,
    _amount,
    _fee,
    chainId,
  ) => {
    try {
      let count = await web3.eth.getTransactionCount(admin, 'pending');
      let rawTransaction = {
        from: admin,
        to: chainMap[chainId].bridge,
        data: contract.methods
          .withdrawTransitToken(
            v,
            r,
            s,
            _transitId,
            _token,
            beneficiary,
            _amount,
            _fee,
          )
          .encodeABI(),
        gasPrice: await web3.utils.toHex(10 * 1000000000),
        nonce: count,
        gasLimit: web3.utils.toHex(8000000),
        chainId: chainId,
      };
      let pr_key = `${privateKey}`.toString();
      // console.log(pr_key);
      let signed = await web3.eth.accounts.signTransaction(
        rawTransaction,
        pr_key,
      );
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on('confirmation', async (confirmationNumber, receipt) => {
          await this.migrationModel.findOneAndUpdate(
            { txn: _transitId },
            { isClaim: true },
          );
        })
        .on('error', (error) => {
          console.log(error);
        })
        .on('transactionHash', async (hash) => {
          // console.log(hash);
        });
    } catch (Err) {
      console.log(Err);
    }
  };
}
