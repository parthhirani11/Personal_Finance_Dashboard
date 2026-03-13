// routes/account.js pass the data
import express from "express";
import {requireAuth } from "../middleware/authmid.js";

import { getDashboards, createDashboard, renameDashboard,deleteDashboard, getDashboardsByUserId} from "../controller/dashboardController.js";

const router = express.Router();
router.get("/", requireAuth, getDashboards);
router.post("/", requireAuth, createDashboard);
router.put("/:id", requireAuth, renameDashboard);
router.delete("/:id", requireAuth, deleteDashboard); 

router.get("/user/:userId", getDashboardsByUserId);

export default router;


