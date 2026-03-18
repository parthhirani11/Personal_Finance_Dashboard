import express from "express";

import { requireAuth }
from "../middleware/authmid.js";

import { paySettlement, getPendingSettlements, moveDashboard }
from "../controller/settlementController.js";

const router = express.Router();

router.post("/pay/:id", requireAuth, paySettlement);

router.get("/pending", requireAuth, getPendingSettlements);

router.post("/move-dashboard", moveDashboard);

export default router;