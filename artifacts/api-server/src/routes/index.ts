import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signScoreRouter from "./sign-score";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signScoreRouter);
router.use(leaderboardRouter);

export default router;
