import Settlement from "../models/Settlement.js";
import Account from "../models/Account.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { syncSettlementAccounts } from "../utils/syncSettlement.js";


export const paySettlement = async (req, res) => {
  try {

    if (!req.session?.user?.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const settlementId = req.params.id;
    const currentUserId = req.session.user.id;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement)
      return res.status(404).json({ msg: "Settlement not found" });

    // ✅ SECURITY CHECK
    if (
      settlement.fromUserId.toString() !== currentUserId &&
      settlement.toUserId.toString() !== currentUserId
    ) {
      return res.status(403).json({
        msg: "You cannot settle this transaction"
      });
    }

  
    const exists = await Account.findOne({
      settlementId,
      paymentMode: "settlement"
    });

    if (exists) {
      return res.json({ message: "Already recorded" });
    }

    if (settlement.status === "settled")
      return res.status(400).json({ msg: "Already settled" });

    settlement.status = "settled";
    settlement.settledAt = new Date();

    await settlement.save();
  

    await Account.updateMany(
      { settlementId, userId: settlement.fromUserId },
      { 
        settlementStatus: "settled",
        paymentMode: null,
        dashboardIds: [settlement.fromDashboardId]   // 🔥 ADD THIS
      }
    );

    await Account.updateMany(
      { settlementId, userId: settlement.toUserId },
      { 
        settlementStatus: "settled",
        paymentMode: null,
        dashboardIds: [settlement.toDashboardId]   // 🔥 ADD THIS
      }
    );
    console.log("FROM DASHBOARD:", settlement.fromDashboardId);
    console.log("TO DASHBOARD:", settlement.toDashboardId);
    const originalTxn = await Account.findOne({
      settlementId: settlementId,
      paymentMode: { $ne: "settlement" }
    });

    const payerId = settlement.fromUserId;
    const receiverId = settlement.toUserId;

    // payer record
    await Account.create({
      userId: payerId,
      dashboardIds: [settlement.fromDashboardId],

      type: "expense",
      amount: settlement.amount,
      paymentMode: "settlement",

      settlementId: settlement._id,
      settlementRole: "payable",
      settlementStatus: "settled",

      person: receiverId,

      description: originalTxn?.description || "",
      tags: originalTxn?.tags || [],
      category: originalTxn?.category || "",
      attachment: originalTxn?.attachment || "",
      originalName: originalTxn?.originalName || "",   // ⭐ ADD THIS
      date: new Date(),
      createdBy: currentUserId
    });


    await Account.create({
      userId: receiverId,
      dashboardIds: [settlement.toDashboardId],

      type: "income",
      amount: settlement.amount,
      paymentMode: "settlement",

      settlementId: settlement._id,
      settlementRole: "receivable",
      settlementStatus: "settled",

      person: payerId,

      description: originalTxn?.description || "",
      tags: originalTxn?.tags || [],
      category: originalTxn?.category || "",
      attachment: originalTxn?.attachment || "",
      originalName: originalTxn?.originalName || "",   // ⭐ ADD THIS


      date: new Date(),
      createdBy: currentUserId
    });

    // notifications
    await Notification.create({
      userId: settlement.fromUserId,
      title: "Settlement Paid",
      message: `You paid ₹${settlement.amount}`,
      type: "settlement",
      status: "settled"
    });

    await Notification.create({
      userId: settlement.toUserId,
      title: "Settlement Received",
      message: `You received ₹${settlement.amount}`,
      type: "settlement",
      status: "settled"
    });

    res.json({ message: "Settlement completed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getPendingSettlements = async (req,res)=>{

  const userId = new mongoose.Types.ObjectId(req.session.user.id);
  const data = await Settlement.find({
    status:"pending",
    $or:[
      {fromUserId:userId},
      {toUserId:userId}
    ]
  })
  .populate("fromUserId","name email")
  .populate("toUserId","name email");

  res.json(data);

};

export const moveDashboard = async (req, res) => {
  try {
    const { settlementId, dashboardId } = req.body;

    if (!settlementId || !dashboardId) {
      return res.status(400).json({ msg: "Missing data" });
    }

    const currentUserId = req.session.user.id;

    // ✅ find settlement
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({ msg: "Settlement not found" });
    }

    // ✅ check which user is updating
    if (settlement.toUserId.toString() === currentUserId) {
      settlement.toDashboardId = new mongoose.Types.ObjectId(dashboardId);
    } else if (settlement.fromUserId.toString() === currentUserId) {
      settlement.fromDashboardId = new mongoose.Types.ObjectId(dashboardId);
    } else {
      return res.status(403).json({ msg: "Not allowed" });
    }

    await settlement.save();

    // 🔥 IMPORTANT
    await syncSettlementAccounts(settlement);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};