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
  // getTransactionSuggestions,
} from "../controller/accountController.js";

const router = express.Router();

router.get("/home/:dashboardId", requireAuth , getDashboard);

router.post("/add", requireAuth , upload.single("attachment"), addTransaction);
// router.get("/categories", requireAuth, getAllCategories);
// router.get("/tags", requireAuth, getSuggestedTags);

// router.get("/suggestions", requireAuth, getTransactionSuggestions );
router.get("/categories", requireAuth, getUserCategories);
router.post("/categories", requireAuth, updateUserCategories);

router.get("/tags", requireAuth, getUserTags);
router.post("/tags", requireAuth, updateUserTags);

// router.get("/payment-modes",requireAuth, getPaymentModeStats);
router.get("/payment-modes/:dashboardId",requireAuth, getPaymentModeStats);

router.get("/:id", requireAuth , getSingleRecord);
router.put("/edit/:id", requireAuth , upload.single("attachment"), updateTransaction);

router.post("/delete/:id", requireAuth , deleteTransaction);

export default router;
