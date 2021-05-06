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

import axios from 'axios';
import { async } from 'rxjs';

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
              let chainId = BSC_NETWORK;
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
                { chainId: BSC_NETWORK, txn: Id },
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
            }
          }
        },
      );
    }
  }

  @Cron('*/15 * * * * *')
  async getBnbEventsCron() {
    this.logger.debug('getBnbEventsCron Called every 15 second');
    const web3 = new Web3(BSC_URL);
    const contract2 = new web3.eth.Contract(BEPtoERC_ABI, BSC_TO_ETH);

    const latestBlocks = await this.blocksModel.findById(ETH_BNB_BLOCKS_DB_ID);
    // console.log('getBnbEventsCron latest---------->', latestBlocks);

    if (latestBlocks != undefined) {
      //bnb block update
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(blockNumber);

      if (latestBlocks.bnbBlock < blockNumber) {
        await this.blocksModel.updateOne(
          { _id: ETH_BNB_BLOCKS_DB_ID },
          {
            $set: {
              bnbBlock: blockNumber + 1,
            },
          },
        );
      }

      // console.log('contract2 ==>>', contract2);
      await contract2.getPastEvents(
        'Payback',
        {
          fromBlock: latestBlocks.bnbBlock,
          toBlock: 'latest',
        },
        async (err, events) => {
          if (err) {
            console.log('getBnbEventsCron error', err);
          }
          // console.log(events);

          console.log('getBnbEvents events', events);

          if (events != undefined && events.length != 0) {
            //store events in DB
            for (var i = 0; i < events.length; i++) {
              let amount = events[i].returnValues.amount;
              let account = events[i].returnValues.from;
              let token = POLKALOKR_ETH;
              let Id = keccak256(
                defaultAbiCoder.encode(
                  ['uint256', 'uint256'],
                  [events[i].blockNumber, events[i].transactionIndex],
                ),
              );
              let chainId = ETH_NETWORK;
              let isClaim = false;

              console.log(
                'get vrs params ==>>',
                Id,
                token,
                ETH_TO_BSC,
                Number(Web3.utils.fromWei(amount.toString())),
                account,
              );
              const { v, r, s } = await this.getVRS(
                Id,
                token,
                ETH_TO_BSC,
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
            }
          }
        },
      );
    }
  }

  @Cron('*/15 * * * * *')
  async claimAtBSC() {
    const from = '0xd6B6A95819F8152a302530AA7cAF52B5B9833bE4';

    const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/');
    const contract = new web3.eth.Contract(BEPtoERC_ABI, BSC_TO_ETH);

    const res = await this.migrationModel.find({
      isClaim: false,
      chainId: BSC_NETWORK,
    });

    let fees = await this.transferFees(BSC_NETWORK);

    for (var i = 0; i < res.length; i++) {
      this.ClaimBSC(
        web3,
        from,
        contract,
        res[i].v,
        res[i].r,
        res[i].s,
        res[i].txn,
        POLKALOKR_BSC,
        res[i].account,
        web3.utils.toWei(res[i].amount.toString()),
        web3.utils.toWei(fees.toString()),
        res[i].chainId,
      );
    }
  }

  @Cron('*/15 * * * * *')
  async claimAtERC() {
    const from = '0xd6B6A95819F8152a302530AA7cAF52B5B9833bE4';

    const web3 = new Web3(
      'https://rinkeby.infura.io/v3/637a6ab08bce4397a29cbc97b4c83abf',
    );
    const contract = new web3.eth.Contract(ERCtoBEP_ABI, ETH_TO_BSC);

    const res = await this.migrationModel.find({
      isClaim: false,
      chainId: ETH_NETWORK,
    });

    let fees = await this.transferFees(ETH_NETWORK);

    for (var i = 0; i < res.length; i++) {
      this.ClaimERC(
        web3,
        from,
        contract,
        res[i].v,
        res[i].r,
        res[i].s,
        res[i].txn,
        POLKALOKR_ETH,
        res[i].account,
        web3.utils.toWei(res[i].amount.toString()),
        web3.utils.toWei(fees.toString()),
        res[i].chainId,
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

  transferFees = async (chainId) => {
    // const web3 = new Web3(provider);
    // const contract = new web3.eth.Contract(BEPtoERC_ABI, BSC_TO_ETH);

    let finalTransactionFees = 0;

    if (chainId == BSC_NETWORK) {
      let txFees = (
        ((5 * Math.pow(10, 9)) / Math.pow(10, 18)) *
        120000
      ).toString();

      let txFeesInUsd = await this.BNBtoUSD(txFees);
      let txFeesInLKR = await this.USDtoLKR(txFeesInUsd);
      finalTransactionFees = txFeesInLKR;
    }

    if (chainId == ETH_NETWORK) {
      let gasPrice = await this.getCurrentGasPrices();

      let txFees = (
        ((gasPrice.high * Math.pow(10, 9)) / Math.pow(10, 18)) *
        120000
      ).toString();

      let txFeesInUsd = await this.ETHtoUSD(txFees);
      let txFeesInLKR = await this.USDtoLKR(txFeesInUsd);
      finalTransactionFees = txFeesInLKR;
    }

    return finalTransactionFees;
  };

  BNBtoUSD = async (amount) => {
    let response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
    );

    console.log('bnb to usd ==>>', response.data);

    let Token = response.data.binancecoin.usd;
    console.log(Token, 'token');
    return amount * Token;
  };

  ETHtoUSD = async (amount) => {
    let response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&vs_currencies=USD',
    );

    let Token = response.data['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'].usd;
    console.log(Token, 'token');
    return amount * Token;
  };

  USDtoLKR = async (amount) => {
    let response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x80ce3027a70e0a928d9268994e9b85d03bd4cdcf&vs_currencies=USD',
    );

    let Token = response.data['0x80ce3027a70e0a928d9268994e9b85d03bd4cdcf'].usd;
    console.log(Token, 'token');
    return amount / Token;
  };

  getCurrentGasPrices = async () => {
    try {
      let response = await axios.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
      );
      let prices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10,
      };
      return prices;
    } catch (e) {
      console.log(e);
    }
  };

  ClaimBSC = async (
    web3,
    from,
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
      let count = await web3.eth.getTransactionCount(from, 'pending');
      let gasPrices = await this.getCurrentGasPrices();
      let rawTransaction = {
        from: from,
        to: BSC_TO_ETH,
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
      let pr_key = `${process.env.private_key}`.toString();
      console.log(pr_key);
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
          console.log(hash);
        });
    } catch (Err) {
      console.log(Err);
    }
  };

  ClaimERC = async (
    web3,
    from,
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
      let count = await web3.eth.getTransactionCount(from, 'pending');
      let gasPrices = await this.getCurrentGasPrices();
      let rawTransaction = {
        from: from,
        to: ETH_TO_BSC,
        data: contract.methods
          .withdrawFromBSC(
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
        gasPrice: await web3.utils.toHex(gasPrices.high * 1000000000),
        nonce: count,
        gasLimit: web3.utils.toHex(8000000),
        chainId: chainId,
      };
      let pr_key = `${process.env.private_key}`.toString();
      console.log(pr_key);
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
          console.log(hash);
        });
    } catch (Err) {
      console.log(Err);
    }
  };
}
