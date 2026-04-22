import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import chatRouter from "./chat";
import suggestionsRouter from "./suggestions";
import pushRouter from "./push";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(chatRouter);
router.use(suggestionsRouter);
router.use(pushRouter);
router.use("/auth", authRouter);

export default router;
