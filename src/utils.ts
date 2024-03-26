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

export const polygonRpc = new ethers.JsonRpcProvider(
  "https://rpc.ankr.com/polygon_mumbai"
);

export const ethRpc = new ethers.JsonRpcProvider(process.env.ETH_RPC!);

export const ethAuthority = new ethers.Wallet(
  "4c6e4c7a132e77ce08fde421b03cade00762d6b0dc5c644820e916f9cc7ab666",
  ethRpc
);

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
