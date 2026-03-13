
import Account from "../models/Account.js";
import Dashboard from "../models/Dashboard.js";
import User from "../models/User.js";
import Settlement from "../models/Settlement.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";
import { io } from "../server.js";
import mongoose from "mongoose";

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
      dashboardIds: new mongoose.Types.ObjectId(dashboardId)
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
      
      // NEW FIELDS
      settlementEnabled,
      settlementType,
      otherUserId,
      otherDashboardId

    } = req.body;

    if (!dashboardIds || dashboardIds.length === 0) {
      return res.status(400).json({ msg: "Dashboard required" });
    }

    // if (!amount || !paymentMode || !type) {
    //   return res.status(400).json({ msg: "Missing required fields" });
    // }

    const dashboards = Array.isArray(dashboardIds)
      ? dashboardIds
      : [dashboardIds];

    const parsedTags = tags
      ? [...new Set(tags.split(",").map(t => t.trim()))]
      : [];

    // NORMAL TRANSACTION
    const isSettlement = settlementEnabled === "true";

if (!amount || !type) {
  return res.status(400).json({ msg: "Missing required fields" });
}

if (!isSettlement && !paymentMode) {
  return res.status(400).json({ msg: "Payment mode required" });
}

    if (!isSettlement) {

      const records = dashboards.map(did => ({

        userId: new mongoose.Types.ObjectId(userId),

        dashboardIds: [new mongoose.Types.ObjectId(did)],

        type,
        amount: Number(amount),

        person: null,
        manualPersonName: person || null,
        relatedDetails,
        description,
        tags: parsedTags,
        paymentMode,

        date: date ? new Date(date) : new Date(),
        attachment: req.file ? req.file.filename : null,
        originalName: req.file ? req.file.originalname : null,

        settlementRole: "none",
        settlementStatus: "none",

        createdBy: userId

      }));

      await Account.insertMany(records);

      return res.json({ message: "Transaction added" });
    }

    // ===============================
      // SETTLEMENT TRANSACTION
    // ===============================

    // find other user
    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({ msg: "Other user not found" });
    }

    // const otherUserId = otherUser._id;


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

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
  return res.status(400).json({ msg: "Invalid user id" });
}

    // ✅ validate other user's dashboard FIRST
    const otherDashboard = await Dashboard.findOne({
  _id: otherDashboardId,
  userId: otherUser._id
});

    if (!otherDashboard) {
      return res.status(404).json({
        msg: "Other user's dashboard not found"
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
    ? otherDashboardId
    : dashboards[0];

const receiverDashboardId =
  settlementType === "receivable"
    ? dashboards[0]
    : otherDashboardId;

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
      otherDashboardId,

      createdBy: userId
    });


    // ✅ other user record
    await Account.create({

    userId: new mongoose.Types.ObjectId(otherUser._id),
    
    dashboardIds: [new mongoose.Types.ObjectId(otherDashboardId)],
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
      otherDashboardId: dashboards[0],

      createdBy: userId
    });

await sendEmail(
  otherUser.email,
  req.session.user.name,
  amount,
  validDashboards[0].name
);
   

//     await Notification.create({
//   userId: otherUser._id,
//   title: "New settlement",
//   message: `You have pending settlement ₹${amount}`,
//   type: "settlement"
// });

const isReceiver = settlementType === "receivable";

const notificationMessage = isReceiver
  ? `You need to pay ₹${amount} to ${req.session.user.name}`
  : `${req.session.user.name} will pay you ₹${amount}`;

await Notification.create({
  userId: otherUser._id,
  title: `Settlement with ${req.session.user.name}`,
  message: notificationMessage,
  type: "settlement"
});
// console.log("Emitting notification to:", otherUser._id.toString());
// io.to(otherUser._id.toString()).emit("newNotification",{
//   title:"Settlement Pending",
//   message:`${req.session.user.name} added settlement ₹${amount}`
// });
io.to(otherUser._id.toString()).emit("newNotification",{
  title:`Settlement with ${req.session.user.name}`,
  message: notificationMessage
});
io.to(otherUser._id.toString()).emit("transactionUpdated");
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
  // const record = await Account.findById(req.params.id);
  const record = await Account.findOne({
    _id: req.params.id,
    userId: req.session.user.id
  });
  res.json(record); 
};

