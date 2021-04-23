import * as mongoose from 'mongoose';

export const MigrationSchema = new mongoose.Schema({
  amount: {
    type: Number,
  },
  account: {
    //senderAddress
    type: String,
  },
  chainId: {
    type: Number,
  },
  v: {
    type: Number,
  },
  r: {
    type: String,
  },
  s: {
    type: String,
  },
  isClaim: {
    type: Boolean,
  },
  txn: {
    type: String,
  },
 
});

export interface Migration extends mongoose.Document {
  amount: number;
  account: string;
  chainId: number;
  v: number;
  r: string;
  s: string;
  isClaim: boolean;
  txn: string;
}
