// routes/account.js pass the data
import express from "express";
import {requireAuth } from "../middleware/authmid.js";
import { upload } from "../middleware/upload.js";
import { getDashboard, addTransaction, updateTransaction, getSingleRecord,
  getUserCategories,
  updateUserCategories,
  getUserTags,
  updateUserTags, 
  getPaymentModeStats,
  deleteTransaction,
  getSettlementHistory,
} from "../controller/accountController.js";

const router = express.Router();

router.get("/home/:dashboardId", requireAuth , getDashboard);

router.post("/add", requireAuth , upload.single("attachment"), addTransaction);

router.get("/categories", requireAuth, getUserCategories);
router.post("/categories", requireAuth, updateUserCategories);

router.get("/tags", requireAuth, getUserTags);
router.post("/tags", requireAuth, updateUserTags);


router.get("/payment-modes/:dashboardId",requireAuth, getPaymentModeStats);
router.get("/history", requireAuth, getSettlementHistory);

router.put("/edit/:id", requireAuth , upload.single("attachment"), updateTransaction);

router.get("/:id", requireAuth , getSingleRecord);

router.post("/delete/:id", requireAuth , deleteTransaction);

export default router;
