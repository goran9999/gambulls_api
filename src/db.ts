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

export const UserSchema = new mongoose.Schema({
  wallet: String,
  createdAt: Date,
  displayName: String,
  username: String,
  usdcSolWallet: String,
  bio: String,
  emailAddress: String,
  imageUrl: String,
  discord: String,
  instagram: String,
  website: String,
  x: String,
  banner: String,
});

export interface IUser {
  wallet: string;
  banner: string;
  bio: String;
  displayName: string;
  emailAddress: string;
  imageUrl: string;
  createdAt: Date;
  username: String;
  discord?: string;
  instagram?: string;
  website?: string;
  x?: string;
  usdcSolWallet: string;
}

export const User = mongoose.model<IUser>("user", UserSchema);
