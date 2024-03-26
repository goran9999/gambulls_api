import express from "express";
import {
  getWalletStakedNfts,
  stakeGambulls,
  unstakeBulls,
} from "./staking.service";

export const StakingRouter = express.Router();

StakingRouter.post("/unstakeAll", unstakeBulls)
  .post("/stake", stakeGambulls)
  .get("/:wallet", getWalletStakedNfts);
