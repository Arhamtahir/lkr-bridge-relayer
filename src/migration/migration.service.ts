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

  @Cron('*/15 * * * * *')
  async getEthEventsCron() {
    const latestBlocks = await this.bridgeModel.findById(BRIDGE_ID);

    const {
      events,
      ethNewBlock,
      bnbNewBlock,
      matNewBlock,
    } = await getPastEvents(latestBlocks);

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
          account,
        );
        let isClaim = false;
        let migrationId = events[i].returnValues.migrationId;

        const res = await this.migrationModel.findOneAndUpdate(
          { chainId: events[i].sourceChain, txn: Id },
          {
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
  }

  @Cron('*/15 * * * * *')
  async claim() {
    const transactions = await this.migrationModel.find({
      isClaim: false,
    });

    const admin1 = '0xd6B6A95819F8152a302530AA7cAF52B5B9833bE4';
    const admin2 = '0x51a73C48c8A9Ef78323ae8dc0bc1908A1C49b6c6';

    for (let i = 0; i < transactions.length; i++) {
      // console.log('RPC ==>>', chainMap[transactions[i].destinationId].rpc);
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
    console.log(admin, privateKey, _amount, _fee, chainId);
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
          // console.log('Hamzah ==>  ' + receipt);
          await this.migrationModel.findOneAndUpdate(
            { txn: _transitId },
            { isClaim: true, migrationHash: receipt.transactionHash },
          );
        })
        .on('error', (error) => {
          console.log('error ==>>', error);
        });
      // .on('transactionHash', async (hash) => {
      //   console.log('hash ==>>', hash);
      // });
    } catch (Err) {
      console.log(Err);
    }
  };

  async getTransactionClaimStatus(txhash) {
    const transacation = await this.migrationModel.findOne({
      migrationId: txhash,
    });
    const claimStatus = transacation.isClaim ? transacation.isClaim : false;
    const migrationHash = transacation.migrationHash
      ? transacation.migrationHash
      : null;
    return { claimStatus, migrationHash };
  }
}
