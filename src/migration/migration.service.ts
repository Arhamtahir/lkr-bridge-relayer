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
        console.log('amount ==>>', amount);
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

        // console.log('res----------->', res);
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

    const admin1 = process.env.ADMIN_1;
    const admin2 = process.env.ADMIN_2;

    for (let i = 0; i < transactions.length; i++) {
      console.log('provider==>>', chainMap[transactions[i].destinationId].rpc);
      const web3 = new Web3(chainMap[transactions[i].destinationId].rpc);
      const contract = new web3.eth.Contract(
        BRIDGE_ABI,
        chainMap[transactions[i].destinationId].bridge,
      );

      let fees = await transferFees(
        transactions[i].destinationId,
        transactions[i].amount,
      );
      this.ClaimHandle(
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

  ClaimHandle = async (
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
    console.log(admin, privateKey, _amount, _fee, chainId);
    console.log(await web3.eth.getBalance(admin));
    console.log(web3.eth.currentProvider);
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

      let signed = await web3.eth.accounts.signTransaction(
        rawTransaction,
        pr_key,
      );
      await web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on('transactionHash', (hash) => {
          console.log('hash', hash);
        })
        .on('confirmation', async (confirmationNumber, receipt) => {
          if (confirmationNumber == 2) {
            await this.migrationModel.findOneAndUpdate(
              { txn: _transitId },
              { isClaim: true, migrationHash: receipt.transactionHash },
            );
          }
        })
        .on('error', (error) => {
          console.log('error ==>>', error);
        });
    } catch (Err) {
      console.log('testing error==>', Err);
    }
  };
}
