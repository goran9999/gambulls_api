import { json } from "body-parser";
import express from "express";
import cors from "cors";
import { TransactionRouter } from "./transaction/controller";
import { connectToDb } from "./db";
import { StakingRouter } from "./staking/staking.controller";
import { stakingCron } from "./cron/staking.cron";
import { UserRouter } from "./user/user.controller";
import * as bodyParser from "body-parser";
const app = express();
app.use(bodyParser.json({ limit: "250mb" }));
app.use(bodyParser.urlencoded({ limit: "250mb", extended: true }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors({ origin: "*" }));

connectToDb();

app.use("/transaction", TransactionRouter);
app.use("/staking", StakingRouter);
app.use("/user", UserRouter);

app.listen(3009, "0.0.0.0", () => {
  stakingCron.start();
  console.log("Listening on port 3009...");
});
