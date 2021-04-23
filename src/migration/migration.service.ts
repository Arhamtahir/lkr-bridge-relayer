import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Migration, MigrationSchema } from './migration.model';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ETH_BNB_BLOCKS_DB_ID,
  ETH_NETWORK,
  BSC_NETWORK,
  ETH_URL,
  BSC_URL,
  POLKALOKR_ETH,
  POLKALOKR_BSC,
  ETH_TO_BSC,
  BSC_TO_ETH,
  ERCtoBEP_ABI,
  BEPtoERC_ABI,
} from 'src/blockchain/constant';
import { Blocks } from 'src/blocks/blocks.model';

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
    this.logger.debug('getEthEventsCron called every 15 second');
    const web3 = new Web3(ETH_URL);
    const contract = new web3.eth.Contract(ERCtoBEP_ABI, ETH_TO_BSC);

    const latestBlocks = await this.blocksModel.findById(ETH_BNB_BLOCKS_DB_ID);
    console.log('ethBlock', latestBlocks.ethBlock);

    if (latestBlocks != undefined) {
      await contract.getPastEvents(
        'Transit',
        {
          fromBlock: latestBlocks.ethBlock,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('err getEthEventsCron', err);
          }
          console.log('getEthEventsCron events', events);

          // console.log('getEthEvents', events);
          if (events != undefined && events.length != 0) {
            //eth block update
            await this.blocksModel.updateOne(
              { _id: ETH_BNB_BLOCKS_DB_ID },
              {
                $set: {
                  ethBlock: parseInt(events[0].blockNumber) + 1,
                },
              },
            );

            //store events in DB
            for (var i = 0; i < events.length; i++) {
              let amount = events[i].returnValues.amount;
              console.log('amount ==>>', amount);
              let account = events[i].returnValues.from;
              let token = POLKALOKR_BSC;
              let Id = keccak256(
                defaultAbiCoder.encode(
                  ['uint256', 'uint256'],
                  [events[i].blockNumber, events[i].transactionIndex],
                ),
              );
              let chainId = ETH_NETWORK;
              let isClaim = false;
              console.log(
                'new amount ==>>',
                Number(Web3.utils.fromWei(amount.toString())),
              );
              const { v, r, s } = await this.getVRS(
                Id,
                token,
                BSC_TO_ETH,
                Number(Web3.utils.fromWei(amount.toString())),
                account,
              );

              console.log(v, r, s, 'getVRS');

              const res = await this.migrationModel.findOneAndUpdate(
                { chainId: ETH_NETWORK, txn: Id },
                {
                  amount: web3.utils.fromWei(amount.toString()),
                  account,
                  chainId,
                  v: parseInt(v),
                  r: r,
                  s: s,
                  txn: Id,
                  isClaim,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
              );

              console.log('res----------->', res);

              // await this.migrationModel.create({
              //   amount: web3.utils.fromWei(amount.toString()),
              //   account,
              //   chainId,
              //   v: parseInt(getVRS.v),
              //   r: getVRS.r,
              //   s: getVRS.s,
              //   nonce,
              //   isClaim,
              // });
            }
          }
        },
      );
    }
  }

  // @Cron('*/15 * * * * *')
  // async getBnbEventsCron() {
  //   this.logger.debug('getBnbEventsCron Called every 15 second');
  //   const web3 = new Web3(BSC_URL);
  //   const contract2 = new web3.eth.Contract(
  //     BEP_TO_ERC_ABI,
  //     BNB_BRIDGE_CONTRACT_ADDRESS,
  //   );

  //   const latestBlocks = await this.blocksModel.findById(ETH_BNB_BLOCKS_DB_ID);
  //   // console.log('getBnbEventsCron latest---------->', latestBlocks);

  //   if (latestBlocks != undefined) {
  //     //bnb block update
  //     const blockNumber = await web3.eth.getBlockNumber();
  //     console.log(blockNumber);

  //     if (latestBlocks.bnbBlock < blockNumber) {
  //       await this.blocksModel.updateOne(
  //         { _id: ETH_BNB_BLOCKS_DB_ID },
  //         {
  //           $set: {
  //             bnbBlock: blockNumber + 1,
  //           },
  //         },
  //       );
  //     }

  //     await contract2.getPastEvents(
  //       'TokenDeposited',
  //       {
  //         fromBlock: latestBlocks.bnbBlock,
  //         toBlock: 'latest',
  //       },
  //       async (err, events) => {
  //         if (err) {
  //           console.log('getBnbEventsCron error', err);
  //         }
  //         // console.log(events);

  //         console.log('getBnbEvents events', events);

  //         if (events != undefined && events.length != 0) {
  //           //store events in DB
  //           for (var i = 0; i < events.length; i++) {
  //             let amount = events[i].returnValues.amount;
  //             let account = events[i].returnValues.user;
  //             let chainId = BSC_NETWORK;
  //             let nonce = events[i].returnValues.nonce;
  //             let isClaim = false;
  //             const getVRS = this.getClaimVRS(
  //               web3.utils.fromWei(amount.toString()),
  //               account,
  //               nonce,
  //               ETH_BRIDGE_CONTRACT_ADDRESS,
  //               chainId,
  //             );

  //             console.log(getVRS, 'getVRS');
  //             const res = await this.migrationModel.findOneAndUpdate(
  //               { chainId: BSC_NETWORK, nonce: nonce, account: account },
  //               {
  //                 amount: web3.utils.fromWei(amount.toString()),
  //                 account,
  //                 chainId,
  //                 v: parseInt(getVRS.v),
  //                 r: getVRS.r,
  //                 s: getVRS.s,
  //                 nonce,
  //                 isClaim,
  //               },
  //               { upsert: true, new: true, setDefaultsOnInsert: true },
  //             );
  //             console.log('res-------->', res);

  //             // await this.migrationModel.create({
  //             //   amount: web3.utils.fromWei(amount.toString()),
  //             //   account,
  //             //   chainId,
  //             //   v: parseInt(getVRS.v),
  //             //   r: getVRS.r,
  //             //   s: getVRS.s,
  //             //   nonce,
  //             //   isClaim,
  //             // });
  //           }
  //         }
  //       },
  //     );
  //   }
  // }

  // @Cron('*/15 * * * * *')
  // async checkEthTransactionCron() {
  //   this.logger.debug('checkEthTransactionCron called every 15 second');
  //   const web3 = new Web3(ETH_URL);
  //   const contract = new web3.eth.Contract(
  //     ERC_TO_BEP_ABI,
  //     ETH_BRIDGE_CONTRACT_ADDRESS,
  //   );
  //   const latestBlocks = await this.blocksModel.findById(ETH_BNB_BLOCKS_DB_ID);
  //   // console.log('ethBlock', latestBlocks.ethBlock);

  //   if (latestBlocks != undefined) {
  //     await contract.getPastEvents(
  //       'TokenWithdrawn',
  //       {
  //         fromBlock: latestBlocks.ethBlockClaim,
  //         toBlock: 'latest',
  //       },
  //       async (err, events) => {
  //         if (err) {
  //           console.log('checkEthTransactionCron error', err);
  //         }
  //         console.log(events);

  //         // console.log(events);
  //         if (events != undefined && events.length != 0) {
  //           //eth block update
  //           await this.blocksModel.updateOne(
  //             { _id: ETH_BNB_BLOCKS_DB_ID },
  //             {
  //               $set: {
  //                 ethBlockClaim: parseInt(events[0].blockNumber) + 1,
  //               },
  //             },
  //           );

  //           for (var i = 0; i < events.length; i++) {
  //             // console.log('blockHash', events[i].blockHash);

  //             await this.migrationModel.updateOne(
  //               {
  //                 account: events[i].returnValues.user,
  //                 nonce: parseInt(events[i].returnValues.nonce),
  //                 chainId: BSC_NETWORK,
  //               },
  //               {
  //                 $set: {
  //                   isClaim: true,
  //                 },
  //               },
  //             );
  //           }
  //         }
  //       },
  //     );
  //   }
  // }

  @Cron('*/15 * * * * *')
  async checkBnbTransactionCron() {
    this.logger.debug('checkBnbTransactionCron called every 10 second');
    const web3 = new Web3(BSC_URL);
    const contract2 = new web3.eth.Contract(BEPtoERC_ABI, BSC_TO_ETH);

    const latestBlocks = await this.blocksModel.findById(ETH_BNB_BLOCKS_DB_ID);
    console.log('checkBnbTransactionCron------------>', latestBlocks.bnbBlock);

    if (latestBlocks != undefined) {
      // console.log("contract2 latestBlock",latestBlocks)
      //bnb block update
      const blockNumber = await web3.eth.getBlockNumber();
      console.log('checkBnbTransactionCron blockNumber update', blockNumber);
      if (latestBlocks.bnbBlockClaim < blockNumber) {
        await this.blocksModel.updateOne(
          { _id: ETH_BNB_BLOCKS_DB_ID },
          {
            $set: {
              bnbBlockClaim: blockNumber + 1,
            },
          },
        );
      }

      await contract2.getPastEvents(
        'Withdraw',
        {
          fromBlock: latestBlocks.bnbBlockClaim,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('checkBnbTransactionCron', err);
          }
          console.log('checkBnbTransactionCron', events);

          if (events != undefined && events.length != 0) {
            for (var i = 0; i < events.length; i++) {
              await this.migrationModel.updateOne(
                {
                  txn: events[i].returnValues.transitId,
                },
                {
                  $set: {
                    isClaim: true,
                  },
                },
              );
            }
          }
        },
      );
    }
  }

  async getMigration(account: string, chainId: number) {
    try {
      const response = await this.migrationModel.find({
        account: account,
        isClaim: false,
        chainId: chainId,
      });
      // console.log('response', response);

      return response;
    } catch (error) {
      throw new HttpException(
        {
          status: error.status,
          msg: error.msg,
        },
        error.status,
      );
    }
  }

  async getVRS(_id, _token, _contractAddress, _amount, _senderAddress) {
    console.log('private key ==>> ', process.env.PRIVATE_KEY);
    const DomainSeparator = keccak256(
      defaultAbiCoder.encode(['string', 'address'], ['0x01', _contractAddress]),
    );
    var message = keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'address', 'uint256', 'address'],
        [_id, _senderAddress, Web3.utils.toWei(_amount.toString()), _token],
      ),
    );
    var finalHash = keccak256(
      solidityPack(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        ['0x19', '0x01', DomainSeparator, message],
      ),
    );
    const { v, r, s } = ecsign(
      Buffer.from(finalHash.slice(2), 'hex'),
      Buffer.from(process.env.PRIVATE_KEY.slice(2), 'hex'),
    );
    return { v: v, r: '0x' + r.toString('hex'), s: '0x' + s.toString('hex') };
  }
}
