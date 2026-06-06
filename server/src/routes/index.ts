import {Router} from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);

export default router;