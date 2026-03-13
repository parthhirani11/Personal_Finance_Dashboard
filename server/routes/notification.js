import express from "express";

import {requireAuth}
from "../middleware/authmid.js";

import {
getNotifications,
markRead
}
from "../controller/notificationController.js";

const router = express.Router();

router.get("/",requireAuth,getNotifications);

router.post("/read/:id", requireAuth, markRead);

export default router;