import {Router, Response} from "express";
import {authMiddleware, AuthRequest} from "../middlewares/auth.middleware";

const userRouter = Router();

userRouter.get("/users/me", authMiddleware, (req: AuthRequest, res: Response) => {
    return res.status(200).json({
        message: "Authenticated user",
        user: req.user,
    });
});

export default userRouter;