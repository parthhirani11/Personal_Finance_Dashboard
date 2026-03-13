import express from "express";
import { getUserByUserId  } from "../controller/userController.js";

const router = express.Router();

// GET user by email
router.get("/by-userid", getUserByUserId );

export default router;