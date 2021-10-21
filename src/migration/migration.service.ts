import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Migration } from './migration.model';
import { Cron } from '@nestjs/schedule';
import { BRIDGE_ID, BRIDGE_ABI } from '../utils/constant';
import { Bridge } from 'src/bridge/bridge.model';

import { chainMap } from '../utils/chainMap.js';

import { getVRS } from '../functions/getVRS';
import { getPastEvents } from '../functions/getPastEvents';
import { transferFees } from '../functions/transferFees';

const { defaultAbiCoder, keccak256 } = require('ethers/lib/utils');

const Web3 = require('web3');

@Injectable()
export class MigrationService {
  constructor(
    @InjectModel('MigrationV3')
    private readonly migrationModel: Model<Migration>,
    @InjectModel('Bridge') private readonly bridgeModel: Model<Bridge>,
  ) {}
  private readonly logger = new Logger('Migration');

  @Cron('*/30 * * * * *')
  async getEventsCron() {
    const bridge = await this.bridgeModel.findById(BRIDGE_ID);

    const {
      events,
      ethNewBlock,
      bnbNewBlock,
      matNewBlock,
    } = await getPastEvents(bridge);

    console.log('All Create Events', events);

    if (events != undefined && events.length != 0) {
      // store events in DB
      for (var i = 0; i < events.length; i++) {
        let amount = events[i].returnValues.amount;
        let account = events[i].returnValues.sender;
        let receiver = events[i].returnValues.from;
        let chainId = events[i].sourceChain;
        let destinationId = events[i].returnValues.destinationChainID;
        let token = chainMap[events[i].returnValues.destinationChainID].token;
        let Id = keccak256(
          defaultAbiCoder.encode(
            ['uint256', 'uint256'],
            [events[i].blockNumber, events[i].transactionIndex],
          ),
        );
        const { v, r, s } = await getVRS(
          Id,
          token,
          chainMap[events[i].returnValues.destinationChainID].bridge,
          Number(Web3.utils.fromWei(amount.toString())),
          receiver,
        );
        let isClaim = false;
        let migrationId = events[i].returnValues.migrationId;

        const res = await this.migrationModel.findOneAndUpdate(
          { chainId: events[i].sourceChain, txn: Id },
          {
            bridgeID: BRIDGE_ID,
            amount: Web3.utils.fromWei(amount.toString()),
            account,
            receiver,
            chainId,
            destinationId,
            v: parseInt(v),
            r: r,
            s: s,
            txn: Id,
            isClaim,
            migrationId,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
    }

    // blocks update
    await this.bridgeModel.updateMany(
      { _id: BRIDGE_ID },
      {
        $set: {
          ethBlock: ethNewBlock,
          bnbBlock: bnbNewBlock,
          matBlock: matNewBlock,
        },
      },
    );
  }

  @Cron('*/30 * * * * *')
  async claim() {
    const transactions = await this.migrationModel.find({
      bridgeID: BRIDGE_ID,
      isClaim: false,
    });

    const randomNumber = Math.floor(Math.random() * 5) + 1;
    let claimChainMap = { ...chainMap };

    for (const chainId of Object.keys(chainMap)) {
      const web3 = new Web3(
        process.env[`${chainMap[chainId].rpc}${randomNumber}`],
      );

      let ADMIN_1_FUNDS = await web3.eth.getBalance(process.env.ADMIN_1);

      ADMIN_1_FUNDS = Number(web3.utils.fromWei(ADMIN_1_FUNDS.toString()));

      let ADMIN_2_FUNDS = await web3.eth.getBalance(process.env.ADMIN_2);

      ADMIN_2_FUNDS = Number(web3.utils.fromWei(ADMIN_2_FUNDS.toString()));

      claimChainMap[chainId]['ADMIN_1'] =
        ADMIN_1_FUNDS > 0.05 ? process.env.ADMIN_1 : process.env.ADMIN_2;
      claimChainMap[chainId]['PRIVATE_KEY1'] =
        ADMIN_1_FUNDS > 0.05
          ? process.env.PRIVATE_KEY1
          : process.env.PRIVATE_KEY2;

      claimChainMap[chainId]['ADMIN_2'] =
        ADMIN_2_FUNDS > 0.05 ? process.env.ADMIN_2 : process.env.ADMIN_1;
      claimChainMap[chainId]['PRIVATE_KEY2'] =
        ADMIN_2_FUNDS > 0.05
          ? process.env.PRIVATE_KEY2
          : process.env.PRIVATE_KEY1;

      claimChainMap[chainId]['skip'] =
        ADMIN_1_FUNDS < 0.05 && ADMIN_2_FUNDS < 0.05 ? true : false;
    }

    for (let i = 0; i < transactions.length; i++) {
      if (claimChainMap[transactions[i].destinationId].skip) {
        continue;
      }
      try {
        const web3 = new Web3(
          process.env[
            `${claimChainMap[transactions[i].destinationId].rpc}${randomNumber}`
          ],
        );
        const contract = new web3.eth.Contract(
          BRIDGE_ABI,
          claimChainMap[transactions[i].destinationId].bridge,
        );

        let fees = await transferFees(
          transactions[i].destinationId,
          transactions[i].amount,
        );

        let admin =
          i % 2 == 0
            ? claimChainMap[transactions[i].destinationId]['ADMIN_1']
            : claimChainMap[transactions[i].destinationId]['ADMIN_2'];
        let privateKey =
          i % 2 == 0
            ? claimChainMap[transactions[i].destinationId]['PRIVATE_KEY1']
            : claimChainMap[transactions[i].destinationId]['PRIVATE_KEY2'];

        let count = await web3.eth.getTransactionCount(admin, 'pending');
        let rawTransaction = {
          from: admin,
          to: claimChainMap[transactions[i].destinationId].bridge,
          data: contract.methods
            .withdrawTransitToken(
              transactions[i].v,
              transactions[i].r,
              transactions[i].s,
              transactions[i].txn,
              claimChainMap[transactions[i].destinationId].token,
              transactions[i].receiver,
              web3.utils.toWei(transactions[i].amount.toString()),
              web3.utils.toWei(fees.toString()),
            )
            .encodeABI(),
          gasPrice: await web3.utils.toHex(10 * 1000000000),
          nonce: count,
          gasLimit: web3.utils.toHex(8000000),
          chainId: transactions[i].destinationId,
        };
        let pr_key = `${privateKey}`.toString();

        let signed = await web3.eth.accounts.signTransaction(
          rawTransaction,
          pr_key,
        );
        web3.eth
          .sendSignedTransaction(signed.rawTransaction)
          .on('transactionHash', (hash) => {
            console.log('hash', hash);
          })
          .on('confirmation', async (confirmationNumber, receipt) => {
            if (confirmationNumber == 2) {
              await this.migrationModel.findOneAndUpdate(
                { txn: transactions[i].txn },
                { isClaim: true, migrationHash: receipt.transactionHash },
              );
            }
          })
          .on('error', (error) => {
            console.log('claim transaction error==>>', error);
          });
      } catch (Err) {
        console.log(' claim function error==>', Err);
      }
    }
  }
}
