import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import chatRouter from "./chat";
import suggestionsRouter from "./suggestions";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(chatRouter);
router.use(suggestionsRouter);
router.use(pushRouter);

export default router;
