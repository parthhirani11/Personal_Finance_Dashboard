
import Account from "../models/Account.js";
import mongoose from "mongoose";

// DASHBOARD OUTPUT
export const getDashboard = async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ msg: "Session expired" });
    }
    const userId = req.session.user.id;
    const accounts = await Account.find({
      userId
    }).sort({ date: -1 });
    
    const totalIncome = accounts
      .filter(a => a.type === "income")
      .reduce((s, a) => s + a.amount, 0);

    const totalExpense = accounts
      .filter(a => a.type === "expense")
      .reduce((s, a) => s + a.amount, 0);

    res.json({
      accounts,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
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
      type,
      amount,
      person,
      description,
      tags,
      paymentMode,
      date
    } = req.body;

    if (!amount || !paymentMode || !type) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const parsedTags = tags
      ? [...new Set(
          tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        )]
      : [];

    await Account.create({
      userId,
      type,
      amount: Number(amount),
      person,
      description,
      tags: parsedTags,
      paymentMode,
      date: date ? new Date(date) : new Date(),
      attachment: req.file ? req.file.filename : null,
      originalName: req.file ? req.file.originalname : null,
    });

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
  //  const userId = req.session.user.id;
  const {
    type,
    amount,
    person,
    description,
    tags,
    paymentMode,
  } = req.body;

  const file = req.file;
  const parsedTags = tags
  ? [...new Set(
      tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
    )]
  : [];
  const updateData = {
    type,
    amount,
    person,
    description,
    tags: parsedTags,
    paymentMode,
   
  };
 if (file) {
      updateData.attachment = file.filename;
      updateData.originalName = file.originalname;
    }

  
  if (req.file) {
    updateData.attachment = req.file.filename;
    updateData.originalName = req.file.originalname;
  }

  await Account.findByIdAndUpdate(req.params.id, updateData);
  res.json({ success: true });
};

// DELETE
export const deleteTransaction = async (req, res) => {
  await Account.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

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

    res.json([...tagSet]); // ✅ unique tags

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

// GET ALL CATEGORIES (for suggestion box)
export const getAllCategories = async (req, res) => {
  try {
    // console.log("SESSION:", req.session);

    const userId = req.session.user.id; // ❌ optional chaining hatao

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

// export const getPaymentModeStats = async (req, res) => {
//   try {
//     const userId = req.session.user.id;

//   const stats = await Account.aggregate([
//   {
//     $match: {
//       userId: new mongoose.Types.ObjectId(userId),
//       paymentMode: { $ne: null }
//     }
//   },
//   {
//     $group: {
//       _id: "$paymentMode",
//       count: { $sum: 1 }
//     }
//   }
// ]);

//     res.json(stats);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

