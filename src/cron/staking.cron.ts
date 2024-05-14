import { CronJob } from "cron";
import { User } from "../db";
import { gamubllsContract } from "../utils";
import { createClient } from "redis";
import { config } from "dotenv";
import logger from "../logger";
import { Alchemy, Network } from "alchemy-sdk";

config();
export const stakingCron = new CronJob("*/10 * * * *", async () => {
  try {
    logger.info(`Cron execution...`);
    const client = await createClient({
      url: process.env.REDIS_URL!,
    }).connect();

    const wallets = (await User.find().select("wallet")).map((u) => u.wallet);

    const stakedWallets: {
      wallet: string;
      stakedAmount: number;
      nftIds: number[];
    }[] = [];

    const alchemy = new Alchemy({
      network:
        process.env.CHAIN_ENV === "development"
          ? Network.ETH_SEPOLIA
          : Network.ETH_MAINNET,
      apiKey: process.env.ALCHEMY_KEY,
    });

    const staked = await Promise.all(
      wallets.map(async (w) => {
        const stakedNfts = await gamubllsContract.getStakedNfts(w);

        const len = stakedNfts.filter((s: any) => s[2]);
        const tokenIds: number[] = [];

        const images: string[] = [];

        await Promise.all(
          len.map(async (l: any) => {
            if (len.length > 0) {
              const nft = await alchemy.nft.getNftMetadata(
                gamubllsContract.target.toString(),
                l[1]
              );

              if (!images.some((s) => s === nft.image.originalUrl)) {
                images.push(nft.image.originalUrl!);
                tokenIds.push(Number(l[1]));
              }
            }
          })
        );
        stakedWallets.push({
          stakedAmount: images.length,
          wallet: w,
          nftIds: tokenIds,
        });

        return len.length;
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
