import mongoose from "mongoose";
import { connectToDb, TransferNfts, User } from "../db";

export async function main() {
  await connectToDb();

  const allTransfers = await TransferNfts.find();

  const wallets = new Set();

  allTransfers.forEach((t) => {
    wallets.add(t.wallet);
  });

  const users = Array.from(wallets).map(
    (w) => new User({ wallet: w, createdAt: new Date() })
  );

  await User.insertMany(users);

  console.log(`Inserted ${users.length} users in db!`);
}

main()
  .then(() => {
    console.log(`Finished user script!`);
  })
  .catch((err) => console.log(err));
