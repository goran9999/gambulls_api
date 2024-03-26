import mongoose from "mongoose";

import * as dotenv from "dotenv";
dotenv.config();

export async function connectToDb() {
  await mongoose.connect(process.env.MONGO_URL!);
}

export enum TransactionStatus {
  Requested,
  TransferredPolygon,
  Finished,
}

const TransferSchema = new mongoose.Schema({
  wallet: String,
  tokenIds: [Number],
  polygonApproveHash: String,
  polygonTransferHash: String,
  etherumMintHash: String,
  status: {
    type: Number,
    enum: TransactionStatus,
    default: 0,
  },
});

export interface ITransfer {
  wallet: string;
  tokenIds: number[];
  status: TransactionStatus;
  polygonApproveHash: string;
  polygonTransferHash: string;
  etherumMintHash: string;
}

export const TransferNfts = mongoose.model<ITransfer>(
  "transfer_nfts",
  TransferSchema
);
