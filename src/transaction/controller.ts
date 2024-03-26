import express from "express";
import {
  generateSendPolygonNft,
  getWalletClaimableNfts,
  retryMint,
  submitPolygonTransferTransaction,
} from "./service";

export const TransactionRouter = express.Router();

TransactionRouter.post("/generate", generateSendPolygonNft)
  .post("/execute", submitPolygonTransferTransaction)
  .get("/retry/:wallet", retryMint)
  .get("/:wallet", getWalletClaimableNfts);
