import { Alchemy, Network, Wallet } from "alchemy-sdk";
import * as ethers from "ethers";
import erc721Abi from "./abi/ERC721.json";
import gambullsAbi from "./abi/Gambulls.json";
import bulkSender from "./abi/BulkSender.json";

import * as dotenv from "dotenv";

dotenv.config();

export const alchemy = new Alchemy({
  apiKey: "k_ZfWtgIcfTpWMuaWh5tFCgv2yAgvvRm",
  network: Network.MATIC_MAINNET,
});

export const authorities: string[] = JSON.parse(
  process.env.AUTHORITIES!
) as string[];

export const polygonRpc = new ethers.JsonRpcProvider(process.env.POLYGON_RPC!);

export const ethRpc = new ethers.JsonRpcProvider(process.env.ETH_RPC!);

export const ENV = process.env.CHAIN_ENV!;

export const GAMBULLS_POLYGON_CONTRACT = process.env.GAMBULLS_POLYGON_CONTRACT!;
export const GAMBULLS_ETH_CONTRACT = process.env.GAMBULLS_ETH_CONTRACT!;
export const BULK_SENDER = process.env.BULK_SENDER_CONTRACT!;

export const erc721Contract = new ethers.Contract(
  GAMBULLS_POLYGON_CONTRACT,
  erc721Abi,
  polygonRpc
);

export const gamubllsContract = new ethers.Contract(
  GAMBULLS_ETH_CONTRACT,
  gambullsAbi.abi,
  ethRpc
);

export const bulkSenderContract = new ethers.Contract(
  BULK_SENDER,
  bulkSender.abi,
  polygonRpc
);
