import Express from "express";
import { getUserDetails, updateProfile } from "./user.service";

export const UserRouter = Express.Router();

UserRouter.patch("/update_profile", updateProfile).get(
  "/:wallet",
  getUserDetails
);
