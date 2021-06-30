import * as mongoose from 'mongoose';

export const BridgeSchema = new mongoose.Schema({
  color: {
    type: String,
  },
  ethBlock: {
    type: Number,
  },
  bnbBlock: {
    type: Number,
  },
  matBlock: {
    type: Number,
  },
});

export interface Bridge extends mongoose.Document {
  color: string;
  ethBlock: number;
  bnbBlock: number;
  matBlock: number;
}
