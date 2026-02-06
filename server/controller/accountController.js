
import Account from "../models/Account.js";
import Dashboard from "../models/Dashboard.js";
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
          tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        )]
      : [];
    
    //   if (!dashboardId) {
    //   return res.status(400).json({ msg: "Dashboard is required" });
    // }
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
      description,
      tags,
    } = req.body;

    const updateData = {
      type,
      amount,
      person,
      paymentMode,
      description: description || "",  
     
      tags: tags
  ? (Array.isArray(tags) ? tags : [tags])
  : [],
    };

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

// SUGGESTED TAGS
export const getSuggestedTags = async (req, res) => {
  try {
    const records = await Account.find(
      { userId: req.session.user.id },
      { tags: 1 }
    );

    const tagSet = new Set();

    records.forEach(r => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach(tag => tagSet.add(tag));
      }
    });

    res.json([...tagSet]); //  unique tags

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

// GET ALL CATEGORIES (for suggestion box)
export const getAllCategories = async (req, res) => {
  try {
    

    const userId = req.session.user.id; // ❌ optional chaining 

    const records = await Account.find(
      { userId },
      { description: 1 }
    );

    const set = new Set();

    records.forEach(r => {
      if (r.description) {
        r.description
          .split(",")
          .map(c => c.trim().toLowerCase())
          .filter(Boolean)
          .forEach(c => set.add(c));
      }
    });

    res.json([...set]);
  } catch (err) {
    console.error("CATEGORY API ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// SUGGESTION PAYMENT MODE DATA
export const getPaymentModeStats = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const stats = await Account.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentMode: { $ne: null }
        }
      },
      {
        // NORMALIZE CASE
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
        // SORT MAX → MIN
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error("Payment mode stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
