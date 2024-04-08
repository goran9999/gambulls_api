import { Request, Response } from "express";
import { Status } from "prisma/prisma-client";
import z from "zod";
import { TransactionStatus, TransferNfts } from "../db";
import mongoose from "mongoose";
import {
  alchemy,
  bulkSenderContract,
  BULK_SENDER,
  ENV,
  erc721Contract,
  ethRpc,
  GAMBULLS_ETH_CONTRACT,
  GAMBULLS_POLYGON_CONTRACT,
  gamubllsContract,
  polygonRpc,
} from "../utils";
import { ethers } from "ethers";
import axios from "axios";
import { Alchemy, Network } from "alchemy-sdk";
import logger from "../logger";
import { Authority } from "./authorities";

const MAX_GAS = 35; //in gwei

const GenerateSentPolygonSchema = z.object({
  tokenIds: z.array(z.number()),
  wallet: z.string(),
});

export async function generateSendPolygonNft(req: Request, res: Response) {
  try {
    const parsedPayload = GenerateSentPolygonSchema.safeParse({ ...req.body });

    if (!parsedPayload.success) {
      return res.status(400).json({ message: "Invalid body!" });
    }
    const { wallet } = parsedPayload.data;

    const approve = erc721Contract.interface.encodeFunctionData(
      "setApprovalForAll",
      [BULK_SENDER, true]
    );

    const isApprovedForAll = await erc721Contract.isApprovedForAll(
      wallet,
      BULK_SENDER
    );

    if (isApprovedForAll) {
      return res
        .status(200)
        .json({ message: "All nfts are already approved", success: true });
    }

    const tx = {
      from: wallet,
      to: GAMBULLS_POLYGON_CONTRACT,
      data: approve,
    };

    return res
      .status(200)
      .json({ transaction: JSON.stringify(tx), success: true });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

const ExecutePolygonTransferHash = z.object({
  tokenIds: z.array(z.number()),
  wallet: z.string(),
});

export async function submitPolygonTransferTransaction(
  req: Request,
  res: Response
) {
  try {
    const parsedData = ExecutePolygonTransferHash.safeParse({ ...req.body });

    if (!parsedData.success) {
      return res.status(400).json({ message: "Invalid body!" });
    }

    const gas = await getGasPrice();

    if (gas > MAX_GAS) {
      return res.status(400).json({ message: "Gas too high!" });
    }
    const { tokenIds, wallet } = parsedData.data;

    if (tokenIds.length === 0) {
      return res.status(400).json({ message: "Missing NFTs!" });
    }

    logger.info(tokenIds + " token ids");
    const previousTransfers = await TransferNfts.find({
      tokenIds: { $in: tokenIds },
      status: { $ne: TransactionStatus.Requested },
    });

    if (previousTransfers.length > 0) {
      return res
        .status(400)
        .json({ message: "You already bridged some of nfts!" });
    }

    const existingTransfer = new TransferNfts({
      wallet,
      tokenIds,
      status: TransactionStatus.Requested,
    });

    await Promise.all(
      tokenIds.map(async (t) => {
        if ((await erc721Contract.ownerOf(t)) !== wallet) {
          return res
            .status(400)
            .json({ message: "You are not owner of some of NFTs!" });
        }
      })
    );

    logger.info("Starting migration...");
    const isApprovedForAll = erc721Contract.isApprovedForAll(
      wallet,
      BULK_SENDER
    );
    if (!isApprovedForAll) {
      return res
        .status(400)
        .json({ message: "Nfts are not approved!", success: false });
    }

    const authority = new ethers.Wallet(
      Authority.getInstance().getAuthority(),
      polygonRpc
    );

    const data = bulkSenderContract.interface.encodeFunctionData("bulkSend", [
      tokenIds,
      existingTransfer.wallet,
    ]);
    const rawBulkSendTx = {
      from: authority.address,
      to: BULK_SENDER,
      data,
    };

    const tx = await authority.sendTransaction(rawBulkSendTx);

    const sendReceipt = await tx.wait();

    logger.info("Sent polygon nfts!..." + sendReceipt?.hash);

    existingTransfer.status = TransactionStatus.TransferredPolygon;
    existingTransfer.polygonTransferHash = sendReceipt?.hash ?? "";
    existingTransfer.tokenIds = tokenIds;
    console.log(existingTransfer, "EEEE", tokenIds);
    await existingTransfer.save();

    const mintData = gamubllsContract.interface.encodeFunctionData("mintNfts", [
      wallet,
      tokenIds,
    ]);

    const ethAuthority = new ethers.Wallet(
      Authority.getInstance().getAuthority(),
      ethRpc
    );

    const mintTxRaw = {
      from: ethAuthority.address,
      to: GAMBULLS_ETH_CONTRACT,
      data: mintData,
    };

    const mintTx = await ethAuthority.sendTransaction(mintTxRaw);
    const mintReceipt = await mintTx.wait();
    logger.info("Finsihed bridge: ");
    logger.info(mintReceipt?.hash);

    existingTransfer.status = TransactionStatus.Finished;
    existingTransfer.etherumMintHash = mintReceipt?.hash ?? "";
    await existingTransfer.save();
    return res.status(200).json({ message: "Successully bridged assets!" });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({ message: "Failed. Please try again!" });
  }
}

export async function getWalletClaimableNfts(req: Request, res: Response) {
  const wallet = req.params["wallet"];

  if (!wallet) {
    return res.status(400).json({ message: "Missing wallet!" });
  }

  const claimable = await TransferNfts.find({
    wallet: wallet,
    status: TransactionStatus.TransferredPolygon,
  });

  const alchemy = new Alchemy({
    apiKey: "k_ZfWtgIcfTpWMuaWh5tFCgv2yAgvvRm",
    network:
      ENV === "development" ? Network.MATIC_MUMBAI : Network.MATIC_MAINNET,
  });
  const nfts: { id: string; name: string; image: string; mint: string }[] = [];
  for (let c of claimable) {
    for (let tokenId of c.tokenIds) {
      try {
        const nftData = await alchemy.nft.getNftMetadata(
          GAMBULLS_POLYGON_CONTRACT,
          Number(tokenId)
        );

        console.log(nftData.name);
        nfts.push({
          id: tokenId.toString(),
          image: nftData.image.originalUrl ?? "",
          name: nftData.name ?? "",
          mint: tokenId.toString(),
        });
      } catch (error) {}
    }
  }

  return res.status(200).json({ data: nfts });
}

export async function retryMint(req: Request, res: Response) {
  try {
    const wallet = req.params["wallet"];
    if (!wallet) {
      return res.status(400).json({ message: "Missing wallet address!" });
    }

    const gas = await getGasPrice();

    if (gas > MAX_GAS) {
      return res.status(400).json({ message: "Gas too high!" });
    }

    const claimable = await TransferNfts.find({
      wallet: wallet,
      status: TransactionStatus.TransferredPolygon,
    });

    const tokenIds = claimable.map((c) => c.tokenIds).flat();

    const mintData = gamubllsContract.interface.encodeFunctionData("mintNfts", [
      wallet,
      tokenIds,
    ]);

    const ethAuthority = new ethers.Wallet(
      Authority.getInstance().getAuthority(),
      ethRpc
    );

    const mintTxRaw = {
      from: ethAuthority.address,
      to: GAMBULLS_ETH_CONTRACT,
      data: mintData,
    };
    const mintTx = await ethAuthority.sendTransaction(mintTxRaw);
    const mintReceipt = await mintTx.wait();
    logger.info("Finsihed bridge!...");

    await Promise.all(
      claimable.map(async (c) => {
        c.status = TransactionStatus.Finished;
        c.etherumMintHash = mintReceipt?.hash ?? "";
        await c.save();
      })
    );

    return res.status(200).json({ message: "Successully bridged assets!" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

async function getGasPrice() {
  const gas = (await ethRpc.getFeeData()).gasPrice;

  if (gas) {
    const gwei = ethers.formatUnits(gas, "gwei");

    logger.info("Gwei gas: " + gwei);
    return gwei;
  }

  return 0;
}
