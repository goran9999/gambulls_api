import z from "zod";
import { ShadowFile, ShdwDrive } from "@shadow-drive/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import { solanaAuthority } from "../utils";
import { Request, Response } from "express";
import { verifyMessage } from "ethers";
import { User } from "../db";
const UpdateProfileSchema = z.object({
  profilePicture: z.string().optional(),
  messageSig: z.string(),
  wallet: z.string(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  username: z.string().optional(),
  usdcSolWallet: z.string().optional(),
  emailAddress: z.string().optional(),
  banner: z.string().optional(),
  imageUrl: z.string().optional(),
  x: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  discord: z.string().optional(),
});

export async function updateProfile(req: Request, res: Response) {
  try {
    const parsedBody = UpdateProfileSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: "Bad request" });
    }

    const { messageSig, wallet, banner, imageUrl } = parsedBody.data;

    const signerAddress = verifyMessage(
      `Update profile of ${wallet}`,
      messageSig
    );

    if (signerAddress !== wallet) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ wallet });
    if (!user) {
      let bannerUrl = "";
      let imgUrl = "";
      const user = await User.create({
        ...parsedBody.data,
        createdAt: new Date(),
      });

      if (imageUrl) {
        imgUrl = await uploadToShadow(
          user._id.toString(),
          "profile_photo",
          "upload",
          imageUrl
        );
      }
      if (banner) {
        bannerUrl = await uploadToShadow(
          user._id.toString(),
          "banner",
          "upload",
          banner
        );
      }

      const updated = await User.findOneAndUpdate(
        { _id: user._id },
        { banner: bannerUrl, imageUrl: imgUrl },
        { new: true }
      ).lean();

      return res
        .status(200)
        .json({ message: "Updated user profile", user: updated });
    }

    if (!!banner) {
      const bannerUrl = await uploadToShadow(
        user._id.toString(),
        "banner",
        !!user.banner ? "edit" : "upload",
        banner,
        user.banner
      );
      parsedBody.data.banner = bannerUrl;
    }

    if (!!imageUrl) {
      const imgUrl = await uploadToShadow(
        user._id.toString(),
        "profile_photo",
        !!user.imageUrl ? "edit" : "upload",
        imageUrl,
        user.imageUrl
      );
      parsedBody.data.imageUrl = imgUrl;
    }

    const updated = await User.findOneAndUpdate(
      { _id: user._id },
      { ...parsedBody.data },
      { new: true }
    ).lean();

    return res
      .status(200)
      .json({ user: updated, message: "Successfully updated user" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

export async function getUserDetails(req: Request, res: Response) {
  try {
    const { wallet } = req.params;

    const user = await User.findOne({ wallet }).lean();
    return res
      .status(200)
      .json({ message: "Successfully fetched user details", user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function uploadToShadow(
  userId: string,
  type: "banner" | "profile_photo",
  action: "upload" | "edit",
  base64Image: string,
  existingUrl?: string
) {
  const conn = new Connection(
    "https://broken-fluent-telescope.solana-mainnet.quiknode.pro/63d7beb5e5af9fbccc4ab47597e5b24e21360070/"
  );
  const key = new PublicKey("Ah81RcCZwjqj9nyPi1bxTxK6KTYmNdZN91HCQj5kZLqu");
  const drive = await new ShdwDrive(conn, new Wallet(solanaAuthority)).init();

  let url = undefined;
  const encodedImage = Buffer.from(
    base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
    "base64"
  );

  const file: ShadowFile = {
    file: encodedImage,
    name: `${userId}_${type}.png`,
  };

  if (action === "upload") {
    const uploaded = await drive.uploadFile(key, file);
    url = uploaded.finalized_locations[0];
  } else {
    console.log("editACtion,a");
    const editedFile = await drive.editFile(
      key,
      existingUrl!.split("?")[0],
      file
    );
    url = editedFile.finalized_location;
  }

  return `${url}?token=${new Date().toISOString()}`;
}