// UPDATE
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
    } = req.body;

    const updateData = {
      type,
      amount,
      person,
      paymentMode,
      relatedDetails: relatedDetails || "",
      description: description || "",  
      tags: tags
        ? (Array.isArray(tags)
            ? tags.map(t => t.trim())
            : [tags.trim()])
        : [],
    };
     // 🔥 DASHBOARD MOVE LOGIC
   
    if (dashboardId) {
      updateData.dashboardIds = [
        new mongoose.Types.ObjectId(dashboardId)
      ];
    }

    if (req.file) {
      updateData.attachment = req.file.filename;
      updateData.originalName = req.file.originalname;
    }

    // await Account.findByIdAndUpdate(req.params.id, updateData);
    await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.session.user.id
      },
      updateData
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
// export const deleteTransaction = async (req, res) => {
//   // await Account.findByIdAndDelete(req.params.id);
//   await Account.findOneAndDelete({
//     _id: req.params.id,
//     userId: req.session.user.id
//   });
//   res.json({ success: true });
// };
export const deleteTransaction = async (req, res) => {
  try {

    const txn = await Account.findById(req.params.id);
    
    if (!txn) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // ⭐ pending settlement security
    if (
      txn.settlementStatus === "pending" &&
      txn.createdBy.toString() !== req.session.user.id
    ) {
      return res.status(403).json({
        msg: "You cannot delete this settlement transaction"
      });
    }

    // ⭐ settlement transaction
    if (txn.settlementId) {

      // 🔴 pending → delete both
      if (txn.settlementStatus === "pending") {

        await Account.deleteMany({
          settlementId: txn.settlementId
        });

        await Settlement.deleteOne({
          _id: txn.settlementId
        });

      }

      // 🟢 settled → delete only current user record
      else {

        await Account.deleteMany({
    settlementId: txn.settlementId,
    userId: req.session.user.id
  });

      }

    } 

    else {

      // normal transaction
      await Account.deleteOne({
        _id: req.params.id,
        userId: req.session.user.id
      });

    }

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
          dashboardIds: new mongoose.Types.ObjectId(dashboardId),
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

// export const addTransaction = async (req, res) => {
//   try {
//     if (!req.session || !req.session.user || !req.session.user.id) {
//       return res.status(401).json({ msg: "Session expired" });
//     }

//     const userId = req.session.user.id;

//     const {
//       dashboardIds,
//       type,
//       amount,
//       person,
//       relatedDetails,
//       description,
//       tags,
//       paymentMode,
//       date,
      
//     } = req.body;

//        if (!dashboardIds || dashboardIds.length === 0) {
//       return res.status(400).json({
//         msg: "At least one dashboard is required"
//       });
//     }

//     if (!amount || !paymentMode || !type) {
//       return res.status(400).json({ msg: "Missing required fields" });
//     }

//     const parsedTags = tags
//     ? [...new Set(
//         tags.split(",").map(t => t.trim()).filter(Boolean)
//       )]
//     : [];

//        const dashboards = Array.isArray(dashboardIds)
//       ? dashboardIds
//       : [dashboardIds];

//         const validDashboards = await Dashboard.find({
//       _id: { $in: dashboards },
//       userId
//     });

//       if (validDashboards.length !== dashboards.length) {
//       return res.status(403).json({
//         msg: "Invalid dashboard access"
//       });
//     }

//      const records = dashboards.map(did => ({
//       userId,
//       dashboardIds: [did],
//       type,
//       amount: Number(amount),
//       person,
//       relatedDetails: relatedDetails || "",
//       description,
//       tags: parsedTags,
//       paymentMode,
//       date: date ? new Date(date) : new Date(),
//       attachment: req.file ? req.file.filename : null,
//       originalName: req.file ? req.file.originalname : null,
//      }));
//       await Account.insertMany(records);
//     res.json({ message: "Transaction added successfully" });

//   } catch (err) {
//     console.error("ADD TRANSACTION ERROR 👉", err);
//     res.status(500).json({ message: err.message });
//   }
// };
