
import Account from "../models/Account.js";
import Dashboard from "../models/Dashboard.js";
import User from "../models/User.js";
import Settlement from "../models/Settlement.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";
import { io } from "../server.js";
import mongoose from "mongoose";
import fs from "fs/promises"; 
import path from "path";
import { syncSettlementAccounts } from "../utils/syncSettlement.js";
// DASHBOARD OUTPUT
export const getDashboard = async (req, res) => {
  try {
    // 🔐 Session check
    if (!req.session?.user?.id) {
      return res.status(401).json({ msg: "Session expired" });
    }

    const userId = req.session.user.id;
    const { dashboardId } = req.params;   // 👈 STEP-5 ADD

    if (!dashboardId) {
      return res.status(400).json({ msg: "DashboardId required" });
    }

    // 📊 Fetch ONLY selected dashboard records
   
    const accounts = await Account.find({
      userId: new mongoose.Types.ObjectId(userId),
      dashboardIds: { $in: [new mongoose.Types.ObjectId(dashboardId)] }
    }).populate("person", "name email")
    .sort({ date: -1 });

    // 💰 Calculate totals (dashboard-wise)
    const totalIncome = accounts
      .filter(a => a.type === "income")
      .reduce((sum, a) => sum + Number(a.amount), 0);

    const totalExpense = accounts
      .filter(a => a.type === "expense")
      .reduce((sum, a) => sum + Number(a.amount), 0);

    // ✅ Response
    res.json({
      transactions: accounts, 
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ADD TRANSACTION
export const addTransaction = async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ msg: "Session expired" });
    }

    const userId = req.session.user.id;

    const {
      dashboardIds,
      type,
      amount,
      person,
      relatedDetails,
      description,
      tags,
      paymentMode,
      date,
      
      settlementEnabled,
      settlementType,
      otherUserId,

    } = req.body;

    if (!dashboardIds || dashboardIds.length === 0) {
      return res.status(400).json({ msg: "Dashboard required" });
    }

    const dashboards = Array.isArray(dashboardIds)
      ? dashboardIds
      : [dashboardIds];

    const parsedTags = tags
      ? [...new Set(tags.split(",").map(t => t.trim()))]
      : [];

    // NORMAL TRANSACTION
    const isSettlement = settlementEnabled === "true" || settlementEnabled === true;

    if (!amount || !type) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    if (!isSettlement && !paymentMode) {
      return res.status(400).json({ msg: "Payment mode required" });
    }

    if (!isSettlement) {
      let personId = null;
      let manualName = null;

      // check if valid ObjectId
      if (mongoose.Types.ObjectId.isValid(person)) {
        personId = new mongoose.Types.ObjectId(person);
      } else {
        manualName = person;
      }

      const records = dashboards.map(did => ({

        userId: new mongoose.Types.ObjectId(userId),

        dashboardIds: [new mongoose.Types.ObjectId(did)],

        type,
        amount: Number(amount),
        person: personId,
        manualPersonName: manualName,
        relatedDetails,
        description,
        tags: parsedTags,
        paymentMode: paymentMode?.toLowerCase(),
        // paymentMode,
        date: date ? new Date(date) : new Date(),
        attachment: req.file ? req.file.filename : null,
        originalName: req.file ? req.file.originalname : null,

        settlementRole: "none",
        settlementStatus: "none",
        createdBy: userId

      }));

      await Account.insertMany(records);
      io.to(userId.toString()).emit("transactionUpdated", {
        dashboardId: dashboards[0]
      });
      return res.json({ message: "Transaction added" });
    }

    // ===============================
      // SETTLEMENT TRANSACTION
    // ===============================

    // find other user
    if (!otherUserId) {
      return res.status(400).json({
        msg: "Other user required for settlement"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({ msg: "Other user not found" });
    }

    // ✅ validate current user's dashboards FIRST
    const validDashboards = await Dashboard.find({
      _id: { $in: dashboards },
      userId
    });

    if (validDashboards.length !== dashboards.length) {
      return res.status(403).json({
        msg: "Invalid dashboard access"
      });
    }

    // find other user's DEFAULT dashboard
    const otherDashboard = await Dashboard.findOne({
      userId: otherUser._id,
      isDefault: true
    });

    if (!otherDashboard) {
      return res.status(404).json({
        msg: "Other user's default dashboard not found"
      });
    }

    if (otherUser._id.toString() === userId.toString()) {
      return res.status(400).json({
        msg: "You cannot create settlement with yourself"
      });
    }
    const payerUserId =
      settlementType === "receivable"
        ? otherUser._id
        : userId;

    const receiverUserId =
      settlementType === "receivable"
        ? userId
        : otherUser._id;

   const payerDashboardId =
      settlementType === "receivable"
        ? otherDashboard._id
        : dashboards[0];

    const receiverDashboardId =
      settlementType === "receivable"
        ? dashboards[0]
        : otherDashboard._id;

    const settlement = await Settlement.create({

      fromUserId: payerUserId,
      toUserId: receiverUserId,

      fromDashboardId: payerDashboardId,
      toDashboardId: receiverDashboardId,

      amount: Number(amount),

      status: "pending"
    });

    if (req.body.paymentMode === "settlement") {
      return res.status(400).json({ message: "Use settlement API for settlements" });
    }

    // ✅ current user record
    await Account.create({

      userId: new mongoose.Types.ObjectId(userId),
      dashboardIds: [new mongoose.Types.ObjectId(dashboards[0])],
      type:
        settlementType === "receivable"
          ? "expense"
          : "income",
      amount: Number(amount),
      person: new mongoose.Types.ObjectId(otherUser._id),  
      relatedDetails,
      description,
      tags: parsedTags,
      attachment: req.file ? req.file.filename : null,
      originalName: req.file ? req.file.originalname : null,
      paymentMode: isSettlement ? null : paymentMode,
      date: date ? new Date(date) : new Date(),

      settlementId: settlement._id,
      settlementRole:
        payerUserId.toString() === userId.toString()
          ? "payable"
          : "receivable",
      settlementStatus: "pending",
      otherUserId,
      otherDashboardId: otherDashboard._id,
      createdBy: userId
    });


    // ✅ other user record
    await Account.create({

      userId: new mongoose.Types.ObjectId(otherUser._id),
      
      dashboardIds: [new mongoose.Types.ObjectId(otherDashboard._id)],
      type:
        settlementType === "receivable"
          ? "income"
          : "expense",
      amount: Number(amount),
      person: new mongoose.Types.ObjectId(userId),
      relatedDetails,
      description,
      tags: parsedTags,
      attachment: req.file ? req.file.filename : null,
      originalName: req.file ? req.file.originalname : null,
      paymentMode: isSettlement ? null : paymentMode,
      date: date ? new Date(date) : new Date(),

      settlementId: settlement._id,
      settlementRole:
        payerUserId.toString() === otherUser._id.toString()
          ? "payable"
          : "receivable",
      settlementStatus: "pending",
      otherUserId: userId,
      otherDashboardId: otherDashboard._id,
      createdBy: userId
    });

    await sendEmail(
      otherUser.email,
      req.session.user.name,
      amount,
      validDashboards[0].name
    );

    const isReceiver = settlementType === "receivable";

    const notificationMessage = isReceiver
      ? `You need to pay ₹${amount} to ${req.session.user.name}`
      : `${req.session.user.name} will pay you ₹${amount}`;

    await Notification.create({
      userId: otherUser._id,
      title: `Settlement with ${req.session.user.name}`,
      message: notificationMessage,
      type: "settlement",
      settlementId: settlement._id,
      status: "pending" 
    });

    io.to(otherUser._id.toString()).emit("newNotification",{
      title:`Settlement with ${req.session.user.name}`,
      message: notificationMessage
    });
    // 🔥 sender (current user)
    io.to(userId.toString()).emit("transactionUpdated", {
      dashboardId: dashboards[0]
    });

    io.to(otherUser._id.toString()).emit("transactionUpdated", {
      dashboardId: otherDashboard._id
    });
      res.json({
        message: "Settlement transaction added"
      });
   
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
  }
};


// EDIT PAGE 
export const getEditTransaction = async (req, res) => {
  const record = await Account.findOne({
    _id: req.params.id,
    userId: req.session.user.id
  })
  .populate({ path: "person", select: "name email" })
  .populate({ path: "otherUserId", select: "name email" })
  .lean();

  res.json(record);
};

// update
export const updateTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      person,
      paymentMode,
      relatedDetails,
      description,
      tags,
      dashboardId,
      settlementType
    } = req.body;

    const userId = req.session.user.id;

    const txn = await Account.findById(req.params.id);
    if (!txn) return res.status(404).json({ msg: "Transaction not found" });

    // ===============================
    // 🔹 OLD DATA
    // ===============================
    const oldData = {
      amount: txn.amount,
      type: txn.type,
      paymentMode: txn.paymentMode || "",
      relatedDetails: txn.relatedDetails || "",
      description: txn.description || "",
      tags: (txn.tags || []).join(","),
    };

    // ===============================
    // 🔹 NEW DATA
    // ===============================
    const newTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase())
      : (tags ? [tags.trim().toLowerCase()] : []);

    const newData = {
      amount: Number(amount),
      type,
      paymentMode: paymentMode || "",
      relatedDetails: relatedDetails || "",
      description: description || "",
      tags: newTags.sort().join(",")
    };

    const oldDashboardId = txn.dashboardIds?.[0]?.toString();

    // ===============================
    // 🔹 SAFE CHANGE CHECK
    // ===============================
    const amountChanged = Number(oldData.amount) !== Number(newData.amount);
    const typeChanged = oldData.type !== newData.type;
    const paymentModeChanged =
      (oldData.paymentMode || "") !== (newData.paymentMode || "");
    const relatedChanged =
      (oldData.relatedDetails || "") !== (newData.relatedDetails || "");
    const descriptionChanged =
  (oldData.description || "").trim() !== (newData.description || "").trim();
    const tagsChanged =
      (oldData.tags || "") !== (newData.tags || "");

    const isDataChanged =
      amountChanged ||
      typeChanged ||
      paymentModeChanged ||
      relatedChanged ||
      descriptionChanged ||
      tagsChanged;

    // ===============================
    // 🔹 UPDATE DATA
    // ===============================
    const updateData = {
      type,
      amount: Number(amount),
      paymentMode: paymentMode || "",
      relatedDetails: relatedDetails || "",
      description: description || "",
      tags: newTags,
    };

    // ===============================
    // 🔹 PERSON
    // ===============================
    if (!txn.settlementId && person) {
      if (mongoose.Types.ObjectId.isValid(person)) {
        updateData.person = new mongoose.Types.ObjectId(person);
        updateData.manualPersonName = null;
      } else {
        updateData.manualPersonName = person;
        updateData.person = null;
      }
    }

    if (txn.settlementId) {
      updateData.manualPersonName = null;
    }

    // ===============================
    // 🔹 DASHBOARD
    // ===============================
    if (dashboardId) {
      updateData.dashboardIds = [new mongoose.Types.ObjectId(dashboardId)];
    }

    // ===============================
    // 🔹 ATTACHMENT
    // ===============================
    if (req.file) {
      if (txn.attachment) {
        const filePath = path.join("uploads", txn.attachment);
        await fs.unlink(filePath).catch(() => {});
      }

      updateData.attachment = req.file.filename;
      updateData.originalName = req.file.originalname;
    }

    // ====================================================
    // 🔥 SETTLEMENT TRANSACTION
    // ====================================================
    if (txn.settlementId) {
      
      const settlement = await Settlement.findById(txn.settlementId);
      
      if (dashboardId) {
        if (txn.userId.toString() === settlement.fromUserId.toString()) {
          settlement.fromDashboardId = new mongoose.Types.ObjectId(dashboardId);
        } else {
          settlement.toDashboardId = new mongoose.Types.ObjectId(dashboardId);
        }

        await settlement.save();
        await syncSettlementAccounts(settlement); // 🔥 બધા accounts update
      }

      // ❌ settled → only self
      if (txn.settlementStatus === "settled") {
        await Account.findOneAndUpdate(
          { _id: req.params.id, userId },
          updateData
        );
        return res.json({ success: true });
      }

      // ✅ pending → both update
      settlement.amount = Number(amount);

      const accounts = await Account.find({
        settlementId: txn.settlementId
      });

      for (let acc of accounts) {
        const isCurrentUser = acc.userId.toString() === userId;

        let updatedType = acc.type;
        let updatedRole = acc.settlementRole;

        if (settlementType) {
          if (settlementType === "receivable") {
            updatedType = isCurrentUser ? "expense" : "income";
            updatedRole = isCurrentUser ? "receivable" : "payable";
          } else {
            updatedType = isCurrentUser ? "income" : "expense";
            updatedRole = isCurrentUser ? "payable" : "receivable";
          }
        }

        await Account.findByIdAndUpdate(acc._id, {
          amount: Number(amount),
          type: updatedType,
          settlementRole: updatedRole,
          relatedDetails: relatedDetails || "",
          description: description || "",
          tags: newTags,
          paymentMode: paymentMode || acc.paymentMode,
          person: acc.person,
          manualPersonName: acc.manualPersonName,

          ...(req.file && {
            attachment: req.file.filename,
            originalName: req.file.originalname
          })
        });
      }

      // ===============================
      // 🔔 NOTIFICATION (FINAL FIX)
      // ===============================
      const otherUserId =
        txn.userId.toString() === settlement.fromUserId.toString()
          ? settlement.toUserId
          : settlement.fromUserId;
      const dashboardChanged =
           dashboardId && dashboardId !== oldDashboardId;
     
      const shouldNotify = isDataChanged && !dashboardChanged;
      if (shouldNotify) {
        const isReceiver =
          settlementType
            ? settlementType === "receivable"
            : txn.settlementRole === "receivable";

        const message = isReceiver
          ? `You will receive ₹${amount} (updated)`
          : `You need to pay ₹${amount} (updated)`;

        await Notification.create({
          userId: otherUserId,
          title: "Settlement Updated",
          message,
          type: "settlement",
          settlementId: settlement._id,
          status: "pending"
        });

        io.to(otherUserId.toString()).emit("newNotification", {
          title: "Settlement Updated",
          message
        });
      }

      // 🔹 SOCKET
      io.to(settlement.fromUserId.toString()).emit("transactionUpdated", {
        dashboardId: settlement.fromDashboardId
      });

      io.to(settlement.toUserId.toString()).emit("transactionUpdated", {
        dashboardId: settlement.toDashboardId
      });

      const updatedTxn = await Account.findById(req.params.id).lean();
      return res.json({ success: true, transaction: updatedTxn });
    }

    // ====================================================
    // 🔹 NORMAL TRANSACTION
    // ====================================================
    await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData
    );

    io.to(userId.toString()).emit("transactionUpdated", {
      dashboardId: dashboardId || txn.dashboardIds[0]
    });

    const updatedTxn = await Account.findById(req.params.id).lean();
    return res.json({ success: true, transaction: updatedTxn });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE

