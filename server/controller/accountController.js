
import Account from "../models/Account.js";
import Dashboard from "../models/Dashboard.js";
import User from "../models/User.js";
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
      userId,
       dashboardIds: dashboardId                    // 👈 MOST IMPORTANT CHANGE
    }).sort({ date: -1 });

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
    if (!req.session || !req.session.user || !req.session.user.id) {
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
      date
    } = req.body;

       if (!dashboardIds || dashboardIds.length === 0) {
      return res.status(400).json({
        msg: "At least one dashboard is required"
      });
    }

    if (!amount || !paymentMode || !type) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const parsedTags = tags
    ? [...new Set(
        tags.split(",").map(t => t.trim()).filter(Boolean)
      )]
    : [];

       const dashboards = Array.isArray(dashboardIds)
      ? dashboardIds
      : [dashboardIds];

        const validDashboards = await Dashboard.find({
      _id: { $in: dashboards },
      userId
    });

      if (validDashboards.length !== dashboards.length) {
      return res.status(403).json({
        msg: "Invalid dashboard access"
      });
    }

     const records = dashboards.map(did => ({
      userId,
      dashboardIds: [did],
      type,
      amount: Number(amount),
      person,
      relatedDetails: relatedDetails || "",
      description,
      tags: parsedTags,
      paymentMode,
      date: date ? new Date(date) : new Date(),
      attachment: req.file ? req.file.filename : null,
      originalName: req.file ? req.file.originalname : null,
     }));
      await Account.insertMany(records);
    res.json({ message: "Transaction added successfully" });

  } catch (err) {
    console.error("ADD TRANSACTION ERROR 👉", err);
    res.status(500).json({ message: err.message });
  }
};

// EDIT PAGE 
export const getEditTransaction = async (req, res) => {
  const record = await Account.findById(req.params.id);
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
      updateData.dashboardIds = [dashboardId];
    }

    if (req.file) {
      updateData.attachment = req.file.filename;
      updateData.originalName = req.file.originalname;
    }

    await Account.findByIdAndUpdate(req.params.id, updateData);

    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteTransaction = async (req, res) => {
  await Account.findByIdAndDelete(req.params.id);
  res.json({ success: true });
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
          paymentMode: { $ne: null }
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
