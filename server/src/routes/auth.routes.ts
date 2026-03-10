import { Router } from "express";
import { register } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/auth/register", register);

export default authRouter;