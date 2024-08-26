//@ts-nocheck
import { User } from "../db";
import { gamubllsContract } from "../utils";
import { createClient } from "redis";
import { config } from "dotenv";
import logger from "../logger";
import { Alchemy, Network } from "alchemy-sdk";

config();
export const stakingData = async () => {
  console.log("go");
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

    let totalStaked = 0;
    for (const w of wallets) {
      const stakedNfts = await gamubllsContract.getStakedNfts(w);

      const len = stakedNfts.filter((s: any) => s[2]);

      console.log(len);
      return;
      const tokenIds: number[] = [];

      const images: string[] = [];

      for (const l of len) {
        const uri = await gamubllsContract.tokenURI(l[1]);

        if (!images.find((i) => i === uri)) {
          images.push(uri);
          tokenIds.push(Number(l[1]));
        }
      }

      // const nfts = await alchemy.nft.getNftMetadataBatch(
      //   len.map((l: any) => ({
      //     contractAddress: gamubllsContract.target,
      //     tokenId: Number(l[1]),
      //   }))
      // );

      // for (const nft of nfts.nfts) {
      //   if (!images.some((s) => s === nft.image.originalUrl)) {
      //     images.push(nft.image.originalUrl!);
      //     tokenIds.push(Number(nft.tokenId));
      //   }
      // }
      stakedWallets.push({
        stakedAmount: images.length,
        wallet: w,
        nftIds: tokenIds,
      });

      totalStaked += images.length;
      console.log(`Fetched info for ${w}`);
      // await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.info(`Cron found ${totalStaked} staked nfts!`);

    await client.set("stakedNfts", totalStaked.toString());
    await client.set("wallets", JSON.stringify(stakedWallets));

    logger.info("Stored staking info!");

    await client.disconnect();
  } catch (error: any) {
    logger.error(`Cron failed: ${error.message}`);
  }
};

(async () => {
  console.log("start");
  await stakingData();
})();
