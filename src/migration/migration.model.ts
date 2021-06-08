import * as mongoose from 'mongoose';

export const MigrationSchema = new mongoose.Schema({
  amount: {
    type: Number,
  },
  account: {
    type: String,
  },
  receiver: {
    type: String,
  },
  chainId: {
    type: Number,
  },
  destinationId: {
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
  migrationId: {
    type: String,
  },
});

export interface Migration extends mongoose.Document {
  amount: number;
  account: string;
  receiver: string;
  chainId: number;
  destinationId: number;
  v: number;
  r: string;
  s: string;
  isClaim: boolean;
  txn: string;
  migrationId: string;
}
