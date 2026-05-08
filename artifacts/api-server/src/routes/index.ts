import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import emergenciesRouter from "./emergencies";
import reviewerRouter from "./reviewer";
import volunteerRouter from "./volunteer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(emergenciesRouter);
router.use(reviewerRouter);
router.use(volunteerRouter);

export default router;
