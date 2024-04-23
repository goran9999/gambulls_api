import express from "express";
import {
  getStakedNfts,
  getWalletStakedNfts,
  stakeGambulls,
  unstakeBulls,
  unstakeNfts,
} from "./staking.service";

export const StakingRouter = express.Router();

StakingRouter.post("/unstakeAll", unstakeBulls)
  .post("/unstake", unstakeNfts)
  .post("/stake", stakeGambulls)
  .get("/staked", getStakedNfts)
  .get("/:wallet", getWalletStakedNfts);
