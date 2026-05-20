import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signScoreRouter from "./sign-score";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signScoreRouter);

export default router;
