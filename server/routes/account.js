// routes/account.js
import express from "express";
import {requireAuth } from "../middleware/authmid.js";
import { upload } from "../middleware/upload.js";
import { getDashboard, addTransaction, updateTransaction,getSingleRecord,getSuggestedTags,getAllCategories,
  deleteTransaction, } from "../controller/accountController.js";

const router = express.Router();

router.get("/home", requireAuth , getDashboard);

router.post("/add", requireAuth , upload.single("attachment"), addTransaction);
router.get("/categories", requireAuth, getAllCategories);
router.get("/tags", requireAuth, getSuggestedTags);

router.get("/:id", requireAuth , getSingleRecord);
router.put("/edit/:id", requireAuth , upload.single("attachment"), updateTransaction);

router.post("/delete/:id", requireAuth , deleteTransaction);
// router.get("/categories", getAllCategories);
export default router;
