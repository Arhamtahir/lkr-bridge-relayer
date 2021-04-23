import * as mongoose from 'mongoose';

export const BlockSchema = new mongoose.Schema({
  ethBlock: {
    type: Number,
  },
  bnbBlock: {
    type: Number,
  },
  ethBlockClaim: {
    type: Number,
  },
  bnbBlockClaim: {
    type: Number,
  },
});

export interface Blocks extends mongoose.Document {
  ethBlock: number;
  bnbBlock: number;
  ethBlockClaim: number;
  bnbBlockClaim: number;
}
