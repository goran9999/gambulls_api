import express from "express";
import {
  getWalletStakedNfts,
  stakeGambulls,
  unstakeBulls,
  unstakeNfts,
} from "./staking.service";

export const StakingRouter = express.Router();

StakingRouter.post("/unstakeAll", unstakeBulls)
  .post("/unstake", unstakeNfts)
  .post("/stake", stakeGambulls)
  .get("/:wallet", getWalletStakedNfts);
