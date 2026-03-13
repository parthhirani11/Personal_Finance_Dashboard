import Settlement from "../models/Settlement.js";
import Account from "../models/Account.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

export const paySettlement = async (req, res) => {
  try {

    if (!req.session?.user?.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const currentUserId = req.session.user.id;
    const settlementId = req.params.id;

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
      userId: currentUserId,
      settlementStatus:"settled",
      paymentMode:"settlement"
    });

        if(exists){
        return res.json({message:"Already recorded"});
    }

    if (settlement.status === "settled")
      return res.status(400).json({ msg: "Already settled" });

    settlement.status = "settled";
    settlement.settledAt = new Date();

    await settlement.save();

    // update account records

    await Account.updateMany(
      { settlementId, paymentMode: { $ne: "settlement" } },
      { 
        settlementStatus: "settled",
        paymentMode: "settlement"
      }
    );

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
      title: "Settlement received",
      message: `₹${settlement.amount} received`,
      type: "settlement"
    });

    await Notification.create({
      userId: settlement.toUserId,
      title: "Settlement paid",
      message: `₹${settlement.amount} paid`,
      type: "settlement"
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

