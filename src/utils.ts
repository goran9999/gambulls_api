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

export const GAMBULLS_POLYGON_CONTRACT =
  "0xc1a5f386e3b2d3cb280191fcd11e76c41117197d";
export const GAMBULLS_ETH_CONTRACT =
  "0x8A2edD3686Da98A0d2C92db4273c047039E5A6b2";
export const BULK_SENDER = "0x8A2edD3686Da98A0d2C92db4273c047039E5A6b2";

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
