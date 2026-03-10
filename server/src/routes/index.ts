import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.routes";

const router = Router();

router.use(healthRouter);
router.use(authRouter);

export default router;