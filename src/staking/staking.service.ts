import { ethRpc, gamubllsContract } from "../utils";
import { Request, Response } from "express";
import axios from "axios";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import { User } from "../db";
import { createClient } from "redis";

const alchemy = new Alchemy({
  network:
    process.env.CHAIN_ENV === "development"
      ? Network.ETH_SEPOLIA
      : Network.ETH_MAINNET,
  apiKey: process.env.ALCHEMY_KEY,
});

// Utility function to split an array into chunks
function chunkArray(array: any[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function getWalletStakedNfts(req: Request, res: Response) {
  try {
    const { wallet } = req.params;
    if (!wallet) {
      return res.status(400).json({ message: "Missing wallet!" });
    }

    const walletStakedNfts = (
      await gamubllsContract.getStakedNfts(wallet)
    ).filter((w: any) => w[2]);

    await createUserIfNotExists(wallet);

    const tokens = walletStakedNfts.map((wns: any) => ({
      contractAddress: gamubllsContract.target.toString(),
      tokenId: wns[1].toString(),
      tokenType: "ERC721", // Assuming the tokens are ERC721; adjust as needed
    }));

    // Split tokens into chunks of 100
    const tokenChunks = chunkArray(tokens, 100);
    const nfts: any[] = [];

    for (const chunk of tokenChunks) {
      const nftsBatchResponse = await alchemy.nft.getNftMetadataBatch(chunk);
      nfts.push(
        ...nftsBatchResponse.nfts.map((nft, index) => ({
          id: Number(chunk[index].tokenId),
          staked: true,
          image: nft.image.originalUrl, // Adjust according to Alchemy's response format
          mint: chunk[index].tokenId,
        }))
      );
    }

    return res.status(200).json({ message: "Success", stakedNfts: nfts });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

export async function unstakeBulls(req: Request, res: Response) {
  try {
    const { wallet } = req.body;

    if (!wallet) return res.status(400).json({ message: "Missing wallet!" });

    await createUserIfNotExists(wallet);

    const unstakeData =
      gamubllsContract.interface.encodeFunctionData("unstakeAll");

    return res.status(200).json({
      tx: {
        from: wallet,
        to: gamubllsContract.target,
        data: unstakeData,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function stakeGambulls(req: Request, res: Response) {
  try {
    const { wallet, tokenIds } = req.body;

    if (!wallet) return res.status(400).json({ message: "Missing wallet!" });

    if (!tokenIds)
      return res.status(400).json({ message: "Missing token ids!" });

    await createUserIfNotExists(wallet);

    const approve = gamubllsContract.interface.encodeFunctionData(
      "setApprovalForAll",
      [gamubllsContract.target, true]
    );

    const contractData = gamubllsContract.interface.encodeFunctionData(
      "stakeNft",
      [tokenIds]
    );

    let approveTx: any = {
      from: wallet,
      to: gamubllsContract.target,
      data: approve,
    };

    if (
      await gamubllsContract.isApprovedForAll(wallet, gamubllsContract.target)
    ) {
      approveTx = undefined;
    }

    return res.status(200).json({
      approve: approveTx,
      tx: {
        from: wallet,
        to: gamubllsContract.target,
        data: contractData,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getStakedNfts(_: Request, res: Response) {
  try {
    const client = await createClient({
      url: process.env.REDIS_URL!,
    }).connect();

    const stakedNfts = await client.get("stakedNfts");

    const wallets = await client.get("wallets");

    await client.disconnect();
    if (stakedNfts) {
      return res
        .status(200)
        .json({ stakedNfts: +stakedNfts, wallets: JSON.parse(wallets ?? "") });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to get staked NFTs!", success: false });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message, success: false });
  }
}

export async function unstakeNfts(req: Request, res: Response) {
  try {
    const { wallet, tokenIds } = req.body;
    if (!wallet || !tokenIds) {
      return res.status(400).json({ message: "Invalid body!" });
    }

    const walletStakings = await gamubllsContract.getStakedNfts(wallet);

    await createUserIfNotExists(wallet);

    for (const tokenId of tokenIds) {
      if (
        !walletStakings.find(
          (w: any) => Number(w.tokenId) === tokenId && w.isStaked
        )
      ) {
        return res
          .status(400)
          .json({ message: "You are not owner of some of NFTs!" });
      }
    }

    const tx = gamubllsContract.interface.encodeFunctionData("withdraw", [
      tokenIds,
    ]);

    return res.status(200).json({
      tx: {
        from: wallet,
        to: gamubllsContract.target,
        data: tx,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createUserIfNotExists(wallet: string) {
  const user = await User.findOne({ wallet });

  if (!user) {
    const newUser = new User({
      wallet,
      createdAt: new Date(),
    });

    await newUser.save();
  }
}
