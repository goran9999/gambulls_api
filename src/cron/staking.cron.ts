import { CronJob } from "cron";
import { User } from "../db";
import { gamubllsContract } from "../utils";
import { createClient } from "redis";
import { config } from "dotenv";
import logger from "../logger";

config();
export const stakingCron = new CronJob("*/10 * * * *", async () => {
  try {
    logger.info(`Cron execution...`);
    const client = await createClient({
      url: process.env.REDIS_URL!,
    }).connect();

    const wallets = (await User.find().select("wallet")).map((u) => u.wallet);

    const stakedWallets: { wallet: string; stakedAmount: number }[] = [];

    const staked = await Promise.all(
      wallets.map(async (w) => {
        const stakedNfts = await gamubllsContract.getStakedNfts(w);
        const len = stakedNfts.filter((s: any) => s[2]).length;
        if (len > 0) stakedWallets.push({ stakedAmount: len, wallet: w });

        return len;
      })
    );

    const totalStaked = staked.reduce((acc, val) => acc + val, 0);

    logger.info(`Cron found ${totalStaked} staked nfts!`);

    await client.set("stakedNfts", totalStaked.toString());
    await client.set("wallets", JSON.stringify(stakedWallets));

    logger.info("Stored staking info!");

    await client.disconnect();
  } catch (error: any) {
    logger.error(`Cron failed: ${error.message}`);
  }
});
