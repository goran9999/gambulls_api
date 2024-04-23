import { json } from "body-parser";
import express from "express";
import cors from "cors";
import { TransactionRouter } from "./transaction/controller";
import { connectToDb } from "./db";
import { StakingRouter } from "./staking/staking.controller";
import { stakingCron } from "./cron/staking.cron";

const app = express();

app.use(json());
app.use(cors({ origin: "*" }));

connectToDb();

app.use("/transaction", TransactionRouter);
app.use("/staking", StakingRouter);

app.listen(3000, "0.0.0.0", () => {
  stakingCron.start();
  console.log("Listening on port 3009...");
});