export const deleteTransaction = async (req, res) => {
  try {
    const txn = await Account.findById(req.params.id);

    if (!txn) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // ✅ FIX 1: security (createdBy → userId)
    if (
      txn.settlementStatus === "pending" &&
      txn.userId.toString() !== req.session.user.id
    ) {
      return res.status(403).json({
        msg: "You cannot delete this settlement transaction"
      });
    }

    // 🟡 FILE DELETE
    if (txn.attachment) {
      try {
        const filePath = path.join("uploads", txn.attachment);
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Delete file error:", err.message);
      }
    }

    // ⭐ settlement transaction
    if (txn.settlementId) {

      // ✅ FIX 2: always check Settlement model
      const settlement = await Settlement.findById(txn.settlementId);

      if (settlement && settlement.status === "pending") {

        // 🔥 FIX 3: first delete settlement
        await Settlement.findByIdAndDelete(txn.settlementId);

        // 🔥 FIX 4: then delete all related accounts
        await Account.deleteMany({
          settlementId: txn.settlementId
        });

        await Notification.deleteMany({
          settlementId: txn.settlementId
        });


      } else {

        // settled → only current user records delete
        await Account.deleteMany({
          settlementId: txn.settlementId,
          userId: req.session.user.id
        });

      }

    } else {

      // normal transaction
      await Account.deleteOne({
        _id: req.params.id,
        userId: req.session.user.id
      });

    }

    io.to(req.session.user.id).emit("transactionUpdated", {
      dashboardId: txn.dashboardIds[0]
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
};


// fetch recode
export const getSingleRecord = async (req, res) => {
  try {
     const userId = req.session.user.id;
    const { id } = req.params;
    const record = await Account.findOne({
      _id: id,
      userId,
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getUserCategories = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.json(user.categories || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    const cleaned = [
      ...new Set(
        categories
          .map(c => c.trim().toLowerCase())
          .filter(Boolean)
      )
    ];

    await User.findByIdAndUpdate(req.session.user.id, {
      categories: cleaned,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getUserTags = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.json(user.tags || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserTags = async (req, res) => {
  try {
    const { tags } = req.body;

    const cleaned = [
      ...new Set(
        tags
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
      )
    ];

    await User.findByIdAndUpdate(req.session.user.id, {
      tags: cleaned,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// SUGGESTION PAYMENT MODE DATA

export const getPaymentModeStats = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { dashboardId } = req.params;

    if (!dashboardId) {
      return res.status(400).json({ msg: "DashboardId required" });
    }

    const stats = await Account.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dashboardIds: { $in: [new mongoose.Types.ObjectId(dashboardId)] },
          
          paymentMode: { $ne: "settlement" } 
        }
      },
      {
        $project: {
          paymentMode: { $toLower: "$paymentMode" }
        }
      },
      {
        $group: {
          _id: "$paymentMode",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error("Payment mode stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


export const getSettlementHistory = async (req,res)=>{

const userId = new mongoose.Types.ObjectId(req.session.user.id);

const data = await Settlement.find({
 status:"settled",
 $or:[
  {fromUserId:userId},
  {toUserId:userId}
 ]
});

 res.json(data);

};
